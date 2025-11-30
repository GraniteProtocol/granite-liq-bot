import { describe, expect, test } from "bun:test";
import { type Collateral, type InterestRateParams } from "../types";
import {
    annualizedAPR,
    calculateAccountHealth, calculateAccountLiqLTV,
    calculateLiquidationPoint,
    calculateTotalCollateralValue,
    compoundedInterest,
    computeUtilizationRate,
    convertDebtSharesToAssets, liquidatorMaxRepayAmount
} from "./";

export const createCollateral = (
    amount: number,
    price: number,
    maxLTV: number = 0.8,
    liquidationLTV: number = 0.6,
    liquidationPremium: number = 0.1,
): Collateral => ({
    amount,
    price,
    maxLTV,
    liquidationLTV,
    liquidationPremium
});

describe("Account Module", () => {
    describe("Account Health", () => {
        test("calculates account health correctly with single collateral", () => {
            const collaterals = [createCollateral(100, 10, 0.8, 0.8)];
            const currentDebt = 500;

            const health = calculateAccountHealth(collaterals, currentDebt);
            expect(health).toBe(1.6);
        });

        test("calculates account health correctly with multiple collaterals", () => {
            const collaterals = [
                createCollateral(100, 10, 0.8, 0.8),
                createCollateral(200, 5, 0.7, 0.7),
                createCollateral(50, 20, 0.9, 0.9),
            ];
            const currentDebt = 1000;

            const health = calculateAccountHealth(collaterals, currentDebt);
            expect(health).toBe(2.4);
        });

        test("returns error when debt is zero", () => {
            const collaterals = [createCollateral(100, 10, 0.8, 0.8)];
            const currentDebt = 0;

            expect(() => calculateAccountHealth(collaterals, currentDebt)).toThrow(
                "Current debt cannot be zero",
            );
        });

        test("returns zero when no collaterals are provided", () => {
            const collaterals: Collateral[] = [];
            const currentDebt = 1000;

            const health = calculateAccountHealth(collaterals, currentDebt);
            expect(health).toBe(0);
        });

        test("throws error for undefined liquidationLTV", () => {
            const collaterals = [
                {
                    amount: 100,
                    price: 10,
                    maxLTV: 0.8,
                } as Collateral,
            ];
            const currentDebt = 500;

            expect(() => calculateAccountHealth(collaterals, currentDebt)).toThrow(
                "LiquidationLTV is not defined",
            );
        });
    });

    describe("Total Collateral Value", () => {
        test("calculates total value correctly with multiple collaterals", () => {
            const collaterals = [
                createCollateral(100, 10),
                createCollateral(200, 5),
                createCollateral(50, 20),
            ];

            const value = calculateTotalCollateralValue(collaterals);
            expect(value).toBe(3000); // (100 * 10) + (200 * 5) + (50 * 20)
        });

        test("returns 0 for empty collateral list", () => {
            expect(calculateTotalCollateralValue([])).toBe(0);
        });

        test("handles collaterals with zero amount or price", () => {
            const collaterals = [
                createCollateral(0, 10),
                createCollateral(100, 0),
                createCollateral(100, 10),
            ];

            const value = calculateTotalCollateralValue(collaterals);
            expect(value).toBe(1000);
        });
    });


    describe("Account Liquidation LTV", () => {
        test("calculates account liq LTV correctly with multiple collaterals", () => {
            const collaterals = [
                createCollateral(100, 10, 0.7, 0.9),
                createCollateral(12, 1, 0.4, 0.6),
                createCollateral(1200, 10, 0.6, 0.7),
            ];

            const liqLtv = calculateAccountLiqLTV(collaterals);
            expect(liqLtv).toBeCloseTo(0.715);
        });

        test("returns 0 when there are no collaterals", () => {
            const collaterals: Collateral[] = [];
            const liqLtv = calculateAccountLiqLTV(collaterals);
            expect(liqLtv).toBe(0);
        });

        test("throws error for undefined liquidationLTV", () => {
            const collaterals = [
                {
                    amount: 100,
                    price: 10,
                    maxLTV: 0.8,
                } as Collateral,
            ];

            expect(() => calculateAccountLiqLTV(collaterals)).toThrow(
                "LiquidationLTV is not defined",
            );
        });
    });

    describe("calculateLiquidationPoint", () => {
        test("calculate liquidation point", () => {
            const collaterals = [createCollateral(1000, 10, 0.8, 0.8)];
            const liqLtv = calculateAccountLiqLTV(collaterals);
            const irParams = {
                urKink: 0.8,
                baseIR: 0.15,
                slope1: 1.5,
                slope2: 7,
            };

            const lp = calculateLiquidationPoint(
                liqLtv,
                100, // debt shares
                1000, // open interest
                1000, // total debt shares
                10000, // total assets (10% utilization rate)
                irParams,
                1, // second
            );
            expect(lp).toBeCloseTo(125);
        });
    });



    describe("edge cases", () => {
        test("handles zero values in account health calculation", () => {
            const collaterals = [createCollateral(0, 10, 0.8, 0.8)];
            const health = calculateAccountHealth(collaterals, 1);
            expect(health).toBe(0);
        });

        test("handles zero liquidation point when accountLiqLTV is zero", () => {
            const irParams = {
                urKink: 0.8,
                baseIR: 0.15,
                slope1: 1.5,
                slope2: 7,
            };

            const lp = calculateLiquidationPoint(
                0,
                100,
                1000,
                1000,
                10000,
                irParams,
                1,
            );
            expect(lp).toBe(0);
        });
    });
});

describe("Borrow and Debt Module", () => {
    const defaultIrParams: InterestRateParams = {
        urKink: 0.7,
        baseIR: 0.5,
        slope1: 0.75,
        slope2: 1.5,
    };

    // -------------- Utilization Rate Tests --------------

    describe("Utilization Rate", () => {
        test("calculates standard utilization rate", () => {
            expect(computeUtilizationRate(10, 100)).toBe(0.1);
            expect(computeUtilizationRate(101, 100)).toBe(1.01);
        });

        test("handles zero total assets", () => {
            expect(computeUtilizationRate(10, 0)).toBe(0);
        });

        test("handles zero open interest", () => {
            expect(computeUtilizationRate(0, 100)).toBe(0);
        });
    });

    // -------------- Interest Calculations Tests --------------

    describe("Interest Calculations", () => {

        test("handles zero time delta", () => {
            expect(compoundedInterest(1000, 500, 500, defaultIrParams, 0)).toBe(0);
        });

        test("handles zero debt amount", () => {
            expect(compoundedInterest(0, 500, 500, defaultIrParams, 6000)).toBe(0);
        });
    });

    // -------------- APR and APY Tests --------------

    describe("APR and APY Calculations", () => {
        test("calculates annualized APR below kink", () => {
            const ur = 0.5; // Below kink of 0.7
            const apr = annualizedAPR(ur, defaultIrParams);
            expect(apr).toBe(defaultIrParams.baseIR + defaultIrParams.slope1 * ur);
        });

        test("calculates annualized APR above kink", () => {
            const ur = 0.8; // Above kink of 0.7
            const apr = annualizedAPR(ur, defaultIrParams);
            const expectedApr =
                defaultIrParams.slope2 * (ur - defaultIrParams.urKink) +
                defaultIrParams.slope1 * defaultIrParams.urKink +
                defaultIrParams.baseIR;
            expect(apr).toBe(expectedApr);
        });

        test("calculates annualized APR at kink point", () => {
            const ur = defaultIrParams.urKink;
            const apr = annualizedAPR(ur, defaultIrParams);
            expect(apr).toBe(defaultIrParams.baseIR + defaultIrParams.slope1 * ur);
        });
    });

    // -------------- Debt Share Conversion Tests --------------

    describe("Debt Share Conversions", () => {
        test("converts debt shares to assets correctly", () => {
            const result = convertDebtSharesToAssets(
                1000, // debtShares
                10000, // openInterest
                10000, // totalDebtShares
                20000, // totalAssets
                defaultIrParams,
                3600, // 1 hour
            );
            expect(result).toBeGreaterThan(1000); // Should be more due to interest accrual
        });

        test("returns 0 when total debt shares is 0", () => {
            const result = convertDebtSharesToAssets(
                1000,
                10000,
                0, // totalDebtShares = 0
                20000,
                defaultIrParams,
                3600,
            );
            expect(result).toBe(0);
        });

        test("handles different utilization rates", () => {
            const lowUtilization = convertDebtSharesToAssets(
                1000,
                1000, // openInterest
                10000,
                100000, // totalAssets (1% utilization)
                defaultIrParams,
                3600,
            );

            const highUtilization = convertDebtSharesToAssets(
                1000,
                80000, // openInterest
                10000,
                100000, // totalAssets (80% utilization)
                defaultIrParams,
                3600,
            );

            expect(highUtilization).toBeGreaterThan(lowUtilization);
        });
    });
});

describe("Liquidation Module", () => {
    const defaultIrParams = {
        slope1: 0.03,
        slope2: 0.5,
        baseIR: 0.01,
        urKink: 0.8,
    };

    describe("Liquidation Point Calculations", () => {
        test("calculates liquidation point correctly", () => {
            const lp = calculateLiquidationPoint(
                0.8, // accountLiqLTV
                100, // debt shares
                1000, // open interest
                1000, // total debt shares
                10000, // total assets (10% utilization rate)
                defaultIrParams,
                1, // second
            );
            expect(lp).toBeCloseTo(125);
        });

        test("returns 0 when accountLiqLTV is 0", () => {
            const lp = calculateLiquidationPoint(
                0,
                100,
                1000,
                1000,
                10000,
                defaultIrParams,
                1,
            );
            expect(lp).toBe(0);
        });
    });

    describe("Liquidator Max Repay Calculations", () => {
        test("prevents repayment higher than actual debt (regression test for original issue)", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.01, // 1% premium
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 1000,
                price: 1,
            };

            // This was the original problematic test case
            const amt = liquidatorMaxRepayAmount(
                10000, // debtShares
                1000, // openInterest
                10000, // totalDebtShares
                20000, // totalAssets
                defaultIrParams,
                3600, // 1 hour
                collateral,
                [collateral], // Pass the same collateral as allCollaterals
            );

            // Should never exceed openInterest (1000)
            expect(amt).toBeLessThanOrEqual(1000);

            // Should be capped by collateralValue / (1 + premium) ≈ 990.099
            expect(amt).toBeCloseTo(990.099, 3);

            // Verify it's using the collateral cap rather than maxRepayCalc
            const collateralCap =
                collateral.amount / (1 + collateral.liquidationPremium!);
            expect(amt).toBeCloseTo(collateralCap, 3);
        });

        test("calculates max repay with proper secured value consideration", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.1, // 10% premium
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 1000,
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                1000, // debtShares (all debt)
                1000, // openInterest
                1000, // totalDebtShares
                2000, // totalAssets
                defaultIrParams,
                3600,
                collateral,
                [collateral],
            );

            // Calculations:
            // collateralValue = 1000
            // securedValue = 1000 * 0.7 = 700
            // debtAssets ≈ 1000 (plus small interest)
            // denominator = 1 - (1 + 0.1) * 0.7 = 0.23
            // maxRepayCalc = (1000 - 700) / 0.23 ≈ 1304.35
            // collateralCap = 1000 / 1.1 ≈ 909.09
            // Should return min(909.09, 1000) = 909.09
            expect(amt).toBeCloseTo(909.09, 2);
        });

        test("handles multi-collateral case correctly", () => {
            const collateralA: Collateral = {
                liquidationPremium: 0.1, // 10% premium
                maxLTV: 0.7,
                liquidationLTV: 0.78,
                amount: 100,
                price: 10, // Value = 1000
            };

            const collateralB: Collateral = {
                liquidationPremium: 0.12, // 12% premium
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 664,
                price: 1, // Value = 664
            };

            const collateralC: Collateral = {
                liquidationPremium: 0.15, // 15% premium
                maxLTV: 0.5,
                liquidationLTV: 0.6,
                amount: 350,
                price: 1, // Value = 350
            };

            const allCollaterals = [collateralA, collateralB, collateralC];

            // Test liquidating collateral B
            const amtB = liquidatorMaxRepayAmount(
                1000, // debtShares
                1014, // openInterest (matches image)
                1000, // totalDebtShares
                2000, // totalAssets
                defaultIrParams,
                3600,
                collateralB,
                allCollaterals,
            );

            // Calculations for collateral B:
            // totalSecuredValue = (1000 x 0.78) + (664 x 0.70) + (350 x 0.60) = 1247.8
            // denominator = 1 - (1 + 0.12) x 0.70 = 0.156
            // maxRepayCalc = (1014 - 1247.8) / 0.156 = -1497.44
            // collateralCap = 664 / (1 + 0.12) = 592.86
            // maxRepayAllowed = max(min(-1497.44, 592.86), 0) = 0
            expect(amtB).toBe(0);

            // Test liquidating collateral B with higher debt
            const amtBHighDebt = liquidatorMaxRepayAmount(
                2000, // Higher debt shares
                2014, // Higher openInterest
                1000,
                2000,
                defaultIrParams,
                3600,
                collateralB,
                allCollaterals,
            );

            // For higher debt:
            // debtAssets ≈ 2014
            // totalSecuredValue = 1247.8 (same as before)
            // maxRepayCalc = (2014 - 1247.8) / 0.156 = 4910.38
            // collateralCap = 664 / 1.12 = 592.86
            // maxRepayAllowed = max(min(4910.38, 592.86), 0) = 592.86
            expect(amtBHighDebt).toBeCloseTo(592.86, 2);
        });

        test("returns 0 when debt is fully secured by collateral", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 2000, // High collateral amount
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                100, // Small debt
                1000,
                1000,
                2000,
                defaultIrParams,
                3600,
                collateral,
                [collateral],
            );

            // Debt is fully secured by collateral, so no liquidation needed
            expect(amt).toBe(0);
        });

        test("respects collateral cap when debt is high", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 100, // Low collateral amount
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                1000, // High debt
                1000,
                1000,
                2000,
                defaultIrParams,
                3600,
                collateral,
                [collateral],
            );

            // Collateral cap = 100 / 1.1 ≈ 90.91
            expect(amt).toBeCloseTo(90.91, 2);
        });

        test("handles zero collateral amount", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 0,
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                1000,
                1000,
                1000,
                2000,
                defaultIrParams,
                3600,
                collateral,
                [collateral],
            );

            expect(amt).toBe(0);
        });

        test("throws error when liquidation parameters are undefined", () => {
            const collateral = {
                maxLTV: 0.6,
                amount: 1000,
                price: 1,
            } as Collateral;

            expect(() =>
                liquidatorMaxRepayAmount(
                    1000,
                    1000,
                    1000,
                    2000,
                    defaultIrParams,
                    3600,
                    collateral,
                    [collateral],
                ),
            ).toThrow("Liquidation LTV or liquidation premium are not defined");
        });

        test("handles denominator near zero case", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.25, // 25% premium
                maxLTV: 0.7,
                liquidationLTV: 0.79,
                amount: 1000,
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                2000, // High debt to ensure positive maxRepayCalc
                2000,
                1000,
                2000,
                defaultIrParams,
                3600,
                collateral,
                [collateral],
            );

            // Should still be capped by collateralCap = 1000/1.25 = 800
            expect(amt).toBeCloseTo(800, 2);
        });

        test("handles multiple collaterals of same type", () => {
            const collateral1: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 500,
                price: 1,
            };

            const collateral2: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 500,
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                1500,
                1500,
                1000,
                2000,
                defaultIrParams,
                3600,
                collateral1,
                [collateral1, collateral2],
            );

            // Total secured value = (500 + 500) * 0.7 = 700
            // maxRepayCalc = (1500 - 700) / (1 - 1.1 * 0.7) = 2666.67
            // collateralCap = 500 / 1.1 = 454.55
            expect(amt).toBeCloseTo(454.55, 2);
        });

        test("handles different price scales correctly", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 1, // 1 BTC
                price: 50000, // $50,000 per BTC
            };

            const amt = liquidatorMaxRepayAmount(
                60000,
                60000,
                1000,
                100000,
                defaultIrParams,
                3600,
                collateral,
                [collateral],
            );

            // collateralCap = (1 * 50000) / 1.1 = 45454.55
            expect(amt).toBeCloseTo(45454.55, 2);
        });

        test("handles zero and negative prices", () => {
            const zeroPrice: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 1000,
                price: 0,
            };

            const negativePrice: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 1000,
                price: -1,
            };

            const amtZero = liquidatorMaxRepayAmount(
                1000,
                1000,
                1000,
                2000,
                defaultIrParams,
                3600,
                zeroPrice,
                [zeroPrice],
            );

            const amtNegative = liquidatorMaxRepayAmount(
                1000,
                1000,
                1000,
                2000,
                defaultIrParams,
                3600,
                negativePrice,
                [negativePrice],
            );

            expect(amtZero).toBe(0);
            expect(amtNegative).toBe(0);
        });

        test("throws error when any collateral in allCollaterals has undefined liquidationLTV", () => {
            const validCollateral: Collateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                liquidationLTV: 0.7,
                amount: 1000,
                price: 1,
            };

            const invalidCollateral = {
                liquidationPremium: 0.1,
                maxLTV: 0.6,
                // liquidationLTV is undefined
                amount: 500,
                price: 1,
            } as Collateral;

            expect(() =>
                liquidatorMaxRepayAmount(
                    1000,
                    1000,
                    1000,
                    2000,
                    defaultIrParams,
                    3600,
                    validCollateral, // Main collateral is valid
                    [validCollateral, invalidCollateral], // But one of allCollaterals is invalid
                ),
            ).toThrow("LiquidationLTV is not defined for one or more collaterals");
        });
    });

    describe("calculateLiquidationPoint properties", () => {
        test("scales inversely with accountLiqLTV", () => {
            const args = {
                debtShares: 100,
                openInterest: 1000,
                totalDebtShares: 1000,
                totalAssets: 10000,
                timeDelta: 1,
            };
            const lpAt08 = calculateLiquidationPoint(
                0.8,
                args.debtShares,
                args.openInterest,
                args.totalDebtShares,
                args.totalAssets,
                defaultIrParams,
                args.timeDelta,
            );
            const lpAt05 = calculateLiquidationPoint(
                0.5,
                args.debtShares,
                args.openInterest,
                args.totalDebtShares,
                args.totalAssets,
                defaultIrParams,
                args.timeDelta,
            );
            // LP(0.5) should be 1.6x LP(0.8)
            expect(lpAt05).toBeCloseTo(lpAt08 * (0.8 / 0.5), 6);
        });
    });

    describe("liquidatorMaxRepayAmount extra edges", () => {
        test("returns 0 when denominator is negative", () => {
            const collateral: Collateral = {
                liquidationPremium: 0.5, // makes denominator negative with liqLTV 0.8
                maxLTV: 0.6,
                liquidationLTV: 0.8,
                amount: 1000,
                price: 1,
            };

            const amt = liquidatorMaxRepayAmount(
                1000,
                1000,
                1000,
                2000,
                defaultIrParams,
                1,
                collateral,
                [collateral],
            );

            expect(amt).toBe(0);
        });
    });
});
