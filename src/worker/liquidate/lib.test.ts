import { cvToJSON } from "@stacks/transactions";
import { describe, expect, test } from "bun:test";
import type { AssetInfo, BorrowerStatusEntity } from "granite-liq-bot-common";
import { options } from "../../alex";
import type { PriceFeedResponse } from "../../client/pyth";
import type { LiquidationBatch } from "../../types";
import { liquidationBatchCv, makeLiquidationBatch, swapOutCv } from "./lib";


test("liquidationBatchCv", () => {
    const batch: LiquidationBatch[] = [
        {
            user: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
            liquidatorRepayAmount: 20000000000,
            minCollateralExpected: 205455,
            details: {
                repayAmount: 0,
                repayAmountAdjusted: 0,
                repayAmountAdjustedBn: 0,
                repayAmountFinalBn: 0,
                repayAmountFinal: 0,
                collateralPrice: 0,
                minCollateralExpected: 0,
                minCollateralExpectedBn: 0,
            }
        },
        {
            user: "ST29Z7DDEPKNBP9Y17SDG3AQZMWKGS722M77HN9WR",
            liquidatorRepayAmount: 10000000000,
            minCollateralExpected: 105455,
            details: {
                repayAmount: 0,
                repayAmountAdjusted: 0,
                repayAmountAdjustedBn: 0,
                repayAmountFinalBn: 0,
                repayAmountFinal: 0,
                collateralPrice: 0,
                minCollateralExpected: 0,
                minCollateralExpectedBn: 0,
            }
        }
    ];

    expect(cvToJSON(liquidationBatchCv(batch))).toEqual({
        "type": "(list 2 (optional (tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint))))",
        "value": [
            {
                "type": "(optional (tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint)))",
                "value": {
                    "type": "(tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint))",
                    "value": {
                        "user": {
                            "type": "principal",
                            "value": "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW"
                        },
                        "liquidator-repay-amount": {
                            "type": "uint",
                            "value": "20000000000"
                        },
                        "min-collateral-expected": {
                            "type": "uint",
                            "value": "205455"
                        }
                    }
                }
            },
            {
                "type": "(optional (tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint)))",
                "value": {
                    "type": "(tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint))",
                    "value": {
                        "user": {
                            "type": "principal",
                            "value": "ST29Z7DDEPKNBP9Y17SDG3AQZMWKGS722M77HN9WR"
                        },
                        "liquidator-repay-amount": {
                            "type": "uint",
                            "value": "10000000000"
                        },
                        "min-collateral-expected": {
                            "type": "uint",
                            "value": "105455"
                        }
                    }
                }
            }
        ]
    });
});

describe("swapOutCv", () => {
    test("option 0", () => {
        const cv = swapOutCv({ option: options[0], out: 100 });

        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional none)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional none)) (factor-w (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional none)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional none)) (factor-w (optional none)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "token-w": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "token-v": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "100000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-w": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        })
    });

    /*
    disabled routes
    test("option 1", () => {
        const cv = swapOutCv({ option: options[1], out: 100 });

        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                        }
                    },
                    "token-w": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "token-v": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "100000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-w": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        })
    });

    test("option 2", () => {
        const cv = swapOutCv({ option: options[2], out: 100 });
        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional principal)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional uint))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional principal)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional uint)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-susdt"
                        }
                    },
                    "token-w": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                        }
                    },
                    "token-v": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "5000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-w": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    }
                }
            }
        });
    })


    test("option 3", () => {
        const cv = swapOutCv({ option: options[3], out: 100 });
        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                        }
                    },
                    "token-w": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "token-v": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "5000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-w": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        });
    });
    */
});


describe("makeLiquidationBatch", () => {

    const priceFeed: PriceFeedResponse = {
        "attestation": "0",
        "items": {
            "btc": {
                "id": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
                "price": {
                    "price": "9765295458695",
                    "conf": "5047541305",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "ema_price": {
                    "price": "9743841500000",
                    "conf": "4409028900",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "metadata": {
                    "slot": 196479356,
                    "proof_available_time": 1738927846,
                    "prev_publish_time": 1738927845
                }
            },
            "eth": {
                "id": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
                "price": {
                    "price": "275485757702",
                    "conf": "164804380",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "ema_price": {
                    "price": "274507820000",
                    "conf": "135476227",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "metadata": {
                    "slot": 196479356,
                    "proof_available_time": 1738927846,
                    "prev_publish_time": 1738927845
                }
            },
            "usdc": {
                "id": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                "price": {
                    "price": "99995023",
                    "conf": "112805",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "ema_price": {
                    "price": "99996136",
                    "conf": "111950",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "metadata": {
                    "slot": 196479356,
                    "proof_available_time": 1738927846,
                    "prev_publish_time": 1738927845
                }
            }
        }
    };

    let marketAsset: AssetInfo = {
        "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
        "name": "mock-usdc",
        "symbol": "mock-usdc",
        "decimals": 8,
        "balance": 2000000000
    };

    let collateralAsset: AssetInfo = {
        "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
        "name": "mock-btc",
        "symbol": "mock-btc",
        "decimals": 8,
        "balance": 0
    };

    test("20 usdc is available, 1 borrower", () => {

        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 2.125664850930649,
                },
                totalRepayAmount: 2.125664850930649,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);
        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 212500000,
                minCollateralExpected: 2176,
                details: {
                    repayAmount: 2.125664850930649,
                    repayAmountAdjusted: 2.125,
                    repayAmountAdjustedBn: 212500000,
                    repayAmountFinalBn: 212500000,
                    repayAmountFinal: 2.125,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.00002176,
                    minCollateralExpectedBn: 2176,
                },
            }
        ]);
    });

    test("20 usdc is available, 2 borrowers", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 2.125664850930649,
                },
                totalRepayAmount: 2.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 212500000,
                minCollateralExpected: 2176,
                details: {
                    repayAmount: 2.125664850930649,
                    repayAmountAdjusted: 2.125,
                    repayAmountAdjustedBn: 212500000,
                    repayAmountFinalBn: 212500000,
                    repayAmountFinal: 2.125,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.00002176,
                    minCollateralExpectedBn: 2176,
                },
            }, {
                user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                liquidatorRepayAmount: 462300000,
                minCollateralExpected: 4734,
                details: {
                    repayAmount: 4.623614857930649,
                    repayAmountAdjusted: 4.623,
                    repayAmountAdjustedBn: 462300000,
                    repayAmountFinalBn: 462300000,
                    repayAmountFinal: 4.623,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.00004734,
                    minCollateralExpectedBn: 4734,
                },
            }
        ]);
    });

    test("20 usdc is available, 3 borrowers, should not cover 3rd borrower's full repay amount", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 2.125664850930649,
                },
                totalRepayAmount: 2.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            },
            {
                address: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 17.9313224,
                },
                totalRepayAmount: 17.9313224,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 212500000,
                minCollateralExpected: 2176,
                details: {
                    repayAmount: 2.125664850930649,
                    repayAmountAdjusted: 2.125,
                    repayAmountAdjustedBn: 212500000,
                    repayAmountFinalBn: 212500000,
                    repayAmountFinal: 2.125,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.00002176,
                    minCollateralExpectedBn: 2176,
                },
            }, {
                user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                liquidatorRepayAmount: 462300000,
                minCollateralExpected: 4734,
                details: {
                    repayAmount: 4.623614857930649,
                    repayAmountAdjusted: 4.623,
                    repayAmountAdjustedBn: 462300000,
                    repayAmountFinalBn: 462300000,
                    repayAmountFinal: 4.623,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.00004734,
                    minCollateralExpectedBn: 4734,
                },
            }, {
                user: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                liquidatorRepayAmount: 1325200000,
                minCollateralExpected: 13570,
                details: {
                    repayAmount: 17.9313224,
                    repayAmountAdjusted: 17.931,
                    repayAmountAdjustedBn: 1793100000,
                    repayAmountFinalBn: 1325200000,
                    repayAmountFinal: 13.252,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.0001357,
                    minCollateralExpectedBn: 13570,
                },
            }
        ]);
    });

    test("20 usdc is available, 3 borrowers, should only cover the first borrower's partial repay amount", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 21.125664850930649,
                },
                totalRepayAmount: 21.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            },
            {
                address: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                network: "testnet",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 17.9313224,
                },
                totalRepayAmount: 17.9313224,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 2000000000,
                minCollateralExpected: 20480,
                details: {
                    repayAmount: 21.125664850930647,
                    repayAmountAdjusted: 21.125,
                    repayAmountAdjustedBn: 2112500000,
                    repayAmountFinalBn: 2000000000,
                    repayAmountFinal: 20,
                    collateralPrice: 97652.95458695,
                    minCollateralExpected: 0.0002048,
                    minCollateralExpectedBn: 20480,
                },
            }
        ])
    });
});