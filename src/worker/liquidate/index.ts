import { broadcastTransaction, makeContractCall } from "@stacks/transactions";
import assert from "node:assert";
import { getBorrowersToLiquidate } from "../../borrower";
import { fetchFn, getAccountNonces } from "../../client/hiro";
import { DRY_RUN, LIQUIDATON_CAP, MIN_TO_LIQUIDATE, RBF_THRESHOLD, SKIP_SWAP_CHECK, SWAP_THRESHOLD, USE_FLASH_LOAN, USE_USDH } from "../../constants";
import { getContractList, getContractOperatorPriv, lockContract } from "../../dba/contract";
import { finalizeLiquidation, getLiquidationByTxId, insertLiquidation } from "../../dba/liquidation";
import { getMarketState } from "../../dba/market";
import { estimateSbtcToAeusdc, getDexNameById } from "../../dex";
import { estimateRbfMultiplier, estimateTxFeeOptimistic } from "../../fee";
import { toTicker } from "../../helper";
import { onLiqSwapOutError, onLiqTx, onLiqTxError, onLiqTxSwap } from "../../hooks";
import { createLogger } from "../../logger";
import { getPriceFeed } from "../../price-feed";
import { formatUnits } from "../../units";
import { epoch } from "../../util";
import { calcMinOut, limitBorrowers, makeLiquidationBatch, makeLiquidationCap, makeLiquidationTxOptions } from "./lib";

export const liquidateWorker = async () => {
    const logger = createLogger("liquidate");

    const contract = (getContractList({
        orderBy: 'CAST(market_asset_balance AS REAL) DESC'
    }))[0];

    if (!contract) {
        // logger.info(`No contract found`);
        return;
    }

    let rbfInfo: { txid: string, nonce: number, fee: number } | null = null;

    if (contract.lockTx) {
        const liquidation = getLiquidationByTxId(contract.lockTx);
        assert(liquidation, "can't find liquidation");
        if (epoch() - liquidation.createdAt >= RBF_THRESHOLD) {
            rbfInfo = { txid: contract.lockTx, nonce: liquidation.nonce, fee: liquidation.fee };
            logger.info("Doing RBF");
        } else {
            // logger.info("Contract is locked, skipping");
            return;
        }
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

    const marketState = getMarketState();
    const liquidationPremium = marketState.collateralParams[collateralAsset.address].liquidationPremium;
    const collateralTicker = toTicker(collateralAsset.symbol);
    const priceFeed = await getPriceFeed([collateralTicker], marketState);
    const borrowers = await getBorrowersToLiquidate(marketState, priceFeed);
    const cFeed = priceFeed.items[collateralTicker]!;
    const collateralPrice = Number(cFeed.price);
    const collateralPriceFormatted = formatUnits(collateralPrice, Math.abs(cFeed.expo)).toFixed(2);
    const flashLoanCapacityBn = USE_FLASH_LOAN ? (marketState.flashLoanCapacity[marketAsset.address] || 0) : 0;

    const batchInfo = makeLiquidationBatch({
        marketAsset,
        collateralAsset,
        flashLoanCapacityBn,
        borrowers: limitBorrowers(borrowers, priceFeed),
        collateralPrice,
        liquidationPremium,
        liquidationCap: makeLiquidationCap(LIQUIDATON_CAP, USE_USDH)
    });
    const { batch, spendBn, spend, receive } = batchInfo;

    if (batch.length === 0) {
        // logger.info("Nothing to liquidate");
        return;
    }

    if (spend < MIN_TO_LIQUIDATE) {
        // logger.info(`Too small to liquidate. spend: ${spend}, receive: ${receive}`);
        return;
    }

    let minExpected;
    let swap;
    let dex;
    
    // no swap if liquidation amount is under SWAP_THRESHOLD and the contract has enough market balance and no usdh mode
    const noSwap = spend < SWAP_THRESHOLD && contract.marketAsset && contract.marketAsset.balance >= spendBn && !USE_USDH;
    if (!noSwap) {
        // Swap check
        minExpected = formatUnits(calcMinOut(spendBn, contract.unprofitabilityThreshold), marketAsset.decimals);
        const usdhContext = USE_USDH ? { btcPriceBn: BigInt(cFeed.price), minterContract: contract.id } : undefined;
        swap = await estimateSbtcToAeusdc(receive, usdhContext);
        dex = getDexNameById(swap.dex);

        if (swap.dy < minExpected) {
            logger.error(`Swap out is lower than min expected. spend: ${spend} usd, receive: ${receive} btc, min expected: ${minExpected} usd, dex: ${dex}, swap out: ${swap.dy} usd`);
            await onLiqSwapOutError(spend, receive, minExpected, dex, swap.dy);

            if (!SKIP_SWAP_CHECK) {
                return;
            }
        }
    }

    if (DRY_RUN) {
        logger.info('Dry run mode on, skipping.', {
            spend: `${spend} usd`,
            receive: `${receive} btc`,
            minExpected: minExpected ? `${minExpected} usd` : '--',
            dy: swap ? `${swap.dy} usd` : '--',
            dex,
            batch,
        });
        return;
    }

    const priv = getContractOperatorPriv(contract.id)!;
    const nonce = rbfInfo ? rbfInfo.nonce : (await getAccountNonces(contract.operatorAddress, 'mainnet')).possible_next_nonce;
    const fee = rbfInfo ? rbfInfo.fee * await estimateRbfMultiplier() : await estimateTxFeeOptimistic();

    const txOptions = makeLiquidationTxOptions({
        contract,
        priv,
        nonce,
        fee,
        batchInfo,
        priceFeed,
        swap,
        useFlashLoan: USE_FLASH_LOAN,
        useUsdh: USE_USDH,
    })

    const call = await makeContractCall({ ...txOptions, network: 'mainnet', client: { fetch: fetchFn } });
    const tx = await broadcastTransaction({ transaction: call, network: 'mainnet', client: { fetch: fetchFn } });

    if ("reason" in tx) {
        if ("reason_data" in tx) {
            logger.error("Transaction failed", { reason: tx.reason, reason_data: tx.reason_data });
        } else {
            logger.error("Transaction failed", { reason: tx.reason });
        }
        await onLiqTxError(tx.reason);
        return;
    }

    if (tx.txid) {
        if (rbfInfo) {
            finalizeLiquidation(rbfInfo.txid, 'dropped');
        }
        lockContract(tx.txid, contract.id);
        insertLiquidation(tx.txid, contract.id, fee, nonce);
        logger.info('Transaction broadcasted', {
            txid: tx.txid,
            collateralPrice: `${collateralPriceFormatted} usd (${collateralPrice})`,
            spend: `${spend} usd`,
            receive: `${receive} btc`,
            minExpected: minExpected ? `${minExpected} usd` : '--',
            dy: swap ? `${swap.dy} usd` : '--',
            dex,
            batch,
        });

        if (minExpected && dex) {
            await onLiqTxSwap(tx.txid, spend, receive, minExpected, dex, collateralPriceFormatted, batch);
        } else {
            await onLiqTx(tx.txid, spend, receive, collateralPriceFormatted, batch)
        }
        return;
    }
}

export const main = async () => {
    await liquidateWorker();
}