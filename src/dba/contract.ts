import { dbCon } from "../db/con";
import { type AssetInfo, type ContractEntity } from "../types";
import { epoch } from "../util";
import { sqlSelect, type Filter } from "./sql";

export const insertContract = (address: string, operator: string, operatorPriv: string, marketAsset: AssetInfo, collateralAsset: AssetInfo, unprofitabilityThreshold: number, flashLoanSc: string) => {
    const [contractAddress, contractName] = address.trim().split('.');

    dbCon.run(`INSERT INTO contract (id, address, name, operator_address, operator_priv, market_asset, collateral_asset, unprofitability_threshold, flash_loan_sc, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            address, contractAddress, contractName, operator, operatorPriv, JSON.stringify(marketAsset), JSON.stringify(collateralAsset), unprofitabilityThreshold, flashLoanSc, epoch()
        ]);
}

export const getContractList = (args: {
    filters?: Filter[],
    orderBy?: 'created_at DESC' | 'CAST(market_asset_balance AS REAL) DESC'
}): ContractEntity[] => {
    const rows = sqlSelect({
        fields: 'id, address, name, operator_address, operator_balance, market_asset, market_asset_balance, collateral_asset, collateral_asset_balance, unprofitability_threshold, flash_loan_sc, lock_tx, unlocks_at',
        table: 'contract',
        filters: args?.filters,
        orderBy: args?.orderBy || 'created_at DESC',
    });

    return rows.map(row => ({
        id: row.id,
        address: row.address,
        name: row.name,
        operatorAddress: row.operator_address,
        operatorBalance: Number(row.operator_balance),
        marketAsset: row.market_asset ? {
            ...JSON.parse(row.market_asset),
            balance: Number(row.market_asset_balance)
        } : null,
        collateralAsset: row.collateral_asset ? {
            ...JSON.parse(row.collateral_asset),
            balance: Number(row.collateral_asset_balance)
        } : null,
        unprofitabilityThreshold: row.unprofitability_threshold,
        flashLoanSc: {
            address: row.flash_loan_sc.split(".")[0],
            name: row.flash_loan_sc.split(".")[1],
        },
        lockTx: row.lock_tx,
        unlocksAt: row.unlocks_at ? Number(row.unlocks_at) : null
    }))
}


export const getContractOperatorPriv = (contractId: string): string | undefined => {
    const row = dbCon.prepare("SELECT operator_priv FROM contract WHERE id = ?", [contractId]).get() as any;
    return row?.operator_priv;
}

export const lockContract = (txid: string, contractId: string) => {
    dbCon.run("UPDATE contract SET lock_tx = ? WHERE id = ?", [txid, contractId]);
}

export const unlockContractSchedule = (unlocksAt: number, contractId: string) => {
    dbCon.run("UPDATE contract SET unlocks_at = ? WHERE id = ?", [unlocksAt, contractId]);
}

export const unlockContract = (contractId: string) => {
    dbCon.run("UPDATE contract SET lock_tx = NULL, unlocks_at = NULL WHERE id = ?", [contractId]);
}

export const updateContractBalances = (operatorBalance: string | number, marketAssetBalance: string | number, collateralAssetBalance: string | number, contractId: string) => {
    dbCon.run("UPDATE contract SET operator_balance = ?, market_asset_balance = ?, collateral_asset_balance = ? WHERE id = ?", [operatorBalance, marketAssetBalance, collateralAssetBalance, contractId]);
}

export const updateContractUnprofitabilityThreshold = (threshold: number, contractId: string) => {
    dbCon.run("UPDATE contract SET unprofitability_threshold = ? WHERE id = ?", [threshold, contractId]);
}

export const updateContractFlashLoanSc = (flashLoanSc: string, contractId: string) => {
    dbCon.run("UPDATE contract SET flash_loan_sc = ? WHERE id = ?", [flashLoanSc, contractId]);
}
