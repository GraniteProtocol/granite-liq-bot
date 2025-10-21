import { dbCon } from "../db/con";
import type { LiquidationEntity } from "../types";
import { epoch } from "../util";
import { sqlSelect, type Filter } from "./sql";

export const insertLiquidation = (txid: string, contract: string, fee: number, nonce: number) => {
    dbCon.run(`INSERT INTO liquidation (txid, contract, created_at, fee, nonce) VALUES (?, ?, ?, ?, ?)`, [txid, contract, epoch(), fee, nonce]);
}

export const finalizeLiquidation = (txid: string, status: string) => {
    dbCon.run("UPDATE liquidation SET status = ?, updated_at = ? WHERE txid = ?", [status, epoch(), txid]);
}

export const getLiquidationList = (args: {
    filters?: Filter[],
    orderBy?: 'created_at DESC',
    limit?: number,
}): LiquidationEntity[] => {
    const rows = sqlSelect({
        fields: 'txid, contract, status, created_at, updated_at, fee, nonce',
        table: 'liquidation',
        filters: args?.filters,
        orderBy: args?.orderBy || 'created_at DESC',
        limit: args?.limit || 10
    });

    return rows.map(row => ({
        txid: row.txid,
        contract: row.contract,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        fee: row.fee,
        nonce: row.nonce
    }));
}