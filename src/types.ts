

export type AssetInfo = {
    address: string,
    name: string,
    symbol: string,
    decimals: number,
}

export type AssetInfoWithBalance = AssetInfo & {
    balance: number,
}

export type BorrowerStatus = {
    ltv: number,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    maxRepay: Record<string, number>,
    totalRepayAmount: number
}

export type BorrowerStatusEntity = BorrowerStatus & { address: string }

export type ContractEntity = {
    id: string,
    address: string,
    name: string,
    operatorAddress: string,
    operatorBalance: number,
    marketAsset: AssetInfoWithBalance | null,
    collateralAsset: AssetInfoWithBalance | null,
    unprofitabilityThreshold: number,
    flashLoanSc: {
        address: string,
        name: string
    },
    usdhThreshold: number,
    lockTx: string | null
    unlocksAt: number | null,
}

export type LiquidationEntity = {
    txid: string,
    contract: string,
    status: string,
    createdAt: number,
    updatedAt: number | null,
    fee: number,
    nonce: number,
}

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

export interface CollateralParams {
    liquidationLTV: number;
    maxLTV: number;
    liquidationPremium: number;
}

export interface Collateral extends CollateralParams {
    amount: number;
    price: number;
}

export type InterestRateParams = {
    urKink: number;
    baseIR: number;
    slope1: number;
    slope2: number;
};

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
    flashLoanCapacity: Record<string, number>,
    onChainPriceFeed: Partial<Record<PriceTicker, PriceFeedItem>>
}

export type LiquidationBatch = {
    user: string,
    liquidatorRepayAmount: number,
    minCollateralExpected: number,
}

export type LiquidationBatchWithStats = {
    batch: LiquidationBatch[],
    spendBn: number,
    spend: number,
    receiveBn: number,
    receive: number,
}

export type UsdhState = {
    reserveBalance: number,
    safeTradeAmount: number,
}

export type PriceTicker = "btc" | "eth" | "usdc";

export type PriceFeedItem = {
    price: string,
    expo: number,
    publish_time: number,
}

export type PriceFeedResponse = {
    attestation: string,
    items: Partial<Record<PriceTicker, PriceFeedItem>>;
}

export type PriceFeedResponseMixed = {
    attestation: string | null;
    items: Partial<Record<PriceTicker, PriceFeedItem>>;
}