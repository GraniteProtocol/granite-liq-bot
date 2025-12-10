import type { StacksNetworkName } from "@stacks/network";
import { bufferCV, contractPrincipalCV, listCV, noneCV, PostConditionMode, principalCV, serializeCVBytes, someCV, tupleCV, uintCV, type SignedContractCallOptions } from "@stacks/transactions";
import { LIQUIDATON_POS_COUNT_MAX, LIQUIDATON_POS_COUNT_MIN, MIN_TO_LIQUIDATE_PER_USER, TX_TIMEOUT } from "../../constants";
import { type SwapInfo } from "../../dex";
import { hexToUint8Array } from "../../helper";
import type { ContractEntity, LiquidationBatch, LiquidationBatchWithStats, PriceFeedResponseMixed } from "../../types";
import { type AssetInfoWithBalance, type BorrowerStatusEntity } from "../../types";
import { formatUnits, parseUnits, toFixedDown } from "../../units";
import { epoch } from "../../util";


export const liquidationBatchCv = (batch: LiquidationBatch[]) => {
    const listItems = batch.map(b => someCV(tupleCV({
        "user": principalCV(b.user),
        "liquidator-repay-amount": uintCV(b.liquidatorRepayAmount),
        "min-collateral-expected": uintCV(1) // pass 1 instead of b.minCollateralExpected to avoid u30007 slippage error
    })));

    return listCV(listItems)
}

export const calcCollateralToGive = (repayAmount: bigint, liquidationDiscount: bigint, collateralPrice: bigint, collateralDecimals: bigint, marketTokenDecimals: bigint) => {

    const SCALING_FACTOR = 100000000n;

    const safeDiv = (x: bigint, y: bigint) => {
        if (y > 0n) {
            return x / y;
        }

        throw new Error("ERR-DIVIDE-BY-ZERO");
    }

    const toFixed = (a: bigint, decimalsA: bigint, fixedPrecision: bigint) => {
        if (decimalsA > fixedPrecision) {
            return a / (10n ** (decimalsA - fixedPrecision));
        } else {
            return a * (10n ** (fixedPrecision - decimalsA));
        }

    }

    const repayAmountWithDiscount = repayAmount * (SCALING_FACTOR + liquidationDiscount) / SCALING_FACTOR;
    const collateralAmount = safeDiv(repayAmountWithDiscount * SCALING_FACTOR, collateralPrice);
    const decimalCorrectedCollateral = toFixed(collateralAmount, marketTokenDecimals, collateralDecimals);

    return decimalCorrectedCollateral;
}

export const makeLiquidationBatch = ({ marketAsset, collateralAsset, flashLoanCapacityBn, borrowers, collateralPrice, liquidationPremium, liquidationCap }:
    { marketAsset: AssetInfoWithBalance, collateralAsset: AssetInfoWithBalance, flashLoanCapacityBn: number, borrowers: BorrowerStatusEntity[], collateralPrice: number, liquidationPremium: number, liquidationCap: number }): LiquidationBatchWithStats => {
    const batch: LiquidationBatch[] = [];

    let availableBn = Math.min(marketAsset.balance + flashLoanCapacityBn, parseUnits(liquidationCap, marketAsset.decimals));

    for (const borrower of borrowers) {
        if (availableBn <= 0) {
            break;
        }

        const repayAmount = borrower.maxRepay[collateralAsset.address];
        if (!repayAmount) {
            continue;
        }

        if (repayAmount < MIN_TO_LIQUIDATE_PER_USER) {
            continue;
        }

        const repayAmountAdjusted = toFixedDown(repayAmount, 3);
        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAsset.decimals);
        const repayAmountFinalBn = Math.min(availableBn, repayAmountAdjustedBn);

        const minCollateralExpected = calcCollateralToGive(BigInt(repayAmountFinalBn), BigInt(liquidationPremium), BigInt(collateralPrice), BigInt(collateralAsset.decimals), BigInt(marketAsset.decimals));

        // sometimes happens due to rounding down
        if (minCollateralExpected === 0n) {
            continue;
        }

        availableBn = availableBn - repayAmountFinalBn;

        batch.push({
            user: borrower.address,
            liquidatorRepayAmount: repayAmountFinalBn,
            minCollateralExpected: Number(minCollateralExpected)
        });
    }

    const spendBn = batch.reduce((acc, b) => acc + b.liquidatorRepayAmount, 0);
    const spend = formatUnits(spendBn, marketAsset.decimals);
    const receiveBn = batch.reduce((acc, b) => acc + b.minCollateralExpected, 0);
    const receive = formatUnits(receiveBn, collateralAsset.decimals);

    return {
        batch,
        spendBn,
        spend,
        receiveBn,
        receive
    };
}

export const calcMinOut = (paid: number, unprofitabilityThreshold: number) => {
    const SCALING_FACTOR = 10000n;

    return Number(BigInt(paid) - ((BigInt(paid) * BigInt(unprofitabilityThreshold)) / SCALING_FACTOR));
}

export const makePriceAttestationBuff = (attestation: string | null) => {
    return attestation ? someCV(bufferCV(hexToUint8Array(attestation))) : noneCV();
}

export const makeLiquidationTxOptions = (
    { contract, priv, nonce, fee, batchInfo, priceFeed, useFlashLoan, swap }:
        {
            contract: ContractEntity, priv: string, nonce: number, fee: number,
            batchInfo: LiquidationBatchWithStats, priceFeed: PriceFeedResponseMixed,
            useFlashLoan: boolean, swap?: SwapInfo
        }): SignedContractCallOptions => {
    const marketAsset = contract.marketAsset!;
    const batchCV = liquidationBatchCv(batchInfo.batch);

    const baseTxOptions = {
        senderKey: priv,
        network: 'mainnet' as StacksNetworkName,
        fee,
        validateWithAbi: true,
        postConditionMode: PostConditionMode.Allow,
        nonce
    }

    const deadline = epoch() + TX_TIMEOUT;

    if (!swap) {
        const functionArgs = [
            makePriceAttestationBuff(priceFeed.attestation),
            batchCV,
            uintCV(deadline),
        ];

        return {
            contractAddress: contract.address,
            contractName: contract.name,
            functionName: "liquidate",
            functionArgs,
            ...baseTxOptions
        };
    }
    
    
        if (useFlashLoan && marketAsset.balance < batchInfo.spendBn) {
            const callbackData = someCV(
                bufferCV(
                    serializeCVBytes(
                        tupleCV({
                            "pyth-price-feed-data": makePriceAttestationBuff(priceFeed.attestation),
                            batch: batchCV,
                            deadline: uintCV(deadline),
                            dex: uintCV(swap.dex),
                            "price-slippage-tolerance": uintCV(0),
                            "reserve-contract": principalCV("SP000000000000000000002Q6VF78")
                        })
                    )
                )
            );

            const loanAmount = batchInfo.spendBn - marketAsset.balance;

            const functionArgs = [
                uintCV(loanAmount),
                contractPrincipalCV(contract.address, contract.name),
                callbackData
            ];

            return {
                contractAddress: contract.flashLoanSc.address,
                contractName: contract.flashLoanSc.name,
                functionName: "flash-loan",
                functionArgs,
                ...baseTxOptions
            }
        } else {
            const functionArgs = [
                makePriceAttestationBuff(priceFeed.attestation),
                batchCV,
                uintCV(deadline),
                uintCV(swap.dex)
            ];

            return {
                contractAddress: contract.address,
                contractName: contract.name,
                functionName: "liquidate-with-swap",
                functionArgs,
                ...baseTxOptions
            };
        }
}

export const makeLiquidationCap = (baseCap: number) => {
    // Keep this function and add additional conditions in the future in case needed
    return baseCap;
}

export const limitBorrowers = (borrowers: BorrowerStatusEntity[], priceFeed: PriceFeedResponseMixed) => {
    return priceFeed.attestation ? borrowers.slice(0, LIQUIDATON_POS_COUNT_MIN) : borrowers.slice(0, LIQUIDATON_POS_COUNT_MAX);
}