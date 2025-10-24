import { fetchGetMarketInfo } from "../../client/backend";
import { getIrParams, getPythPriceFeed } from "../../client/read-only-call";
import { MARKET_ASSET } from "../../constants";
import {
    setAccrueInterestParamsLocal, setCollateralParamsLocal,
    setDebtParamsLocal, setFlashLoanCapacityLocal, setIrParamsLocal, setLpParamsLocal,
    setOnChainPriceFeed
} from "../../dba/market";
import { getMarket, toTicker } from "../../helper";
import { createLogger } from "../../logger";
import type { CollateralParams, PriceFeedItem, PriceTicker } from "../../types";
import { epoch } from "../../util";

const logger = createLogger("market-sync");

const lastSyncTs = {
    irParams: 0,
}

const syncMarketState = async () => {
    const now = epoch();

    if (lastSyncTs.irParams < now - 7200) { // 2 hours
        const val = await getIrParams();
        setIrParamsLocal(val);
        // logger.info(`setIrParamsLocal: ${JSON.stringify(val)}`);
        lastSyncTs.irParams = now;
    }

    const marketInfo = await fetchGetMarketInfo();

    setLpParamsLocal({
        totalAssets: marketInfo.onchain_interest_params.total_assets,
        totalShares: marketInfo.total_lp_shares
    });

    setAccrueInterestParamsLocal({
        lastAccruedBlockTime: marketInfo.onchain_interest_params.last_accrued_block_time
    });

    setDebtParamsLocal({
        openInterest: marketInfo.onchain_interest_params.open_interest,
        totalDebtShares: marketInfo.total_debt_shares
    });

    const collateralParams: Record<string, CollateralParams> = {};
    for (const collateral of marketInfo.collaterals) {
        collateralParams[collateral.id] = {
            liquidationLTV: collateral.liquidation_ltv,
            maxLTV: collateral.max_ltv,
            liquidationPremium: collateral.liquidation_premium
        }
    }
    setCollateralParamsLocal(collateralParams);

    setFlashLoanCapacityLocal({ [MARKET_ASSET]: marketInfo. market_token_balance});

    const onChainPriceFeed: Partial<Record<PriceTicker, PriceFeedItem>> = {};
    for (let coll of getMarket().collaterals) {
        const feed = await getPythPriceFeed(`0x${coll.price_feed}`);
        if (feed) {
            onChainPriceFeed[toTicker(coll.contract.id)] = feed;
        }
    }

    setOnChainPriceFeed(onChainPriceFeed);
}

export const main = async () => {
    await syncMarketState();
}

