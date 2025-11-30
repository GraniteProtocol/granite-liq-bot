import assert from "node:assert";
import { fetchGetBorrowerPositions } from "./client/backend";
import { IR_PARAMS_SCALING_FACTOR } from "./constants";
import { toTicker } from "./helper";
import {
    calculateAccountHealth, calculateAccountLiqLTV,
    calculateLiquidationPoint,
    calculateTotalCollateralValue, convertDebtSharesToAssets, liquidatorMaxRepayAmount
} from "./math";
import type { BorrowerStatus, BorrowerStatusEntity, InterestRateParams, MarketState, PriceFeedResponseMixed } from "./types";

export const calcBorrowerStatus = (borrower: {
    debtShares: number;
    collateralsDeposited: Record<string, { amount: number, price: number, decimals: number }>;
}, marketState: MarketState): BorrowerStatus => {
    const irParams: InterestRateParams = {
        urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
        baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
        slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
        slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
    };

    const now = Date.now();
    const debtShares = borrower.debtShares / 10 ** marketState.marketAssetParams.decimals;
    const openInterest = marketState.debtParams.openInterest / 10 ** marketState.marketAssetParams.decimals;
    const totalDebtShares = marketState.debtParams.totalDebtShares / 10 ** marketState.marketAssetParams.decimals;
    const totalAssets = marketState.lpParams.totalAssets / 10 ** marketState.marketAssetParams.decimals;
    const timeDelta = Math.ceil(now / 1000) - marketState.accrueInterestParams.lastAccruedBlockTime;
    const debtAssets = convertDebtSharesToAssets(
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    const collaterals = Object.keys(borrower.collateralsDeposited).map(key => {
        const { liquidationLTV, maxLTV, liquidationPremium } = marketState.collateralParams[key];
        const {amount, price, decimals} = borrower.collateralsDeposited[key];

        return {
            id: key,
            amount: amount / 10 ** decimals,
            price: price / 10 ** decimals,
            liquidationLTV: liquidationLTV / 10 ** decimals,
            maxLTV: maxLTV / 10 ** decimals,
            liquidationPremium: liquidationPremium / 10 ** decimals,
        }
    });

    const health = calculateAccountHealth(collaterals, debtAssets);

    const accountLiqLTV = calculateAccountLiqLTV(collaterals);

    const liquidationPoint = calculateLiquidationPoint(
        accountLiqLTV,
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    const totalCollateralValue = calculateTotalCollateralValue(collaterals);

    const liquidationRisk = liquidationPoint / totalCollateralValue;

    const maxRepay: Record<string, number> = {};
    let totalRepayAmount = 0;

    if (liquidationRisk >= 1) {
        for (const collateral of collaterals) {
            const marketValueAvailableToLiquidate = liquidatorMaxRepayAmount(
                debtShares,
                openInterest,
                totalDebtShares,
                totalAssets,
                irParams,
                timeDelta,
                collateral,
                collaterals
            );

            maxRepay[collateral.id] = marketValueAvailableToLiquidate;
            totalRepayAmount += marketValueAvailableToLiquidate;
        }
    }

    return {
        health,
        debt: debtAssets,
        collateral: totalCollateralValue,
        risk: liquidationRisk,
        maxRepay,
        totalRepayAmount,
        ltv: debtAssets / totalCollateralValue,
    }
}

export const getBorrowersToLiquidate = async (marketState: MarketState, priceFeed: PriceFeedResponseMixed): Promise<BorrowerStatusEntity[]> => {
    return fetchGetBorrowerPositions().then(r => {
        return r.data.map(borrower => {
            const collateralsDeposited: Record<string, { amount: number, price: number, decimals: number }> = {};
            for (const collateral of Object.keys(borrower.collateral_balances)) {
                const amount = borrower.collateral_balances[collateral];
                assert(amount !== undefined, "User collateral amount is undefined");
                const feed = priceFeed.items[toTicker(collateral)]!;
                const price = Number(feed.price);
                const decimals = -1 * feed.expo;
                collateralsDeposited[collateral] = {
                    amount, price, decimals
                };
            }

            return {
                address: borrower.user,
                ...calcBorrowerStatus({ debtShares: borrower.debt_shares, collateralsDeposited }, marketState)
            }
        })
    })
}
