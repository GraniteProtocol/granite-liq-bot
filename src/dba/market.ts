import assert from "assert";
import { MARKET_ASSET_DECIMAL } from "../constants";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type {
    AccrueInterestParams,
    CollateralParams, DebtParams, InterestRateParams, LpParams,
    MarketState
} from "../types";

export const getIrParamsLocal = (): InterestRateParams | null => {
    const r = kvStoreGet(`ir-params`);
    return r ? JSON.parse(r) : null;
}

export const setIrParamsLocal = (irParams: InterestRateParams) => {
    kvStoreSet(`ir-params`, JSON.stringify(irParams));
}

export const getLpParamsLocal = (): LpParams | null => {
    const r = kvStoreGet(`lp-params`);
    return r ? JSON.parse(r) : null;
}

export const setLpParamsLocal = (lpParams: LpParams) => {
    kvStoreSet(`lp-params`, JSON.stringify(lpParams));
}

export const getAccrueInterestParamsLocal = (): AccrueInterestParams | null => {
    const r = kvStoreGet(`accrue-interest-params`);
    return r ? JSON.parse(r) : null;
}

export const setAccrueInterestParamsLocal = (accrueInterestParams: AccrueInterestParams) => {
    kvStoreSet(`accrue-interest-params`, JSON.stringify(accrueInterestParams));
}

export const getDebtParamsLocal = (): DebtParams | null => {
    const r = kvStoreGet(`debt-params`);
    return r ? JSON.parse(r) : null;
}

export const setDebtParamsLocal = (debtParams: DebtParams) => {
    kvStoreSet(`debt-params`, JSON.stringify(debtParams));
}

export const getCollateralParamsLocal = (): Record<string, CollateralParams> | null => {
    const r = kvStoreGet(`collateral-params`);
    return r ? JSON.parse(r) : null;
}

export const setCollateralParamsLocal = (collateralParams: Record<string, CollateralParams>) => {
    kvStoreSet(`collateral-params`, JSON.stringify(collateralParams));
}

export const getMarketState = (): MarketState => {
    const irParams = getIrParamsLocal();
    assert(irParams, 'irParams not found');
    const lpParams = getLpParamsLocal();
    assert(lpParams, 'lpParams not found');
    const accrueInterestParams = getAccrueInterestParamsLocal();
    assert(accrueInterestParams, 'accrueInterestParams not found');
    const debtParams = getDebtParamsLocal();
    assert(debtParams, 'debtParams not found');
    const collateralParams = getCollateralParamsLocal();
    assert(collateralParams, 'collateralParams not found');
    assert(Object.keys(collateralParams).length > 0, 'collateralParams is empty');

    return {
        irParams,
        lpParams,
        accrueInterestParams,
        debtParams,
        collateralParams,
        marketAssetParams: {
            decimals: MARKET_ASSET_DECIMAL
        }
    }
}

