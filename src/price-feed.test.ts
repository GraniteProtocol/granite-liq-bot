import { expect, mock, setSystemTime, test } from "bun:test";
import { getPriceFeed } from "./price-feed";
import type { MarketState } from "./types";

test("should use onchain price", async () => {
    setSystemTime(1754045720 * 1000);

    const marketState: MarketState = {
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
            "btc": {
                price: "11470000751501",
                expo: -8,
                publish_time: 1754045481,
            }
        }
    };

    const resp = await getPriceFeed("btc", marketState);
    expect(resp).toEqual(
        {
            attestation: null,
            price: "11470000751501",
            expo: -8,
            publish_time: 1754045481,
        }
    );
});

test("should use live price when no on chain price", async () => {
    mock.module('./client/pyth', () => {
        return {
            fetchAndProcessPriceFeed: () => ({
                attestation: "00000",
                items: {
                    btc: {
                        price: "11674968340348",
                        expo: -8,
                        publish_time: 1754045721,
                    }
                }
            })
        }
    });

    const marketState: MarketState = {
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
    };

    const resp = await getPriceFeed("btc", marketState);
    expect(resp).toEqual(
        {
            attestation: "00000",
            price: "11674968340348",
            expo: -8,
            publish_time: 1754045721,
        }
    );
});

test("should use live price when on chain price is stale", async () => {
    setSystemTime(1754045720 * 1000);

    mock.module('./client/pyth', () => {
        return {
            fetchAndProcessPriceFeed: () => ({
                attestation: "00000",
                items: {
                    btc: {
                        price: "11574968340348",
                        expo: -8,
                        publish_time: 1754045720,
                    }
                }
            })
        }
    });

    const marketState: MarketState = {
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
            "btc": {
                price: "11470000751501",
                expo: -8,
                publish_time: 1754045480,
            }
        }
    };

    const resp = await getPriceFeed("btc", marketState);
    expect(resp).toEqual({
        attestation: "00000",
        price: "11574968340348",
        expo: -8,
        publish_time: 1754045720,
    });
});

test("should throw error", async () => {

    mock.module('./client/pyth', () => {
        return {
            fetchAndProcessPriceFeed: () => ({
                attestation: "00000",
                items: {
                    eth: {
                        price: "11574968340348",
                        expo: -8,
                        publish_time: 1754045720,
                    }
                }
            })
        }
    });

    const marketState: MarketState = {
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
    };

    expect(() => getPriceFeed("btc", marketState)).toThrow(Error('Feed not found'));
});
