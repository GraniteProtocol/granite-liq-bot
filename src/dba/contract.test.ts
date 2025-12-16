import { describe, expect, setSystemTime, test } from "bun:test";
import { epoch } from "../util";
import { getContractList, getContractOperatorPriv, insertContract, lockContract, unlockContract, unlockContractSchedule, updateContractBalances, updateContractFlashLoanSc, updateContractUnprofitabilityThreshold } from "./contract";

describe("dba contracts", () => {
    test("insertContract", () => {
        setSystemTime(1738262052565);
        insertContract('SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
            'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
            '0x1.',
            { address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc", name: "Ethereum USDC via Allbridge", symbol: "aeUSDC", decimals: 6 },
            { address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token", name: "sBTC", symbol: "sBTC", decimals: 8 },
            0,
            'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.flash-loan-v1',
        );
    });

    test("insertContract", () => {
        setSystemTime(1738262062565);
        insertContract('ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
            'ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
            '0x2.',
            { address: "ST3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.mock-usdc", name: "mock USDC", symbol: "USDC", decimals: 8 },
            { address: "SN3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.mock-sbtc", name: "mock sBTC", symbol: "sBTC", decimals: 8 },
            0,
            'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.flash-loan-v1',
        );
    });

    test("getContractList", () => {
        const contracts = getContractList({ orderBy: 'created_at DESC' });
        expect(contracts).toEqual([
            {
                id: "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                operatorAddress: "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                operatorBalance: 0,
                marketAsset: {
                    address: "ST3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.mock-usdc",
                    decimals: 8,
                    name: "mock USDC",
                    symbol: "USDC",
                    balance: 0,
                },
                collateralAsset: {
                    address: "SN3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.mock-sbtc",
                    decimals: 8,
                    name: "mock sBTC",
                    symbol: "sBTC",
                    balance: 0,
                },
                unprofitabilityThreshold: 0,
                flashLoanSc: {
                    address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                    name: "flash-loan-v1"
                },
                lockTx: null,
                unlocksAt: null,
            }, {
                id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                operatorBalance: 0,
                marketAsset: {
                    address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                    decimals: 6,
                    name: "Ethereum USDC via Allbridge",
                    symbol: "aeUSDC",
                    balance: 0,
                },
                collateralAsset: {
                    address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                    decimals: 8,
                    name: "sBTC",
                    symbol: "sBTC",
                    balance: 0,
                },
                unprofitabilityThreshold: 0,
                flashLoanSc: {
                    address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                    name: "flash-loan-v1"
                },
                lockTx: null,
                unlocksAt: null,
            }
        ])
    });

    test("getContractList with filters", () => {
        const contracts = getContractList({ filters: [['address', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T']], orderBy: 'created_at DESC' });
        expect(contracts).toEqual([
            {
                id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                operatorBalance: 0,
                marketAsset: {
                    address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                    decimals: 6,
                    name: "Ethereum USDC via Allbridge",
                    symbol: "aeUSDC",
                    balance: 0,
                },
                collateralAsset: {
                    address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                    decimals: 8,
                    name: "sBTC",
                    symbol: "sBTC",
                    balance: 0,
                },
                unprofitabilityThreshold: 0,
                flashLoanSc: {
                    address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                    name: "flash-loan-v1"
                },
                lockTx: null,
                unlocksAt: null,
            }
        ])
    });

    test("getContractOperatorPriv", () => {
        const priv = getContractOperatorPriv("SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        expect(priv).toEqual("0x1.");
    });

    test("getContractOperatorPriv", () => {
        const priv = getContractOperatorPriv("ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        expect(priv).toEqual("0x2.");
    });

    test("lockContract", () => {
        lockContract("0x00", "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        const contracts = getContractList({ filters: [['id', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator']] });
        expect(contracts.length).toEqual(1);
        expect(contracts[0]).toEqual({
            id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            name: "liquidator",
            operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            operatorBalance: 0,
            marketAsset: {
                address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                name: "Ethereum USDC via Allbridge",
                symbol: "aeUSDC",
                decimals: 6,
                balance: 0,
            },
            collateralAsset: {
                address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                name: "sBTC",
                symbol: "sBTC",
                decimals: 8,
                balance: 0,
            },
            unprofitabilityThreshold: 0,
            flashLoanSc: {
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "flash-loan-v1"
            },
            lockTx: "0x00",
            unlocksAt: null,
        });
    });

    test("unlockContractSchedule", () => {
        setSystemTime(1738262052565);
        unlockContractSchedule(epoch() + 60, "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        const contracts = getContractList({ filters: [['id', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator']] });
        expect(contracts.length).toEqual(1);
        expect(contracts[0]).toEqual({
            id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            name: "liquidator",
            operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            operatorBalance: 0,
            marketAsset: {
                address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                name: "Ethereum USDC via Allbridge",
                symbol: "aeUSDC",
                decimals: 6,
                balance: 0,
            },
            collateralAsset: {
                address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                name: "sBTC",
                symbol: "sBTC",
                decimals: 8,
                balance: 0,
            },
            unprofitabilityThreshold: 0,
            flashLoanSc: {
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "flash-loan-v1"
            },
            lockTx: "0x00",
            unlocksAt: 1738262112,
        });
    });

    test("unlockContract", () => {
        setSystemTime(1738262052565);
        unlockContract("SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        const contracts = getContractList({ filters: [['id', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator']] });
        expect(contracts.length).toEqual(1);
        expect(contracts[0]).toEqual({
            id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            name: "liquidator",
            operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            operatorBalance: 0,
            marketAsset: {
                address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                name: "Ethereum USDC via Allbridge",
                symbol: "aeUSDC",
                decimals: 6,
                balance: 0,
            },
            collateralAsset: {
                address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                name: "sBTC",
                symbol: "sBTC",
                decimals: 8,
                balance: 0,
            },
            unprofitabilityThreshold: 0,
            flashLoanSc: {
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "flash-loan-v1"
            },
            lockTx: null,
            unlocksAt: null,
        });
    });

    test("updateContractBalances", () => {
        updateContractBalances(1_000000, 100_000000, 0, "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        const contracts = getContractList({ filters: [['id', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator']] });
        expect(contracts.length).toEqual(1);
        expect(contracts[0]).toEqual({
            id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            name: "liquidator",
            operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            operatorBalance: 1000000,
            marketAsset: {
                address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                name: "Ethereum USDC via Allbridge",
                symbol: "aeUSDC",
                decimals: 6,
                balance: 100000000,
            },
            collateralAsset: {
                address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                name: "sBTC",
                symbol: "sBTC",
                decimals: 8,
                balance: 0,
            },
            unprofitabilityThreshold: 0,
            flashLoanSc: {
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "flash-loan-v1"
            },
            lockTx: null,
            unlocksAt: null,
        });
    });

    test("updateContractUnprofitabilityThreshold", () => {
        updateContractUnprofitabilityThreshold(10, "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        const contracts = getContractList({ filters: [['id', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator']] });
        expect(contracts.length).toEqual(1);
        expect(contracts[0]).toEqual({
            id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            name: "liquidator",
            operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            operatorBalance: 1000000,
            marketAsset: {
                address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                name: "Ethereum USDC via Allbridge",
                symbol: "aeUSDC",
                decimals: 6,
                balance: 100000000,
            },
            collateralAsset: {
                address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                name: "sBTC",
                symbol: "sBTC",
                decimals: 8,
                balance: 0,
            },
            unprofitabilityThreshold: 10,
            flashLoanSc: {
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "flash-loan-v1"
            },
            lockTx: null,
            unlocksAt: null,
        });
    });

    test("updateContractFlashLoanSc", () => {
        updateContractFlashLoanSc("SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.flash-loan-v2", "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        const contracts = getContractList({ filters: [['id', '=', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator']] });
        expect(contracts.length).toEqual(1);
        expect(contracts[0]).toEqual({
            id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            name: "liquidator",
            operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
            operatorBalance: 1000000,
            marketAsset: {
                address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                name: "Ethereum USDC via Allbridge",
                symbol: "aeUSDC",
                decimals: 6,
                balance: 100000000,
            },
            collateralAsset: {
                address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                name: "sBTC",
                symbol: "sBTC",
                decimals: 8,
                balance: 0,
            },
            unprofitabilityThreshold: 10,
            flashLoanSc: {
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "flash-loan-v2"
            },
            lockTx: null,
            unlocksAt: null,
        });
    });
});
