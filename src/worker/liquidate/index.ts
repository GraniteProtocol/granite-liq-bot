import type { StacksNetworkName } from "@stacks/network";
import { broadcastTransaction, bufferCV, makeContractCall, PostConditionMode, someCV, uintCV } from "@stacks/transactions";
import { estimateTxFeeOptimistic, fetchFn, formatUnits, getAccountNonces } from "granite-liq-bot-common";
import { getBestSwap } from "../../alex";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { DRY_RUN, MIN_TO_LIQUIDATE, SKIP_PROFITABILITY_CHECK, TX_TIMEOUT } from "../../constants";
import { dbCon } from "../../db/con";
import { getBorrowerStatusList, getBorrowersToSync } from "../../dba/borrower";
import { getContractList, getContractOperatorPriv } from "../../dba/contract";
import { getMarketState } from "../../dba/market";
import { hexToUint8Array } from "../../helper";
import { createLogger } from "../../logger";
import { epoch } from "../../util";
import { liquidationBatchCv, makeLiquidationBatch, swapOutCv } from "./lib";

const logger = createLogger("liquidate");

const worker = async () => {
    const contract = (getContractList({
        orderBy: 'market_asset_balance DESC'
    }))[0];

    if (!contract) {
        // logger.info(`No contract found`);
        return;
    }

    if (contract.lockTx) {
        // logger.info("Contract is locked, skipping");
        return;
    }

    if (getBorrowersToSync().length > 0) {
        // logger.info("Borrowers to sync found, skipping");
        return;
    }

    const { marketAsset, collateralAsset } = contract;

    if (!marketAsset) {
        logger.info("Market asset not found");
        return;
    }

    if (!collateralAsset) {
        logger.info("Collateral asset not found");
        return;
    }

    const borrowers = getBorrowerStatusList({
        orderBy: 'total_repay_amount DESC'
    });

    const marketState = getMarketState();
    const liquidationPremium = marketState.collateralParams[collateralAsset.address].liquidationPremium;
    if (!liquidationPremium) {
        throw new Error("Collateral liquidation premium not found");
    }

    const priceFeed = await fetchAndProcessPriceFeed();
    const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);
    const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed, liquidationPremium);

    if (batch.length === 0) {
        // logger.info("Nothing to liquidate");
        return;
    }

    const batchCV = liquidationBatchCv(batch);

    const totalSpendBn = batch.reduce((acc, b) => acc + b.liquidatorRepayAmount, 0);
    const totalSpend = formatUnits(totalSpendBn, marketAsset.decimals);
    const totalReceiveBn = batch.reduce((acc, b) => acc + b.minCollateralExpected, 0);
    const totalReceive = formatUnits(totalReceiveBn, collateralAsset.decimals);

    if (totalSpend < MIN_TO_LIQUIDATE) {
        // logger.info(`Too small to liquidate. total spend: ${totalSpend}, total receive: ${totalReceive}`);
        return;
    }

    // Profitability check
    const swapRoute = await getBestSwap(totalReceive);

    if (swapRoute.out < totalSpend) {
        logger.error(`Not profitable to liquidate. total spend: ${totalSpend}, total receive: ${totalReceive}, best swap: ${swapRoute.out}`);
        if (!SKIP_PROFITABILITY_CHECK) {
            return;
        }
    }

    if (DRY_RUN) {
        logger.info('Dry run mode on, skipping.', {
            totalSpend,
            totalReceive,
            batch
        });
        return;
    }

    const swapDataCv = swapOutCv(swapRoute);

    const functionArgs = [
        someCV(bufferCV(priceAttestationBuff)),
        batchCV,
        uintCV(epoch() + TX_TIMEOUT),
        swapDataCv,
    ];

    const priv = getContractOperatorPriv(contract.id)!;
    const nonce = (await getAccountNonces(contract.operatorAddress, 'mainnet')).possible_next_nonce;
    const fee = await estimateTxFeeOptimistic();

    const txOptions = {
        contractAddress: contract.address,
        contractName: contract.name,
        functionName: "liquidate-with-swap",
        functionArgs,
        senderKey: priv,
        senderAddress: contract.operatorAddress,
        network: 'mainnet' as StacksNetworkName,
        fee,
        validateWithAbi: true,
        postConditionMode: PostConditionMode.Allow,
        nonce
    }

    let call;
    try {
        call = await makeContractCall({ ...txOptions, fee });
    } catch (e) {
        logger.error(`Could not make contract call2 due to: ${e}`);
        return;
    }

    const tx = await broadcastTransaction({ transaction: call, network: 'mainnet', client: { fetch: fetchFn } });

    if ("reason" in tx) {
        if ("reason_data" in tx) {
            logger.error("Transaction failed", { reason: tx.reason, reason_data: tx.reason_data });
        } else {
            logger.error("Transaction failed", { reason: tx.reason });
        }
        return;
    }

    if (tx.txid) {
        dbCon.run("UPDATE contract SET lock_tx = ? WHERE id = ?", [tx.txid, contract.id]);
        logger.info(`Transaction broadcasted ${tx.txid}`);
        console.log('Batch', batch);
        return;
    }
}

export const main = async () => {
    await worker();
}