import { type Collateral, type InterestRateParams } from "../types";

const secondsInAYear = 365 * 24 * 60 * 60;

/* Account */

export function calculateAccountHealth(
    collaterals: Collateral[],
    currentDebt: number,
): number {
    const totalCollateralValue = collaterals.reduce((total, collateral) => {
        if (!collateral.liquidationLTV) {
            throw new Error("LiquidationLTV is not defined");
        }
        return (
            total + collateral.amount * collateral.price * collateral.liquidationLTV
        );
    }, 0);

    if (currentDebt == 0) {
        throw new Error("Current debt cannot be zero");
    }

    return totalCollateralValue / currentDebt;
}

export function calculateTotalCollateralValue(
    collaterals: Collateral[],
): number {
    return collaterals.reduce((total, collateral) => {
        return total + collateral.amount * collateral.price;
    }, 0);
}

export function calculateAccountLiqLTV(collaterals: Collateral[]): number {
    const accountCollateralValue = calculateTotalCollateralValue(collaterals);
    if (accountCollateralValue == 0) {
        return 0;
    }

    const totalWeightedLTV = collaterals.reduce((total, collateral) => {
        const collateralValue = collateral.amount * collateral.price;
        if (!collateral.liquidationLTV) {
            throw new Error("LiquidationLTV is not defined");
        }
        return total + collateral.liquidationLTV * collateralValue;
    }, 0);

    return totalWeightedLTV / accountCollateralValue;
}

/* Borrow */

export function annualizedAPR(ur: number, irParams: InterestRateParams) {
    let ir: number;
    if (ur < irParams.urKink) ir = irParams.slope1 * ur + irParams.baseIR;
    else
        ir =
            irParams.slope2 * (ur - irParams.urKink) +
            irParams.slope1 * irParams.urKink +
            irParams.baseIR;

    return ir;
}

export function computeUtilizationRate(
    openInterest: number,
    totalAssets: number,
): number {
    if (totalAssets == 0) return 0;
    return openInterest / totalAssets;
}


export function compoundedInterest(
    debtAmt: number,
    openInterest: number,
    totalAssets: number,
    irParams: InterestRateParams,
    timeDelta: number,
): number {
    const ur: number = computeUtilizationRate(openInterest, totalAssets);
    const ir = annualizedAPR(ur, irParams);

    const interestAccrued =
        debtAmt * ((1 + ir / secondsInAYear) ** timeDelta - 1);

    return interestAccrued;
}

export function convertDebtSharesToAssets(
    debtShares: number,
    openInterest: number,
    totalDebtShares: number,
    totalAssets: number,
    irParams: InterestRateParams,
    timeDelta: number,
): number {
    if (totalDebtShares == 0) return 0;

    const accruedInterest = compoundedInterest(
        openInterest,
        openInterest,
        totalAssets,
        irParams,
        timeDelta,
    );

    return (debtShares * (openInterest + accruedInterest)) / totalDebtShares;
}


/* Liquidation */

export function calculateLiquidationPoint(
    accountLiqLTV: number,
    debtShares: number,
    openInterest: number,
    totalDebtShares: number,
    totalAssets: number,
    irParams: InterestRateParams,
    timeDelta: number,
): number {
    const accountDebt = convertDebtSharesToAssets(
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    return accountLiqLTV !== 0 ? accountDebt / accountLiqLTV : 0;
}

export const liquidatorMaxRepayAmount = (
    debtShares: number,
    openInterest: number,
    totalDebtShares: number,
    totalAssets: number,
    irParams: InterestRateParams,
    timeDelta: number,
    collateral: Collateral,
    allCollaterals: Collateral[],
) => {
    if (!collateral.liquidationLTV || !collateral.liquidationPremium)
        throw new Error("Liquidation LTV or liquidation premium are not defined");

    // Calculate total debt including accrued interest
    const debtAssets = convertDebtSharesToAssets(
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    // Calculate sum of secured values from all collaterals (Σ(value_i x liqLTV_i))
    const totalSecuredValue = allCollaterals.reduce((sum, coll) => {
        if (!coll.liquidationLTV) {
            throw new Error(
                "LiquidationLTV is not defined for one or more collaterals",
            );
        }
        return sum + coll.amount * coll.price * coll.liquidationLTV;
    }, 0);

    // Calculate maxRepayCalc according to formula:
    // (debt - Σ(value_i x liqLTV_i)) / (1 - (1 + liqDiscount_x) x liqLTV_x)
    const denominator =
        1 - (1 + collateral.liquidationPremium) * collateral.liquidationLTV;
    const maxRepayCalc = (debtAssets - totalSecuredValue) / denominator;

    // Calculate the collateral-based cap
    const collateralValue = collateral.amount * collateral.price;
    const collateralCap = collateralValue / (1 + collateral.liquidationPremium);

    // Return max(min(maxRepayCalc, collateralCap), 0)
    return Math.max(Math.min(maxRepayCalc, collateralCap), 0);
};