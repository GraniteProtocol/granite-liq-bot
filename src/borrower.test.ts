import { afterAll, describe, expect, mock, setSystemTime, test } from "bun:test";
import { calcBorrowerStatus, getBorrowersToLiquidate } from "./borrower";
import type { LiquidationsResponse } from "./client/backend/types";
import type { MarketState, PriceFeedResponseMixed } from "./types";

describe("borrower calcBorrowerStatus", () => {
    afterAll(() => {
        mock.restore()
    })
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

describe("borrower getBorrowersToLiquidate", () => {
    test("getBorrowersToLiquidate", async () => {
        setSystemTime(1761567376 * 1000);
        const positions: LiquidationsResponse = {
            "total": 3,
            "limit": 20,
            "offset": 0,
            "data": [
                {
                    "user": "SP2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX50CQQAWN",
                    "collateral_balances": {
                        "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 166792
                    },
                    "debt_shares": 76345482,
                    "lp_shares": 0,
                    "staked_lp_shares": 0,
                    "account_health": 102556112,
                    "liquidable_amount": 0,
                    "current_debt": 84379941
                },
                {
                    "user": "SP1S2ZTV7QVAYBRJVB85FHXE7P8PZZHXVCERMEHN9",
                    "collateral_balances": {
                        "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 33300
                    },
                    "debt_shares": 15233602,
                    "lp_shares": 0,
                    "staked_lp_shares": 0,
                    "account_health": 102615099,
                    "liquidable_amount": 0,
                    "current_debt": 16836759
                },
                {
                    "user": "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7",
                    "collateral_balances": {
                        "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 89600
                    },
                    "debt_shares": 40983403,
                    "lp_shares": 0,
                    "staked_lp_shares": 0,
                    "account_health": 102628896,
                    "liquidable_amount": 0,
                    "current_debt": 45296422
                }
            ]
        };
        const fetchGetBorrowerPositionsMocked = mock(async () => positions);
        mock.module("./client/backend", () => ({
            fetchGetBorrowerPositions: fetchGetBorrowerPositionsMocked
        }));

        const marketState: MarketState = {
            irParams: {
                baseIR: 3000000000000,
                slope1: 130000000000,
                slope2: 2000000000000,
                urKink: 700000000000,
            },
            lpParams: {
                totalAssets: 1897632873,
                totalShares: 1804331782,
            },
            accrueInterestParams: {
                lastAccruedBlockTime: 1761116825,
            },
            debtParams: {
                openInterest: 140368921,
                totalDebtShares: 132562487,
            },
            collateralParams: {
                "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": {
                    liquidationLTV: 45000001,
                    maxLTV: 45000000,
                    liquidationPremium: 10000000,
                },
            },
            marketAssetParams: {
                decimals: 6,
            },
            flashLoanCapacity: {
                "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc": 1786138765,
            },
            onChainPriceFeed: {
                btc: {
                    price: "11541431918416",
                    expo: -8,
                    publish_time: 1761560232,
                },
            },
        }

        const priceFeed: PriceFeedResponseMixed = {
            attestation: "504e...",
            items: {
                btc: {
                    price: "11552632606558",
                    expo: -8,
                    publish_time: 1761565394,
                },
            },
        }

        const resp = await getBorrowersToLiquidate(marketState, priceFeed);

        expect(fetchGetBorrowerPositionsMocked).toBeCalledTimes(1);

        expect(resp).toEqual([
            {
                address: "SP2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX50CQQAWN",
                health: 1.0274512864721361,
                debt: 84.39320137668075,
                collateral: 192.6886697713022,
                risk: 0.9732821528051291,
                maxRepay: {},
                totalRepayAmount: 0,
                ltv: 0.4379769784951296,
            }, {
                address: "SP1S2ZTV7QVAYBRJVB85FHXE7P8PZZHXVCERMEHN9",
                health: 1.028042322127861,
                debt: 16.83940434455842,
                collateral: 38.47026657983814,
                risk: 0.9727225995231222,
                maxRepay: {},
                totalRepayAmount: 0,
                ltv: 0.43772517951263107,
            }, {
                address: "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7",
                health: 1.0281804889521116,
                debt: 45.30353980187933,
                collateral: 103.51158815475968,
                risk: 0.9725918851262852,
                maxRepay: {},
                totalRepayAmount: 0,
                ltv: 0.4376663580327473,
            }
        ])
    });
});