import { describe, expect, mock, test } from "bun:test";
import { dbCon } from "../db/con";
import {
    getAccrueInterestParamsLocal,
    getCollateralParamsLocal, getDebtParamsLocal,
    getIrParamsLocal,
    getLpParamsLocal, getMarketState,
    setAccrueInterestParamsLocal, setCollateralParamsLocal, setDebtParamsLocal,
    setIrParamsLocal, setLpParamsLocal
} from "./market";

mock.module("../constants", () => {
    return {
        BORROWER_SYNC_DELAY: 10
    };
});

describe("dba market", () => {
    test("IrParamsLocal", () => {
        setIrParamsLocal({
            urKink: 100,
            baseIR: 1000,
            slope1: 2000,
            slope2: 3000,
        });
        const resp = getIrParamsLocal();
        expect(resp).toEqual({
            urKink: 100,
            baseIR: 1000,
            slope1: 2000,
            slope2: 3000,
        });
    });

    test("LpParamsLocal", () => {
        setLpParamsLocal({
            totalAssets: 1000,
            totalShares: 1000,
        });
        const resp = getLpParamsLocal();
        expect(resp).toEqual({
            totalAssets: 1000,
            totalShares: 1000,
        });
    });

    test("AccrueInterestParamsLocal", () => {
        setAccrueInterestParamsLocal({
            lastAccruedBlockTime: 1000,
        });
        const resp = getAccrueInterestParamsLocal();
        expect(resp).toEqual({
            lastAccruedBlockTime: 1000,
        });
    });

    test("DebtParamsLocal", () => {
        setDebtParamsLocal({
            openInterest: 2000,
            totalDebtShares: 1000,
        });
        const resp = getDebtParamsLocal();
        expect(resp).toEqual({
            openInterest: 2000,
            totalDebtShares: 1000,
        });
    });

    test("CollateralParamsLocal", () => {
        setCollateralParamsLocal({
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
            },
        });
        const resp = getCollateralParamsLocal();
        expect(resp).toEqual({
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
            },
        });
    });


    test("getMarketState", () => {
        dbCon.run("DELETE FROM kv_store");

        expect(() => { getMarketState() }).toThrow(Error('irParams not found'));
        setIrParamsLocal({
            urKink: 100,
            baseIR: 1000,
            slope1: 2000,
            slope2: 3000,
        });

        expect(() => { getMarketState() }).toThrow(Error('lpParams not found'));
        setLpParamsLocal({
            totalAssets: 1000,
            totalShares: 2000,
        });

        expect(() => { getMarketState() }).toThrow(Error('accrueInterestParams not found'));
        setAccrueInterestParamsLocal({
            lastAccruedBlockTime: 1000,
        });

        expect(() => { getMarketState() }).toThrow(Error('debtParams not found'));
        setDebtParamsLocal({
            openInterest: 2000,
            totalDebtShares: 1000,
        });

        expect(() => { getMarketState() }).toThrow(Error('collateralParams not found'));
        setCollateralParamsLocal({});

        expect(() => { getMarketState() }).toThrow(Error('collateralParams is empty'));
        setCollateralParamsLocal({
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
            },
        });

        const resp = getMarketState();
        expect(resp).toEqual({
            irParams: {
                urKink: 100,
                baseIR: 1000,
                slope1: 2000,
                slope2: 3000,
            },
            lpParams: {
                totalAssets: 1000,
                totalShares: 2000,
            },
            accrueInterestParams: {
                lastAccruedBlockTime: 1000,
            },
            debtParams: {
                openInterest: 2000,
                totalDebtShares: 1000,
            },
            collateralParams: {
                "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                    liquidationLTV: 100,
                    maxLTV: 200,
                },
                "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                    liquidationLTV: 120,
                    maxLTV: 209,
                },
            },
            marketAssetParams: {
                decimals: 6
            }
        });
    });
});

