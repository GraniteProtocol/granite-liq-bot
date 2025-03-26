import type { NetworkName } from "granite-liq-bot-common";
import { getAccrueInterestParams, getCollateralParams, getDebtParams, getIrParams, getLpParams } from "../../client/read-only-call";
import { CONTRACTS } from "../../constants";

import { dbCon } from "../../db/con";
import {
    setAccrueInterestParamsLocal, setCollateralParamsLocal,
    setDebtParamsLocal, setIrParamsLocal, setLpParamsLocal
} from "../../dba/market";
import { getNetworkNameFromAddress } from "../../helper";
import { createLogger } from "../../logger";
import type { CollateralParams } from "../../types";
import { epoch } from "../../util";

const logger = createLogger("market-sync");

const lastSyncTs = {
    "mainnet": {
        irParams: 0,
        lpParams: 0,
        accrueInterestParams: 0,
        debtParams: 0,
        collateralParams: 0,
        priceFeed: 0,
    },
    "testnet": {
        irParams: 0,
        lpParams: 0,
        accrueInterestParams: 0,
        debtParams: 0,
        collateralParams: 0,
        priceFeed: 0,
    }
}

const syncMarketState = async () => {
    dbCon.run("BEGIN");

    for (const network of ["mainnet"] as NetworkName[]) {
        const now = epoch();

        if (lastSyncTs[network].irParams < now - 600) {
            const val = await getIrParams(network);
            setIrParamsLocal(network, val);
            // logger.info(`setIrParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs[network].irParams = now;
        }

        if (lastSyncTs[network].lpParams < now - 30) {
            const val = await getLpParams(network);
            setLpParamsLocal(network, val);
            //logger.info(`setLpParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs[network].lpParams = now;
        }

        if (lastSyncTs[network].accrueInterestParams < now - 30) {
            const val = await getAccrueInterestParams(network);
            setAccrueInterestParamsLocal(network, val);
            // logger.info(`setAccrueInterestParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs[network].accrueInterestParams = now;
        }

        if (lastSyncTs[network].debtParams < now - 30) {
            const val = await getDebtParams(network);
            setDebtParamsLocal(network, val);
            // logger.info(`setDebtParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs[network].debtParams = now;
        }

        if (lastSyncTs[network].collateralParams < now - 30) {
            const collaterals = CONTRACTS.collaterals;
            const collateralParams: Record<string, CollateralParams> = {};
            for (const collateral of collaterals.filter(c => getNetworkNameFromAddress(c) === network)) {
                collateralParams[collateral] = await getCollateralParams(collateral, network);
            }
            setCollateralParamsLocal(network, collateralParams);
            // logger.info(`setCollateralParamsLocal: ${network} ${JSON.stringify(collateralParams)}`);
            lastSyncTs[network].collateralParams = now;
        }
    }

    dbCon.run("COMMIT");
    
    // logger.info(`setPriceFeedLocal: ${JSON.stringify(priceFeed)}`);
}

export const main = async () => {
    await syncMarketState();
}

