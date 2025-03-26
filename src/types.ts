import type { CollateralParams as CollateralParams_, Collateral as Collateral_, InterestRateParams as InterestRateParams_ } from "granite-math-sdk";


export type InterestRateParams = InterestRateParams_;

export type LpParams = {
    totalAssets: number;
    totalShares: number;
}

export type DebtParams = {
    openInterest: number;
    totalDebtShares: number;
}

export type AccrueInterestParams = {
    lastAccruedBlockTime: number;
}

export type CollateralParams = CollateralParams_ & { liquidationLTV: number, maxLTV: number };

export type Collateral = Collateral_;

export type MarketAssetParams = {
    decimals: number;
}

export type MarketState = {
    irParams: InterestRateParams;
    lpParams: LpParams;
    accrueInterestParams: AccrueInterestParams;
    debtParams: DebtParams;
    collateralParams: Record<string, CollateralParams>;
    marketAssetParams: MarketAssetParams;
}

export type BorrowerEntity = {
    address: string,
    syncTs: number
}

export type BorrowerPositionEntity = {
    address: string,
    debtShares: number,
    collaterals: string[]
}

export type BorrowerCollateralEntity = {
    address: string,
    collateral: string,
    amount: number
}

export type LiquidationBatch = {
    user: string,
    liquidatorRepayAmount: number,
    minCollateralExpected: number,
}