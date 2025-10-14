import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { getAccountBalances, getTransaction } from "../../client/hiro";
import { getAssetBalance, getLiquidatorContractInfo } from "../../client/read-only-call";
import { ALERT_BALANCE, CONTRACT_UNLOCK_DELAY } from "../../constants";
import { upsertBorrower } from "../../dba/borrower";
import { getContractList, unlockContract, unlockContractSchedule, updateContractBalances, updateContractFlashLoanSc, updateContractUnprofitabilityThreshold, updateContractUsdhThreshold } from "../../dba/contract";
import { finalizeLiquidation } from "../../dba/liquidation";
import { onLiqTxEnd, onLowFunds } from "../../hooks";
import { createLogger } from "../../logger";
import { type ContractEntity } from "../../types";
import { formatUnits, parseUnits } from "../../units";
import { epoch } from "../../util";
import { getLiquidatedPrincipals } from "./lib";

const logger = createLogger("sync-contract");

const handleContractLocks = async (contract: ContractEntity) => {

    if (contract.lockTx && contract.unlocksAt === null) {
        const tx = await getTransaction(contract.lockTx, 'mainnet');
        if (tx.tx_status && tx.tx_status !== "pending") {
            // schedule unlock
            unlockContractSchedule(epoch() + CONTRACT_UNLOCK_DELAY, contract.id);
            logger.info(`transaction ${contract.lockTx} completed as ${tx.tx_status}. contract ${contract.id} will be unlocked in ${CONTRACT_UNLOCK_DELAY} seconds`);

            // finalize liquidation
            finalizeLiquidation(contract.lockTx, tx.tx_status);

            // export affected principals from the transaction and activate sync
            const principals = getLiquidatedPrincipals(tx as Transaction);
            for (const principal of principals) {
                if (upsertBorrower(principal) === 2) {
                    logger.info(`Borrower ${principal} check sync activated`);
                }
            }

            await onLiqTxEnd(contract.lockTx, tx.tx_status);
        }
        return;
    }

    // unlock contract
    if (contract.lockTx && contract.unlocksAt !== null && contract.unlocksAt < epoch()) {
        unlockContract(contract.id);
        logger.info(`contract ${contract.id} unlocked`);
        return;
    }
}

export const worker = async () => {
    const contracts = getContractList({});
    for (const contract of contracts) {
        await handleContractLocks(contract);

        const oBalance = (await getAccountBalances(contract.operatorAddress, "mainnet")).stx.balance;
        const mBalance = await getAssetBalance(contract.marketAsset!.address, contract.id);
        const cBalance = await getAssetBalance(contract.collateralAsset!.address, contract.id);

        updateContractBalances(oBalance, mBalance, cBalance, contract.id);

        if (Number(oBalance) <= parseUnits(ALERT_BALANCE, 6)) {
            const strObalance = formatUnits(Number(oBalance), 6);
            logger.error(`Operator balance is low: ${strObalance} STX`)
            await onLowFunds(`${strObalance} STX`, contract.operatorAddress);
        }

        const info = await getLiquidatorContractInfo(contract.id);
        updateContractUnprofitabilityThreshold(info.unprofitabilityThreshold, contract.id);
        updateContractFlashLoanSc(info.flashLoanSc, contract.id);
        updateContractUsdhThreshold(info.usdhThreshold, contract.id);
    }
};

export const main = async () => {
    await worker();
}