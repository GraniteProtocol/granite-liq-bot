import { describe, expect, mock, test } from "bun:test";
import type { ContractEntity } from "../../types";
import { epoch } from "../../util";
import { handleContractLocks } from "./";

const contract: ContractEntity = {
    id: "SP...contract",
    address: "SP..",
    name: "contract",
    operatorAddress: "SPXA...",
    operatorBalance: 263000,
    marketAsset: null,
    collateralAsset: null,
    unprofitabilityThreshold: 0,
    flashLoanSc: {
        address: "",
        name: ""
    },
    usdhThreshold: 0,
    lockTx: null,
    unlocksAt: null,
}

describe("handleContractLocks", () => {
    test("no tx, do nothing", async () => {
        const getTransactionMocked = mock(() => { });
        mock.module("../../client/hiro", () => ({
            getTransaction: getTransactionMocked
        }));

        const unlockContractMocked = mock(() => { });
        const unlockContractScheduleMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            unlockContract: unlockContractMocked,
            unlockContractSchedule: unlockContractScheduleMocked,
        }));

        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            finalizeLiquidation: finalizeLiquidationMocked,
        }));

        const onLiqTxEndMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxEnd: onLiqTxEndMocked
        }));

        const loggerMocked = mock(() => { });
        mock.module('../../logger', () => ({
            createLogger: () => ({
                info: loggerMocked
            })
        }));

        await handleContractLocks(contract);

        expect(getTransactionMocked).toHaveBeenCalledTimes(0);
        expect(unlockContractMocked).toHaveBeenCalledTimes(0);
        expect(unlockContractScheduleMocked).toHaveBeenCalledTimes(0);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(0);
        expect(onLiqTxEndMocked).toHaveBeenCalledTimes(0);
        expect(loggerMocked).toHaveBeenCalledTimes(0);
    });

    test("pending tx, do nothing", async () => {
        const getTransactionMocked = mock(() => Promise.resolve({ tx_status: "pending" }));
        mock.module("../../client/hiro", () => ({
            getTransaction: getTransactionMocked
        }));

        const unlockContractMocked = mock(() => { });
        const unlockContractScheduleMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            unlockContract: unlockContractMocked,
            unlockContractSchedule: unlockContractScheduleMocked,
        }));

        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            finalizeLiquidation: finalizeLiquidationMocked,
        }));

        const onLiqTxEndMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxEnd: onLiqTxEndMocked
        }));

        const loggerMocked = mock(() => { });
        mock.module('../../logger', () => ({
            createLogger: () => ({
                info: loggerMocked
            })
        }));

        await handleContractLocks({ ...contract, lockTx: "0x00" });

        expect(getTransactionMocked).toHaveBeenCalledTimes(1);
        expect(unlockContractMocked).toHaveBeenCalledTimes(0);
        expect(unlockContractScheduleMocked).toHaveBeenCalledTimes(0);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(0);
        expect(onLiqTxEndMocked).toHaveBeenCalledTimes(0);
        expect(loggerMocked).toHaveBeenCalledTimes(0);
    });

    test("aborted tx, should unlock contract immediatily", async () => {
        const getTransactionMocked = mock(() => Promise.resolve({ tx_status: "abort_by_response" }));
        mock.module("../../client/hiro", () => ({
            getTransaction: getTransactionMocked
        }));

        const unlockContractMocked = mock(() => { });
        const unlockContractScheduleMocked = mock(() => { });
  
        mock.module("../../dba/contract", () => ({
            unlockContract: unlockContractMocked,
            unlockContractSchedule: unlockContractScheduleMocked,
        }));

        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            finalizeLiquidation: finalizeLiquidationMocked,
        }));

        const onLiqTxEndMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxEnd: onLiqTxEndMocked
        }));

        const loggerMocked = mock(() => { });
        mock.module('../../logger', () => ({
            createLogger: () => ({
                info: loggerMocked
            })
        }));

        await handleContractLocks({ ...contract, lockTx: "0x00" });

        expect(getTransactionMocked).toHaveBeenCalledTimes(1);
        expect(unlockContractMocked).toHaveBeenCalledTimes(1);
        expect(unlockContractScheduleMocked).toHaveBeenCalledTimes(0);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxEndMocked).toHaveBeenCalledTimes(1);
        expect(loggerMocked).toHaveBeenCalledTimes(1);
        expect(loggerMocked.mock.calls[0]).toEqual(["transaction 0x00 completed as abort_by_response. contract SP...contract unlocked"] as any);
    });


    test("succeed tx, should schedule contract unlock", async () => {
        const getTransactionMocked = mock(() => Promise.resolve({ tx_status: "success" }));
        mock.module("../../client/hiro", () => ({
            getTransaction: getTransactionMocked
        }));

        const unlockContractMocked = mock(() => { });
        const unlockContractScheduleMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            unlockContract: unlockContractMocked,
            unlockContractSchedule: unlockContractScheduleMocked
        }));

        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            finalizeLiquidation: finalizeLiquidationMocked,
        }));

        const onLiqTxEndMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxEnd: onLiqTxEndMocked
        }));

        const loggerMocked = mock(() => { });
        mock.module('../../logger', () => ({
            createLogger: () => ({
                info: loggerMocked
            })
        }));

        await handleContractLocks({ ...contract, lockTx: "0x00" });

        expect(getTransactionMocked).toHaveBeenCalledTimes(1);
        expect(unlockContractMocked).toHaveBeenCalledTimes(0);
        expect(unlockContractScheduleMocked).toHaveBeenCalledTimes(1);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxEndMocked).toHaveBeenCalledTimes(1);
        expect(loggerMocked).toHaveBeenCalledTimes(1);
        expect(loggerMocked.mock.calls[0]).toEqual(["transaction 0x00 completed as success. contract SP...contract will be unlocked in 60 seconds"] as any);
    });

    test("should unlock contract after delay", async () => {
        const getTransactionMocked = mock(() => Promise.resolve({ tx_status: "success" }));
        mock.module("../../client/hiro", () => ({
            getTransaction: getTransactionMocked
        }));

        const unlockContractMocked = mock(() => { });
        const unlockContractScheduleMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            unlockContract: unlockContractMocked,
            unlockContractSchedule: unlockContractScheduleMocked,
        }));

        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            finalizeLiquidation: finalizeLiquidationMocked,
        }));

        const onLiqTxEndMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxEnd: onLiqTxEndMocked
        }));

        const loggerMocked = mock(() => { });
        mock.module('../../logger', () => ({
            createLogger: () => ({
                info: loggerMocked
            })
        }));

        await handleContractLocks({ ...contract, lockTx: "0x00", unlocksAt: epoch() -1 });

        expect(getTransactionMocked).toHaveBeenCalledTimes(0);
        expect(unlockContractMocked).toHaveBeenCalledTimes(1);
        expect(unlockContractScheduleMocked).toHaveBeenCalledTimes(0);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(0);
        expect(onLiqTxEndMocked).toHaveBeenCalledTimes(0);
        expect(loggerMocked).toHaveBeenCalledTimes(1);
        expect(loggerMocked.mock.calls[0]).toEqual(["contract SP...contract unlocked"] as any);
    });
});