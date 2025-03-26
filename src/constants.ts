require("dotenv").config();

import type { Ticker } from "./client/pyth";

export const IR_PARAMS_SCALING_FACTOR = 12;

export const MARKET_ASSET_DECIMAL = 6;

const PRODUCTION_CONTRACTS = {
    "borrower": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1",
    "state": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.state-v1",
    "ir": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.linear-kinked-ir-v1",
    "liquidator": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.liquidator-v1"
};

const STAGING_CONTRACTS = {
    "borrower": "SP1M6MHD4EJ70MPJSH1C0PXSHCQ3D9C881AB7CVAZ.borrower-v1",
    "state": "SP1M6MHD4EJ70MPJSH1C0PXSHCQ3D9C881AB7CVAZ.state-v1",
    "ir": "SP1M6MHD4EJ70MPJSH1C0PXSHCQ3D9C881AB7CVAZ.linear-kinked-ir-v1",
    "liquidator": "SP36P9SC1CKW9YN2DM0FC78Q6060BRGDWPQM96HR1.liquidator-v1"
};

const USE_STAGING = process.env.USE_STAGING === "1";

export const CONTRACTS: {
    borrower: string;
    state: string;
    ir: string;
    liquidator: string;
    collaterals: string[];
} = { ...(USE_STAGING ? STAGING_CONTRACTS : PRODUCTION_CONTRACTS), collaterals: ["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"] }

export const PRICE_FEED_IDS: { ticker: Ticker, feed_id: string }[] = [
    { ticker: "btc", feed_id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43" },
    { ticker: "eth", feed_id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace" },
    { ticker: "usdc", feed_id: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a" },
]

export const LIQUIDATION_PREMIUM = 0.1;

export const MIN_TO_LIQUIDATE = 0.1; // usdc
export const MIN_TO_LIQUIDATE_PER_USER = 0.1; // usdc
export const TX_TIMEOUT = 60 * 10; // seconds
export const BORROWER_SYNC_DELAY = 10; // seconds

export const DRY_RUN = process.env.DRY_RUN === "1";
export const SKIP_PROFITABILITY_CHECK = process.env.SKIP_PROFITABILITY_CHECK === "1";