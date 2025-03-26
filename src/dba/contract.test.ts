import { describe, expect, setSystemTime, test } from "bun:test";
import { getContractList, getContractOperatorPriv, insertContract } from "./contract";

describe("dba contracts", () => {
    test("insertContract", () => {
        setSystemTime(1738262052565);
        insertContract('SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
            'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
            '0x1.',
            { address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc", name: "Ethereum USDC via Allbridge", symbol: "aeUSDC", decimals: 6 },
            { address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token", name: "sBTC", symbol: "sBTC", decimals: 8 }
        );
    });

    test("insertContract", () => {
        setSystemTime(1738262062565);
        insertContract('ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
            'ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
            '0x2.',
            { address: "ST3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.mock-usdc", name: "mock USDC", symbol: "USDC", decimals: 8 },
            { address: "SN3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.mock-sbtc", name: "mock sBTC", symbol: "sBTC", decimals: 8 }
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
                lockTx: null,
                unlocksAt: null,
            }, {
                id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
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
                lockTx: null,
                unlocksAt: null,
            }
        ])
    });

    test("getContractList with filters", () => {
        const contracts = getContractList({ filters: { address: 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T' }, orderBy: 'created_at DESC' });
        expect(contracts).toEqual([
            {
                id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
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
});
