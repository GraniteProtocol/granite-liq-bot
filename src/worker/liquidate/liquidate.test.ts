import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ContractEntity, MarketState, PriceFeedResponseMixed } from "../../types";
import { epoch } from "../../util";
import { liquidateWorker } from "./";


const contract: ContractEntity = {
    id: "SP...contract",
    address: "SP..",
    name: "contract",
    operatorAddress: "SPXA...",
    operatorBalance: 263000,
    marketAsset: {
        address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
        decimals: 6,
        name: "Ethereum USDC via Allbridge",
        symbol: "aeUSDC",
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
        address: "",
        name: ""
    },
    usdhThreshold: 0,
    lockTx: null,
    unlocksAt: null,
}

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
    onChainPriceFeed: {},
}

const priceFeed: PriceFeedResponseMixed = {
    attestation: "504e41550100000003b",
    items: {
        btc: {
            price: "10384556671615",
            expo: -8,
            publish_time: 1747405182
        }
    }
};

describe("liquidateWorker", () => {
    beforeEach(() => {
        mock.restore();
    });

    test("no contract, skip", async () => {
        const getContractListMocked = mock(() => []);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getBorrowersToSyncMocked = mock(() => []);
        const getBorrowerStatusListMocked = mock(() => []);
        mock.module("../../dba/borrower", () => ({
            getBorrowersToSync: getBorrowersToSyncMocked,
            getBorrowerStatusList: getBorrowerStatusListMocked
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToSyncMocked).toHaveBeenCalledTimes(0);
        expect(getBorrowerStatusListMocked).toHaveBeenCalledTimes(0);
    });

    test("contract locked, skip", async () => {
        const getContractListMocked = mock(() => [{ ...contract, lockTx: '0x00' }]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getBorrowersToSyncMocked = mock(() => []);
        const getBorrowerStatusListMocked = mock(() => []);
        mock.module("../../dba/borrower", () => ({
            getBorrowersToSync: getBorrowersToSyncMocked,
            getBorrowerStatusList: getBorrowerStatusListMocked
        }));

        const getLiquidationByTxIdMocked = mock(() => [{
            txid: '0x00',
            contract: 'SP...contract',
            status: 'pending',
            createdAt: epoch() - 2,
            updatedAt: null,
            fee: 200,
            nonce: 3,
        }]);
        mock.module("../../dba/liquidation", () => ({
            getLiquidationByTxId: getLiquidationByTxIdMocked,
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToSyncMocked).toHaveBeenCalledTimes(0);
        expect(getBorrowerStatusListMocked).toHaveBeenCalledTimes(0);
    })

    test("there is borrower to sync, skip", async () => {
        const getContractListMocked = mock(() => [contract]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getBorrowersToSyncMocked = mock(() => [{
            address: 'SP...',
            syncTs: 123123
        }]);
        const getBorrowerStatusListMocked = mock(() => []);
        mock.module("../../dba/borrower", () => ({
            getBorrowersToSync: getBorrowersToSyncMocked,
            getBorrowerStatusList: getBorrowerStatusListMocked
        }));

        const getLiquidationByTxIdMocked = mock(() => []);
        mock.module("../../dba/liquidation", () => ({
            getLiquidationByTxId: getLiquidationByTxIdMocked,
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(0);
        expect(getBorrowersToSyncMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowerStatusListMocked).toHaveBeenCalledTimes(0);
    })

    test("no liquidable position, skip", async () => {
        const getContractListMocked = mock(() => [contract]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getBorrowersToSyncMocked = mock(() => []);
        const getBorrowerStatusListMocked = mock(() => []);
        mock.module("../../dba/borrower", () => ({
            getBorrowersToSync: getBorrowersToSyncMocked,
            getBorrowerStatusList: getBorrowerStatusListMocked
        }));

        const getLiquidationByTxIdMocked = mock(() => []);
        mock.module("../../dba/liquidation", () => ({
            getLiquidationByTxId: getLiquidationByTxIdMocked,
        }));

        const getMarketStateMocked = mock(() => (marketState));
        mock.module("../../dba/market", () => ({
            getMarketState: getMarketStateMocked,
        }));

        const getPriceFeedMocked = mock(() => (priceFeed));
        mock.module("../../price-feed", () => ({
            getPriceFeed: getPriceFeedMocked
        }));

        const calcMinOutMocked = mock(() => { });
        mock.module("./lib", () => ({
            calcMinOut: calcMinOutMocked
        }))

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(0);
        expect(getBorrowersToSyncMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowerStatusListMocked).toHaveBeenCalledTimes(1);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(1);
        expect(getPriceFeedMocked).toHaveBeenCalledTimes(1);
        expect(calcMinOutMocked).toHaveBeenCalledTimes(0);
    });

    test("liquidable position, liquidate", () => {
        // shouldn't call finalizeLiquidation because no rbf
        // should call lockContract
        // should call insertLiquidation
        // should call onLiqTx
    })

    test("liquidable position, liquidate but tx error", () => {
        // should call onLiqTxError
        // shouldn't call lockContract
        // should't call insertLiquidation
    });

    test("liquidable position, liquidate with rbf", () => {
        // should call getLiquidationByTxId
        // shouldn't call getAccountNonces
        // shouldn't call estimateRbfMultiplier
        // should call finalizeLiquidation
        // should call lockContract
        // should call insertLiquidation
        // should call onLiqTx
    })
})