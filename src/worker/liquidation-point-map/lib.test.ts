import { describe, expect, mock, test } from "bun:test";
import type { LiquidationsResponse } from "../../client/backend/types";
import { generateDescendingPriceBuckets, getBorrowers } from "./lib";

describe("liquidation-point-map lib", () => {
    test("generateDescendingPriceBuckets", () => {
        const buckets = generateDescendingPriceBuckets(10889258247559, 100, 100, 8);
        expect(buckets).toEqual([
            10880000000000, 10870000000000, 10860000000000, 10850000000000, 10840000000000,
            10830000000000, 10820000000000, 10810000000000, 10800000000000, 10790000000000,
            10780000000000, 10770000000000, 10760000000000, 10750000000000, 10740000000000,
            10730000000000, 10720000000000, 10710000000000, 10700000000000, 10690000000000,
            10680000000000, 10670000000000, 10660000000000, 10650000000000, 10640000000000,
            10630000000000, 10620000000000, 10610000000000, 10600000000000, 10590000000000,
            10580000000000, 10570000000000, 10560000000000, 10550000000000, 10540000000000,
            10530000000000, 10520000000000, 10510000000000, 10500000000000, 10490000000000,
            10480000000000, 10470000000000, 10460000000000, 10450000000000, 10440000000000,
            10430000000000, 10420000000000, 10410000000000, 10400000000000, 10390000000000,
            10380000000000, 10370000000000, 10360000000000, 10350000000000, 10340000000000,
            10330000000000, 10320000000000, 10310000000000, 10300000000000, 10290000000000,
            10280000000000, 10270000000000, 10260000000000, 10250000000000, 10240000000000,
            10230000000000, 10220000000000, 10210000000000, 10200000000000, 10190000000000,
            10180000000000, 10170000000000, 10160000000000, 10150000000000, 10140000000000,
            10130000000000, 10120000000000, 10110000000000, 10100000000000, 10090000000000,
            10080000000000, 10070000000000, 10060000000000, 10050000000000, 10040000000000,
            10030000000000, 10020000000000, 10010000000000, 10000000000000, 9990000000000, 9980000000000,
            9970000000000, 9960000000000, 9950000000000, 9940000000000, 9930000000000, 9920000000000,
            9910000000000, 9900000000000, 9890000000000
        ])
    });

    test("getBorrowers", async () => {
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
        mock.module("../../client/backend", () => ({
            fetchGetBorrowerPositions: fetchGetBorrowerPositionsMocked
        }));

        const resp = await getBorrowers();

        expect(resp).toEqual([
            {
                address: "SP2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX50CQQAWN",
                debtShares: 76345482,
                collaterals: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 166792,
                },
            }, {
                address: "SP1S2ZTV7QVAYBRJVB85FHXE7P8PZZHXVCERMEHN9",
                debtShares: 15233602,
                collaterals: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 33300,
                },
            }, {
                address: "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7",
                debtShares: 40983403,
                collaterals: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 89600,
                },
            }
        ]);
        
        expect(fetchGetBorrowerPositionsMocked).toBeCalledTimes(1);
    })
});