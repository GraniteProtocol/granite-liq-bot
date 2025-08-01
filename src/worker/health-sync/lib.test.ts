import { describe, expect, setSystemTime, test } from "bun:test";
import type { MarketState } from "../../types";
import { calcBorrowerStatus } from "./lib";

describe("health-sync lib", () => {
    test("calcBorrowerStatus 1", () => {
        setSystemTime(1738262052565);
        const marketState: MarketState = {
            irParams: {
                baseIR: 3000000000000,
                slope1: 130000000000,
                slope2: 2000000000000,
                urKink: 700000000000,
            },
            lpParams: {
                totalAssets: 1248927534554720,
                totalShares: 1249258900378186,
            },
            accrueInterestParams: {
                lastAccruedBlockTime: 1738245754,
            },
            debtParams: {
                openInterest: 117785897824021,
                totalDebtShares: 96783307587268,
            },
            collateralParams: {
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                    liquidationLTV: 80000000,
                    maxLTV: 70000000,
                    liquidationPremium: 10000000,
                },
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                    liquidationLTV: 51000000,
                    maxLTV: 50000000,
                    liquidationPremium: 10000000,
                },
            },
            marketAssetParams: {
                decimals: 8
            },
            flashLoanCapacity: { "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc": 0 },
            onChainPriceFeed: {
                "btc": {
                    price: "11470000751501",
                    expo: -8,
                    publish_time: 1754045925,
                }
            }
        };

        const borrower = {
            debtShares: 43213934616323,
            collateralsDeposited: {
                'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                    amount: 7000000000,
                    price: 326603000000,
                    decimals: 8

                },
                'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                    amount: 500000000,
                    price: 10524868578626,
                    decimals: 8,
                }
            }
        }

        expect(calcBorrowerStatus(borrower, marketState)).toEqual({
            ltv: 0.6977874992015272,
            health: 1.0206104956758972,
            debt: 526735.7296664099,
            collateral: 754865.5289313,
            risk: 0.9798057184761282,
            maxRepay: {},
            totalRepayAmount: 0
        });
    });

    test("calcBorrowerStatus 2", () => {
        setSystemTime(1738262557287);
        const marketState: MarketState = {
            irParams: {
                baseIR: 3000000000000,
                slope1: 130000000000,
                slope2: 2000000000000,
                urKink: 700000000000,
            },
            lpParams: {
                totalAssets: 1248927534554720,
                totalShares: 1249258900378186,
            },
            accrueInterestParams: {
                lastAccruedBlockTime: 1738245754,
            },
            debtParams: {
                openInterest: 117785897824021,
                totalDebtShares: 96783307587268,
            },
            collateralParams: {
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                    liquidationLTV: 80000000,
                    maxLTV: 70000000,
                    liquidationPremium: 10000000,
                },
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                    liquidationLTV: 51000000,
                    maxLTV: 50000000,
                    liquidationPremium: 10000000,
                },
            },
            marketAssetParams: {
                decimals: 8
            },
            flashLoanCapacity: { "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc": 0 },
            onChainPriceFeed: {
                "btc": {
                    price: "11470000751501",
                    expo: -8,
                    publish_time: 1754045925,
                }
            }
        }

        const borrower = {
            debtShares: 1233675334672,
            collateralsDeposited: {
                'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                    amount: 658317537,
                    price: 327439303121,
                    decimals: 8
                }
            }
        }

        expect(calcBorrowerStatus(borrower, marketState)).toEqual({
            ltv: 0.6976290663298624,
            health: 0.7310475216909251,
            debt: 15038.024870804698,
            collateral: 21555.903554761313,
            risk: 1.3679001300585538,
            maxRepay: {
                'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': 9213.016077167267
            },
            totalRepayAmount: 9213.016077167267
        });
    });
});