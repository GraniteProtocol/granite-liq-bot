import { CONTRACTS } from "../constants";
import { dbCon } from "./con";

export const createDb = () => {
    let CREATE = "CREATE TABLE IF NOT EXISTS kv_store(" +
        "key TEXT PRIMARY KEY NOT NULL," +
        "value TEXT NOT NULL" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS contract(" +
        "id TEXT PRIMARY KEY NOT NULL," +
        "address TEXT NOT NULL," +
        "name TEXT NOT NULL," +
        "operator_address TEXT NOT NULL," +
        "operator_priv TEXT NOT NULL," +
        "operator_balance TEXT NOT NULL DEFAULT '0'," +
        "market_asset TEXT NOT NULL," +
        "market_asset_balance TEXT NOT NULL DEFAULT '0'," +
        "collateral_asset TEXT NOT NULL," +
        "collateral_asset_balance TEXT NOT NULL DEFAULT '0'," +
        "unprofitability_threshold INTEGER NOT NULL," +
        "flash_loan_sc TEXT NOT NULL," +
        "usdh_threshold INTEGER NOT NULL," +
        "lock_tx TEXT," +
        "unlocks_at INTEGER," +
        "created_at INTEGER NOT NULL" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS borrower(" +
        "address TEXT PRIMARY KEY NOT NULL," +
        "sync_flag INTEGER NOT NULL DEFAULT 1," +
        "sync_ts INTEGER NOT NULL DEFAULT 0" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS borrower_position(" +
        "address TEXT PRIMARY KEY REFERENCES borrower(address) ON DELETE RESTRICT," +
        "debt_shares REAL NOT NULL," +
        "collaterals TEXT NOT NULL" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS borrower_collaterals(" +
        "address TEXT NOT NULL REFERENCES borrower(address) ON DELETE RESTRICT," +
        "collateral TEXT NOT NULL," +
        "amount REAL NOT NULL" +
        ");";

    CREATE += "CREATE UNIQUE INDEX IF NOT EXISTS borrower_collateral_address_idx ON borrower_collaterals (address, collateral);";

    CREATE += "CREATE TABLE IF NOT EXISTS borrower_status(" +
        "address TEXT PRIMARY KEY REFERENCES borrower(address) ON DELETE RESTRICT," +
        "ltv REAL NOT NULL," +
        "health REAL NOT NULL," +
        "debt REAL NOT NULL," +
        "collateral REAL NOT NULL," +
        "risk REAL NOT NULL," +
        "max_repay TEXT NOT NULL," +
        "total_repay_amount REAL NOT NULL" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS liquidation(" +
        "txid TEXT PRIMARY KEY NOT NULL," +
        "contract TEXT NOT NULL," +
        "status TEXT NOT NULL DEFAULT 'pending'," +
        "created_at INTEGER NOT NULL," +
        "updated_at INTEGER" +
        ");";

    CREATE += "INSERT INTO kv_store VALUES ('db_ver', 1);";
    CREATE += "INSERT INTO kv_store VALUES ('contract_hash', '" + Bun.hash(JSON.stringify(CONTRACTS)).toString() + "');";

    dbCon.run(CREATE);
    console.log("db created");
};


const updateDbVer = (ver: number) => {
    dbCon.run('UPDATE kv_store SET "value"=$1 WHERE key=$2', [ver, 'db_ver']);
    console.log(`db migrated to ver. ${ver}`);
}

const migrateToV2 = () => {
    dbCon.run("ALTER TABLE liquidation ADD COLUMN fee INTEGER");
    dbCon.run("ALTER TABLE liquidation ADD COLUMN nonce INTEGER");
    updateDbVer(2);
};

export const migrateDb = async () => {
    const exists = !!dbCon.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['kv_store']).get();
    if (!exists) {
        createDb();
    }

    const contract_hash = (dbCon.prepare('SELECT "value" FROM kv_store WHERE "key"=?', ['contract_hash']).get() as { value: string }).value;
    if (Bun.hash(JSON.stringify(CONTRACTS)).toString() !== contract_hash) {
        throw new Error('Contracts changed. Delete database and sync again.');
    }

    let dbVer = Number((dbCon.prepare('SELECT "value" FROM kv_store where "key"=? LIMIT 1', ["db_ver"]).get() as { value: string }).value);

    if (dbVer < 2) {
        migrateToV2();
    }

    /*
    if (dbVer < 3) {
        migrateToV3();
    }
    */
}
