import { describe, expect, mock, test } from "bun:test";
import { estimateRbfMultiplier, estimateTxFeeOptimistic } from "./fee";


describe("estimateTxFeeOptimistic", () => {
    test("1", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 1200 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(600000);
    });

    test("2", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 290 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(500000);
    });

    test("3", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 126 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(400000);
    });

    test("4", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 58 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(300000);
    });

    test("5", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 12 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(200000);
    });
});

describe("estimateRbfMultiplier", () => {
    test("1", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 1200 })
            }
        });
        expect(await estimateRbfMultiplier()).toEqual(2.0);
    });

    test("2", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 290 })
            }
        });
        expect(await estimateRbfMultiplier()).toEqual(1.8);
    });

    test("3", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 126 })
            }
        });
        expect(await estimateRbfMultiplier()).toEqual(1.6);
    });

    test("4", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 58 })
            }
        });
        expect(await estimateRbfMultiplier()).toEqual(1.4);
    });

    test("5", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 12 })
            }
        });
        expect(await estimateRbfMultiplier()).toEqual(1.2);
    });
});