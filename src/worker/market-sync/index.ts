import { getAccrueInterestParams, getCollateralParams, getDebtParams, getIrParams, getLpParams } from "../../client/read-only-call";
import { CONTRACTS } from "../../constants";

import { dbCon } from "../../db/con";
import {
    setAccrueInterestParamsLocal, setCollateralParamsLocal,
    setDebtParamsLocal, setIrParamsLocal, setLpParamsLocal
} from "../../dba/market";
import { createLogger } from "../../logger";
import type { CollateralParams } from "../../types";
import { epoch } from "../../util";

const logger = createLogger("market-sync");

const lastSyncTs = {
    irParams: 0,
    lpParams: 0,
    accrueInterestParams: 0,
    debtParams: 0,
    collateralParams: 0,
    priceFeed: 0,
}

const syncMarketState = async () => {
    dbCon.run("BEGIN");
    
        const now = epoch();

        if (lastSyncTs.irParams < now - 600) {
            const val = await getIrParams();
            setIrParamsLocal(val);
            // logger.info(`setIrParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs.irParams = now;
        }

        if (lastSyncTs.lpParams < now - 30) {
            const val = await getLpParams();
            setLpParamsLocal(val);
            //logger.info(`setLpParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs.lpParams = now;
        }

        if (lastSyncTs.accrueInterestParams < now - 30) {
            const val = await getAccrueInterestParams();
            setAccrueInterestParamsLocal(val);
            // logger.info(`setAccrueInterestParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs.accrueInterestParams = now;
        }

        if (lastSyncTs.debtParams < now - 30) {
            const val = await getDebtParams();
            setDebtParamsLocal(val);
            // logger.info(`setDebtParamsLocal: ${network} ${JSON.stringify(val)}`);
            lastSyncTs.debtParams = now;
        }

        if (lastSyncTs.collateralParams < now - 30) {
            const collateralParams: Record<string, CollateralParams> = {};
            for (const collateral of CONTRACTS.collaterals) {
                collateralParams[collateral] = await getCollateralParams(collateral);
            }
            setCollateralParamsLocal(collateralParams);
            // logger.info(`setCollateralParamsLocal: ${network} ${JSON.stringify(collateralParams)}`);
            lastSyncTs.collateralParams = now;
        }


    dbCon.run("COMMIT");
    
    // logger.info(`setPriceFeedLocal: ${JSON.stringify(priceFeed)}`);
}

export const main = async () => {
    await syncMarketState();
}

