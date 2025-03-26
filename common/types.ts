export type NetworkName = "mainnet" | "testnet";

export type AssetInfo = {
    address: string,
    name: string,
    symbol: string,
    decimals: number,
}

export type AssetInfoWithBalance = AssetInfo & {
    balance: number,
}

export type ContractEntity = {
    id: string,
    address: string,
    name: string,
    operatorAddress: string,
    marketAsset: AssetInfoWithBalance | null,
    collateralAsset: AssetInfoWithBalance | null,
    lockTx: string | null
    unlocksAt: number | null,
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