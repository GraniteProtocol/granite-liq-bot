import { type AssetInfo, type ContractEntity, type NetworkName } from "granite-liq-bot-common";
import { dbCon } from "../db/con";
import { epoch } from "../util";

export const insertContract = (address: string, operator: string, operatorPriv: string, marketAsset: AssetInfo, collateralAsset: AssetInfo) => {
    const [contractAddress, contractName] = address.trim().split('.');

    dbCon.run(`INSERT INTO contract (id, address, name, operator_address, operator_priv, market_asset, collateral_asset, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            address, contractAddress, contractName, operator, operatorPriv, JSON.stringify(marketAsset), JSON.stringify(collateralAsset), epoch()
        ]);
}

export const getContractList = (args: {
    filters?: Record<string, string>,
    orderBy?: 'created_at DESC' | 'market_asset_balance DESC'
}): ContractEntity[] => {
    const filters = args?.filters || {};
    const orderBy = args?.orderBy || 'created_at DESC';

    let sql = 'SELECT id, address, name, operator_address, market_asset, market_asset_balance, collateral_asset, collateral_asset_balance, lock_tx, unlocks_at FROM contract';
    if (Object.keys(filters).length > 0) {
        sql += ' WHERE ' + Object.keys(filters).map((key, index) => `${key} = ?`).join(' AND ');
    }
    sql += ` ORDER BY ${orderBy}`;

    const rows = dbCon.prepare(sql, Object.values(filters)).all() as any[];
    return rows.map(row => ({
        id: row.id,
        address: row.address,
        name: row.name,
        operatorAddress: row.operator_address,
        marketAsset: row.market_asset ? {
            ...JSON.parse(row.market_asset),
            balance: Number(row.market_asset_balance)
        } : null,
        collateralAsset: row.collateral_asset ? {
            ...JSON.parse(row.collateral_asset),
            balance: Number(row.collateral_asset_balance)
        } : null,
        lockTx: row.lock_tx,
        unlocksAt: row.unlocks_at ? Number(row.unlocks_at) : null
    }))
}


export const getContractOperatorPriv = (contractId: string): string | undefined => {
    const row = dbCon.prepare("SELECT operator_priv FROM contract WHERE id = ?", [contractId]).get() as any;
    return row?.operator_priv;
}