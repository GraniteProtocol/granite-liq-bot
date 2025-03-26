import type { BorrowerStatus } from "granite-liq-bot-common";
import { type BorrowerStatusEntity } from "granite-liq-bot-common";
import { BORROWER_SYNC_DELAY } from "../constants";
import { dbCon } from "../db/con";
import type {
    BorrowerCollateralEntity, BorrowerEntity,
    BorrowerPositionEntity
} from "../types";
import { epoch } from "../util";

export const upsertBorrower = (address: string): 0 | 1 | 2 => {
    const rec = dbCon.prepare("SELECT sync_flag FROM borrower WHERE address = ?", [address]).get() as any;
    // wait some time before syncing to make sure blockchain data settled
    const syncTs = epoch() + BORROWER_SYNC_DELAY;
    if (!rec) {
        dbCon.run("INSERT INTO borrower (address, sync_flag, sync_ts) VALUES (?, ?, ?)", [
            address,
            1,
            syncTs
        ]);
        return 1;
    } else {
        if (rec.sync_flag === 0) {
            dbCon.run("UPDATE borrower SET sync_flag = 1, sync_ts=? WHERE address = ?", [syncTs, address]);
            return 2;
        }
    }
    return 0;
}



export const getBorrowersToSync = (): BorrowerEntity[] => {
    const rows = dbCon.query("SELECT address, sync_ts FROM borrower WHERE sync_flag = 1").all() as any[];
    return rows.map(x => ({
        address: x.address,
        syncTs: x.sync_ts
    }));
}

export const switchBorrowerSyncFlagOff = (address: string) => {
    return dbCon.run("UPDATE borrower SET sync_flag = 0, sync_ts = 0 WHERE address = ?", [address]);
}

export const syncBorrowerPosition = (userPosition: BorrowerPositionEntity) => {
    dbCon.run("DELETE FROM borrower_position WHERE address = ? ", [userPosition.address]);
    dbCon.run("INSERT INTO borrower_position (address, debt_shares, collaterals) VALUES (?, ?, ?)",
        [userPosition.address, userPosition.debtShares, JSON.stringify(userPosition.collaterals)]);
}

export const syncBorrowerCollaterals = (address: string, collaterals: Omit<BorrowerCollateralEntity, 'address'>[]) => {
    dbCon.run("DELETE FROM borrower_collaterals WHERE address = ?", [address]);

    for (const collateral of collaterals) {
        dbCon.run("INSERT INTO borrower_collaterals (address, collateral, amount) VALUES (?, ?, ?)",
            [address, collateral.collateral, collateral.amount]);
    }
}

export const getBorrowersForHealthCheck = (): { address: string, debtShares: number, collaterals: string[] }[] => {
    const rows = dbCon.query("SELECT address, debt_shares, collaterals FROM borrower_position").all() as any[];
    return rows.map(row => ({
        address: row.address,
        debtShares: Number(row.debt_shares),
        collaterals: JSON.parse(row.collaterals)
    }))
}

export const getBorrowerCollateralAmount = (address: string, collateral: string): number | undefined => {
    const row = dbCon.prepare("SELECT amount FROM borrower_collaterals WHERE address=? AND collateral=?", [address, collateral]).get() as any;
    return row ? Number(row.amount) : undefined;
}

export const clearBorrowerStatuses = () => {
    dbCon.run("DELETE FROM borrower_status");
}

export const insertBorrowerStatus = (address: string, status: BorrowerStatus) => {
    dbCon.run(
        `INSERT INTO borrower_status (
            address, ltv, health, debt, collateral, risk, max_repay, total_repay_amount
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [address, status.ltv.toFixed(4), status.health.toFixed(4), status.debt.toFixed(4), status.collateral.toFixed(4), status.risk.toFixed(4), JSON.stringify(status.maxRepay), status.totalRepayAmount])
}

export const getBorrowerStatusList = (args: {
    filters?: Record<string, string>,
    orderBy?: 'total_repay_amount DESC, risk DESC' | 'total_repay_amount DESC'
}): BorrowerStatusEntity[] => {
    const filters = args?.filters || {};
    const orderBy = args?.orderBy || 'total_repay_amount DESC, risk DESC';

    let sql = 'SELECT * FROM borrower_status';
    if (Object.keys(filters).length > 0) {
        sql += ' WHERE ' + Object.keys(filters).map((key) => `${key} = ?`).join(' AND ');
    }
    sql += ` ORDER BY ${orderBy}`;

    const rows = dbCon.prepare(sql, Object.values(filters)).all() as any[];
    return rows.map(row => ({
        address: row.address,
        ltv: Number(row.ltv),
        health: Number(row.health),
        debt: Number(row.debt),
        collateral: Number(row.collateral),
        risk: Number(row.risk),
        maxRepay: JSON.parse(row.max_repay),
        totalRepayAmount: Number(row.total_repay_amount)
    }));
}   
