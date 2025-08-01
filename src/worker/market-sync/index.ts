import { getAccrueInterestParams, getAssetBalance, getCollateralParams, getDebtParams, getIrParams, getLpParams, getPythPriceFeed } from "../../client/read-only-call";
import { CONTRACTS, MARKET_ASSET } from "../../constants";
import {
    setAccrueInterestParamsLocal, setCollateralParamsLocal,
    setDebtParamsLocal, setFlashLoanCapacityLocal, setIrParamsLocal, setLpParamsLocal,
    setOnChainPriceFeed
} from "../../dba/market";
import { getMarket, toTicker } from "../../helper";
import { createLogger } from "../../logger";
import type { CollateralParams, PriceFeedItem } from "../../types";
import { epoch } from "../../util";

const logger = createLogger("market-sync");

const lastSyncTs = {
    irParams: 0,
    lpParams: 0,
    accrueInterestParams: 0,
    debtParams: 0,
    collateralParams: 0,
    priceFeed: 0,
    flashLoanCapacity: 0
}

const syncMarketState = async () => {
    const now = epoch();

    if (lastSyncTs.irParams < now - 7200) { // 2 hours
        const val = await getIrParams();
        setIrParamsLocal(val);
        // logger.info(`setIrParamsLocal: ${JSON.stringify(val)}`);
        lastSyncTs.irParams = now;
    }

    if (lastSyncTs.lpParams < now - 300) { // 5 mins
        const val = await getLpParams();
        setLpParamsLocal(val);
        //logger.info(`setLpParamsLocal: ${JSON.stringify(val)}`);
        lastSyncTs.lpParams = now;
    }

    if (lastSyncTs.accrueInterestParams < now - 300) { // 5 mins
        const val = await getAccrueInterestParams();
        setAccrueInterestParamsLocal(val);
        // logger.info(`setAccrueInterestParamsLocal: ${JSON.stringify(val)}`);
        lastSyncTs.accrueInterestParams = now;
    }

    if (lastSyncTs.debtParams < now - 300) { // 5 mins
        const val = await getDebtParams();
        setDebtParamsLocal(val);
        // logger.info(`setDebtParamsLocal: ${JSON.stringify(val)}`);
        lastSyncTs.debtParams = now;
    }

    if (lastSyncTs.collateralParams < now - 300) { // 5 mins
        const collateralParams: Record<string, CollateralParams> = {};
        for (const collateral of CONTRACTS.collaterals) {
            collateralParams[collateral] = await getCollateralParams(collateral);
        }
        setCollateralParamsLocal(collateralParams);
        // logger.info(`setCollateralParamsLocal: ${JSON.stringify(collateralParams)}`);
        lastSyncTs.collateralParams = now;
    }

    if (lastSyncTs.flashLoanCapacity < now - 300) { // 5 mins
        const flashLoanCapacity = await getAssetBalance(MARKET_ASSET, CONTRACTS.state);
        setFlashLoanCapacityLocal({ [MARKET_ASSET]: flashLoanCapacity });
        lastSyncTs.flashLoanCapacity = now;
    }

    const onChainPriceFeed: Record<string, PriceFeedItem> = {};
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

