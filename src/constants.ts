import { getMarket, toTicker } from "./helper";
import type { PriceTicker } from "./types";
import { assertEnvVar, assertNumericEnvVar } from "./util";

export const USE_STAGING = process.env.USE_STAGING === "1";

const market =  getMarket();
const { contracts } = market;

export const IR_PARAMS_SCALING_FACTOR = market.scaling_factor.toString().match(/0/g)!.length;
export const MARKET_ASSET_DECIMAL = market.market_asset.decimals;
export const MARKET_ASSET = `${market.market_asset.contract.principal}.${market.market_asset.contract.name}`;

export const CONTRACTS: {
    borrower: string;
    state: string;
    ir: string;
    liquidator: string;
    collaterals: string[];
} = {
    borrower: `${contracts.BORROWER.principal}.${contracts.BORROWER.name}`,
    state: `${contracts.STATE.principal}.${contracts.STATE.name}`,
    ir: `${contracts.INTEREST_RATE.principal}.${contracts.INTEREST_RATE.name}`,
    liquidator: `${contracts.LIQUIDATOR.principal}.${contracts.LIQUIDATOR.name}`,
    collaterals: market.collaterals.map(x => `${x.contract.principal}.${x.contract.name}`)
};

export const PRICE_FEED_IDS: { ticker: PriceTicker, feed_id: string }[] = [...market.collaterals, market.market_asset]
    .map(a => ({ ticker: toTicker(a.display_name), feed_id: `0x${a.price_feed!}` }));

export const MIN_TO_LIQUIDATE = assertNumericEnvVar("MIN_TO_LIQUIDATE", 4);
export const MIN_TO_LIQUIDATE_PER_USER = assertNumericEnvVar("MIN_TO_LIQUIDATE_PER_USER", 1);
export const TX_TIMEOUT = assertNumericEnvVar("TX_TIMEOUT", 600);
export const CONTRACT_UNLOCK_DELAY = assertNumericEnvVar("CONTRACT_UNLOCK_DELAY", 10);
export const DRY_RUN = process.env.DRY_RUN === "1";
export const SKIP_SWAP_CHECK = process.env.SKIP_SWAP_CHECK === "1";
export const USE_FLASH_LOAN = process.env.USE_FLASH_LOAN === "1";
export const USE_USDH = process.env.USE_USDH === "1";
export const USDH_SLIPPAGE_TOLERANCE = assertNumericEnvVar("USDH_SLIPPAGE_TOLERANCE", 500);
export const USDH_RESERVE_CONTRACT = assertEnvVar("USDH_RESERVE_CONTRACT", "SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.redeeming-reserve-v1-2");
export const LIQUIDATON_CAP = assertNumericEnvVar("LIQUIDATON_CAP");
export const ALERT_BALANCE = assertNumericEnvVar("ALERT_BALANCE", 1);
export const HAS_HIRO_API_KEY = process.env.HIRO_API_KEY !== undefined;
export const GRANITE_RPC = assertEnvVar("GRANITE_RPC");
export const PRICE_FEED_FRESHNESS_THRESHOLD = 300; // 5 min
export const PRICE_FEED_FRESHNESS_BUFFER = 60; // 60 secs
export const LIQUIDATON_POS_COUNT_MIN = assertNumericEnvVar("LIQUIDATON_POS_COUNT_MIN", 10);
export const LIQUIDATON_POS_COUNT_MAX = assertNumericEnvVar("LIQUIDATON_POS_COUNT_MAX", 20); 
export const RBF_THRESHOLD = 15; // seconds