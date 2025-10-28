import { describe, expect, test } from "bun:test";
import { dbCon } from "../db/con";
import {
    getAccrueInterestParamsLocal,
    getCollateralParamsLocal, getDebtParamsLocal,
    getFlashLoanCapacityLocal,
    getIrParamsLocal,
    getLpParamsLocal, getMarketState,
    getOnChainPriceFeed,
    setAccrueInterestParamsLocal, setCollateralParamsLocal, setDebtParamsLocal,
    setFlashLoanCapacityLocal,
    setIrParamsLocal, setLpParamsLocal,
    setOnChainPriceFeed
} from "./market";

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
                liquidationPremium: 10000000,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
                liquidationPremium: 10000000,
            },
        });
        const resp = getCollateralParamsLocal();
        expect(resp).toEqual({
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
                liquidationPremium: 10000000,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
                liquidationPremium: 10000000,
            },
        });
    });

    test("FlashLoanCapacityLocal", () => {
        setFlashLoanCapacityLocal({ 'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc': 102543 });
        const resp = getFlashLoanCapacityLocal();
        expect(resp).toEqual({
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc": 102543,
        });
    });

    test("OnChainPriceFeed", () => {
        setOnChainPriceFeed({
            "btc": {
                price: "11470000751501",
                expo: -8,
                publish_time: 1754045925,
            }
        });
        const resp = getOnChainPriceFeed();
        expect(resp).toEqual({
            "btc": {
                price: "11470000751501",
                expo: -8,
                publish_time: 1754045925,
            }
        })
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
                liquidationPremium: 10000000,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
                liquidationPremium: 10000000,
            },
        });

        expect(() => { getMarketState() }).toThrow(Error('flashLoanCapacity not found'));
        setFlashLoanCapacityLocal({ 'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc': 1025785 })

        expect(() => { getMarketState() }).toThrow(Error('onChainPriceFeed not found'));
        setOnChainPriceFeed({})

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
                    liquidationPremium: 10000000,
                },
                "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                    liquidationLTV: 120,
                    maxLTV: 209,
                    liquidationPremium: 10000000,
                },
            },
            marketAssetParams: {
                decimals: 6
            },
            flashLoanCapacity: { "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc": 1025785 },
            onChainPriceFeed: {
            }
        });

        setOnChainPriceFeed({
            "btc": {
                price: "11470000751501",
                expo: -8,
                publish_time: 1754045925,
            }
        });

        const resp2 = getMarketState();
        expect(resp2.onChainPriceFeed).toEqual({
            "btc": {
                price: "11470000751501",
                expo: -8,
                publish_time: 1754045925,
            }
        })
    });
});

