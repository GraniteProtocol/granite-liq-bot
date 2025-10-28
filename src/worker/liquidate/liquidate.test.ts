import { beforeEach, describe, expect, mock, test } from "bun:test";
import { RBF_THRESHOLD } from "../../constants";
import type { BorrowerStatusEntity, ContractEntity, MarketState, PriceFeedResponseMixed } from "../../types";
import { epoch } from "../../util";
import { liquidateWorker } from "./";


const contract: ContractEntity = {
    id: "SPNS4V1TMDVNK1GXHP9XQ7PD4HR02GSDQ0THDCM.contract",
    address: "SPNS4V1TMDVNK1GXHP9XQ7PD4HR02GSDQ0THDCM",
    name: "contract",
    operatorAddress: "SPNS4V1TMDVNK1GXHP9XQ7PD4HR02GSDQ0THDCM",
    operatorBalance: 263000,
    marketAsset: {
        address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
        decimals: 6,
        name: "Ethereum USDC via Allbridge",
        symbol: "aeUSDC",
        balance: 12321198,
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
    const loggerMocked = mock(() => { });
    mock.module('../../logger', () => ({
        createLogger: () => ({
            info: loggerMocked,
            error: loggerMocked
        })
    }));

    beforeEach(() => {
        mock.restore();
    });

    test("no contract, skip", async () => {
        const getContractListMocked = mock(() => []);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getMarketStateMocked = mock(() => (marketState));
        mock.module("../../dba/market", () => ({
            getMarketState: getMarketStateMocked,
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(0);
    });

    test("contract locked, skip", async () => {
        const getContractListMocked = mock(() => [{ ...contract, lockTx: '0x00' }]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getMarketStateMocked = mock(() => (marketState));
        mock.module("../../dba/market", () => ({
            getMarketState: getMarketStateMocked,
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
        expect(getMarketStateMocked).toHaveBeenCalledTimes(0);
    });

    test("no liquidable position, skip", async () => {
        const getContractListMocked = mock(() => [contract]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
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

        const borrowers: BorrowerStatusEntity[] = [
            {
                "address": "SP2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX50CQQAWN",
                "ltv": 0.4454,
                "health": 1.0103,
                "debt": 85.0425,
                "collateral": 190.9351,
                "risk": 0.9898,
                "maxRepay": {

                },
                "totalRepayAmount": 0
            },
            {
                "address": "SP1S2ZTV7QVAYBRJVB85FHXE7P8PZZHXVCERMEHN9",
                "ltv": 0.4451,
                "health": 1.0109,
                "debt": 16.969,
                "collateral": 38.1202,
                "risk": 0.9892,
                "maxRepay": {

                },
                "totalRepayAmount": 0
            },
        ];

        const getBorrowersToLiquidateMocked = mock(async () => borrowers);
        mock.module("../../borrower", () => ({
            getBorrowersToLiquidate: getBorrowersToLiquidateMocked,
        }));

        const calcMinOutMocked = mock(() => { });
        mock.module("./lib", () => ({
            calcMinOut: calcMinOutMocked
        }))

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(0);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(1);
        expect(getPriceFeedMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToLiquidateMocked).toHaveBeenCalledTimes(1);
        expect(calcMinOutMocked).toHaveBeenCalledTimes(0);
    });


    test("liquidable position, swap out error", async () => {
        const getContractListMocked = mock(() => [contract]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
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

        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 8.125664850930649,
                },
                totalRepayAmount: 8.125664850930649,
            }
        ]

        const getBorrowersToLiquidateMocked = mock(async () => borrowers);
        mock.module("../../borrower", () => ({
            getBorrowersToLiquidate: getBorrowersToLiquidateMocked,
        }));

        const calcMinOutMocked = mock(() => 8100000);
        mock.module("./lib", () => ({
            calcMinOut: calcMinOutMocked
        }));

        const estimateSbtcToAeusdcMocked = mock(() => ({ dex: 2, dy: 8 }))
        mock.module("../../dex", () => ({
            estimateSbtcToAeusdc: estimateSbtcToAeusdcMocked
        }));

        const onLiqSwapOutErrorMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqSwapOutError: onLiqSwapOutErrorMocked
        }));

        const getContractOperatorPrivMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            getContractOperatorPriv: getContractOperatorPrivMocked
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(0);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(1);
        expect(getPriceFeedMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToLiquidateMocked).toHaveBeenCalledTimes(1);
        expect(calcMinOutMocked).toHaveBeenCalledTimes(1);
        expect(estimateSbtcToAeusdcMocked).toHaveBeenCalledTimes(1);
        expect(onLiqSwapOutErrorMocked).toHaveBeenCalledTimes(1);
        expect(getContractOperatorPrivMocked).toHaveBeenCalledTimes(0);
    });


    test("liquidable position, broadcast error", async () => {
        const getContractListMocked = mock(() => [contract]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
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

        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 8.125664850930649,
                },
                totalRepayAmount: 8.125664850930649,
            }
        ]

        const getBorrowersToLiquidateMocked = mock(async () => borrowers);
        mock.module("../../borrower", () => ({
            getBorrowersToLiquidate: getBorrowersToLiquidateMocked,
        }));

        const calcMinOutMocked = mock(() => 7900000);
        mock.module("./lib", () => ({
            calcMinOut: calcMinOutMocked
        }));

        const estimateSbtcToAeusdcMocked = mock(() => ({ dex: 2, dy: 8 }))
        mock.module("../../dex", () => ({
            estimateSbtcToAeusdc: estimateSbtcToAeusdcMocked
        }));

        const onLiqSwapOutErrorMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqSwapOutError: onLiqSwapOutErrorMocked
        }));

        const getContractOperatorPrivMocked = mock(() => 'ebeb600abc2019d5748a287dbbcb63cd1dc55c0b4b558833796d1274c0b6547f01');
        mock.module("../../dba/contract", () => ({
            getContractOperatorPriv: getContractOperatorPrivMocked
        }));

        const getAccountNoncesMocked = mock(async () => ({ possible_next_nonce: 14 }));
        mock.module("../../client/hiro", () => ({
            getAccountNonces: getAccountNoncesMocked
        }));

        const estimateTxFeeOptimisticMocked = mock(async () => 400000);
        mock.module("../../fee", () => ({
            estimateTxFeeOptimistic: estimateTxFeeOptimisticMocked
        }));

        const makeContractCallMocked = mock(async () => '');
        const broadcastTransactionMocked = mock(async () => ({
            reason: 'nonce error'
        }))

        mock.module("@stacks/transactions", () => ({
            makeContractCall: makeContractCallMocked,
            broadcastTransaction: broadcastTransactionMocked
        }));

        const onLiqTxErrorMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxError: onLiqTxErrorMocked
        }));

        const lockContractMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            lockContract: lockContractMocked
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(0);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(1);
        expect(getPriceFeedMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToLiquidateMocked).toHaveBeenCalledTimes(1);
        expect(calcMinOutMocked).toHaveBeenCalledTimes(1);
        expect(estimateSbtcToAeusdcMocked).toHaveBeenCalledTimes(1);
        expect(onLiqSwapOutErrorMocked).toHaveBeenCalledTimes(0);
        expect(getContractOperatorPrivMocked).toHaveBeenCalledTimes(1);
        expect(getAccountNoncesMocked).toHaveBeenCalledTimes(1);
        expect(estimateTxFeeOptimisticMocked).toHaveBeenCalledTimes(1);
        expect(makeContractCallMocked).toHaveBeenCalledTimes(1);
        expect(broadcastTransactionMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxErrorMocked).toHaveBeenCalledTimes(1);
        expect(lockContractMocked).toHaveBeenCalledTimes(0);
    });

    test("liquidable position, liquidate", async () => {
        const getContractListMocked = mock(() => [contract]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getLiquidationByTxIdMocked = mock(() => []);
        const insertLiquidationMocked = mock(() => { });
        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            getLiquidationByTxId: getLiquidationByTxIdMocked,
            insertLiquidation: insertLiquidationMocked,
            finalizeLiquidation: finalizeLiquidationMocked
        }));

        const getMarketStateMocked = mock(() => (marketState));
        mock.module("../../dba/market", () => ({
            getMarketState: getMarketStateMocked,
        }));

        const getPriceFeedMocked = mock(() => (priceFeed));
        mock.module("../../price-feed", () => ({
            getPriceFeed: getPriceFeedMocked
        }));

        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 8.125664850930649,
                },
                totalRepayAmount: 8.125664850930649,
            }
        ]

        const getBorrowersToLiquidateMocked = mock(async () => borrowers);
        mock.module("../../borrower", () => ({
            getBorrowersToLiquidate: getBorrowersToLiquidateMocked,
        }));

        const calcMinOutMocked = mock(() => 7900000);
        mock.module("./lib", () => ({
            calcMinOut: calcMinOutMocked
        }));

        const estimateSbtcToAeusdcMocked = mock(() => ({ dex: 2, dy: 8 }))
        mock.module("../../dex", () => ({
            estimateSbtcToAeusdc: estimateSbtcToAeusdcMocked
        }));

        const onLiqSwapOutErrorMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqSwapOutError: onLiqSwapOutErrorMocked
        }));

        const getContractOperatorPrivMocked = mock(() => 'ebeb600abc2019d5748a287dbbcb63cd1dc55c0b4b558833796d1274c0b6547f01');
        mock.module("../../dba/contract", () => ({
            getContractOperatorPriv: getContractOperatorPrivMocked
        }));

        const getAccountNoncesMocked = mock(async () => ({ possible_next_nonce: 14 }));
        mock.module("../../client/hiro", () => ({
            getAccountNonces: getAccountNoncesMocked
        }));

        const estimateTxFeeOptimisticMocked = mock(async () => 400000);
        mock.module("../../fee", () => ({
            estimateTxFeeOptimistic: estimateTxFeeOptimisticMocked
        }));

        const makeContractCallMocked = mock(async () => '');
        const broadcastTransactionMocked = mock(async () => ({
            txid: '0x00'
        }));

        mock.module("@stacks/transactions", () => ({
            makeContractCall: makeContractCallMocked,
            broadcastTransaction: broadcastTransactionMocked
        }));

        const onLiqTxErrorMocked = mock(() => { });
        const onLiqTxMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxError: onLiqTxErrorMocked,
            onLiqTx: onLiqTxMocked
        }));

        const lockContractMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            lockContract: lockContractMocked,
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(0);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(1);
        expect(getPriceFeedMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToLiquidateMocked).toHaveBeenCalledTimes(1);
        expect(calcMinOutMocked).toHaveBeenCalledTimes(1);
        expect(estimateSbtcToAeusdcMocked).toHaveBeenCalledTimes(1);
        expect(onLiqSwapOutErrorMocked).toHaveBeenCalledTimes(0);
        expect(getContractOperatorPrivMocked).toHaveBeenCalledTimes(1);
        expect(getAccountNoncesMocked).toHaveBeenCalledTimes(1);
        expect(estimateTxFeeOptimisticMocked).toHaveBeenCalledTimes(1);
        expect(makeContractCallMocked).toHaveBeenCalledTimes(1);
        expect(broadcastTransactionMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxErrorMocked).toHaveBeenCalledTimes(0);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(0);
        expect(lockContractMocked).toHaveBeenCalledTimes(1);
        expect(insertLiquidationMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxMocked).toHaveBeenCalledTimes(1);
    });


    test("liquidable position, do rbf", async () => {
        const getContractListMocked = mock(() => [{ ...contract, lockTx: '0x00' }]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getLiquidationByTxIdMocked = mock(() => ({
            txid: '0x00',
            contract: 'SPNS4V1TMDVNK1GXHP9XQ7PD4HR02GSDQ0THDCM.contract',
            status: 'pending',
            createdAt: epoch() - (RBF_THRESHOLD + 1),
            updatedAt: null,
            fee: 400000,
            nonce: 14
        }));
        const insertLiquidationMocked = mock(() => { });
        const finalizeLiquidationMocked = mock(() => { });
        mock.module("../../dba/liquidation", () => ({
            getLiquidationByTxId: getLiquidationByTxIdMocked,
            insertLiquidation: insertLiquidationMocked,
            finalizeLiquidation: finalizeLiquidationMocked
        }));

        const getMarketStateMocked = mock(() => (marketState));
        mock.module("../../dba/market", () => ({
            getMarketState: getMarketStateMocked,
        }));

        const getPriceFeedMocked = mock(() => (priceFeed));
        mock.module("../../price-feed", () => ({
            getPriceFeed: getPriceFeedMocked
        }));

        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token": 8.125664850930649,
                },
                totalRepayAmount: 8.125664850930649,
            }
        ]

        const getBorrowersToLiquidateMocked = mock(async () => borrowers);
        mock.module("../../borrower", () => ({
            getBorrowersToLiquidate: getBorrowersToLiquidateMocked,
        }));

        const calcMinOutMocked = mock(() => 7900000);
        const makeLiquidationTxOptionsMocked = mock(() => { });
        mock.module("./lib", () => ({
            calcMinOut: calcMinOutMocked,
            makeLiquidationTxOptions: makeLiquidationTxOptionsMocked
        }));

        const estimateSbtcToAeusdcMocked = mock(() => ({ dex: 2, dy: 8 }))
        mock.module("../../dex", () => ({
            estimateSbtcToAeusdc: estimateSbtcToAeusdcMocked
        }));

        const onLiqSwapOutErrorMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqSwapOutError: onLiqSwapOutErrorMocked
        }));

        const getContractOperatorPrivMocked = mock(() => 'ebeb600abc2019d5748a287dbbcb63cd1dc55c0b4b558833796d1274c0b6547f01');
        mock.module("../../dba/contract", () => ({
            getContractOperatorPriv: getContractOperatorPrivMocked
        }));

        const getAccountNoncesMocked = mock(async () => ({ possible_next_nonce: 15 }));
        mock.module("../../client/hiro", () => ({
            getAccountNonces: getAccountNoncesMocked
        }));

        const estimateTxFeeOptimisticMocked = mock(async () => 400000);
        const estimateRbfMultiplierMocked = mock(async () => 1.4)
        mock.module("../../fee", () => ({
            estimateTxFeeOptimistic: estimateTxFeeOptimisticMocked,
            estimateRbfMultiplier: estimateRbfMultiplierMocked
        }));

        const makeContractCallMocked = mock(async () => '');
        const broadcastTransactionMocked = mock(async () => ({
            txid: '0x01'
        }));

        mock.module("@stacks/transactions", () => ({
            makeContractCall: makeContractCallMocked,
            broadcastTransaction: broadcastTransactionMocked
        }));

        const onLiqTxErrorMocked = mock(() => { });
        const onLiqTxMocked = mock(() => { });
        mock.module("../../hooks", () => ({
            onLiqTxError: onLiqTxErrorMocked,
            onLiqTx: onLiqTxMocked
        }));

        const lockContractMocked = mock(() => { });
        mock.module("../../dba/contract", () => ({
            lockContract: lockContractMocked,
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(1);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(1);
        expect(getPriceFeedMocked).toHaveBeenCalledTimes(1);
        expect(getBorrowersToLiquidateMocked).toHaveBeenCalledTimes(1);
        expect(calcMinOutMocked).toHaveBeenCalledTimes(1);
        expect(estimateSbtcToAeusdcMocked).toHaveBeenCalledTimes(1);
        expect(onLiqSwapOutErrorMocked).toHaveBeenCalledTimes(0);
        expect(getContractOperatorPrivMocked).toHaveBeenCalledTimes(1);
        expect(getAccountNoncesMocked).toHaveBeenCalledTimes(0);
        expect(estimateTxFeeOptimisticMocked).toHaveBeenCalledTimes(0);
        expect(estimateRbfMultiplierMocked).toHaveBeenCalledTimes(1);
        expect((makeLiquidationTxOptionsMocked.mock.calls[0] as any)[0].fee).toEqual(560000);
        expect((makeLiquidationTxOptionsMocked.mock.calls[0] as any)[0].nonce).toEqual(14);
        expect(makeContractCallMocked).toHaveBeenCalledTimes(1);
        expect(broadcastTransactionMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxErrorMocked).toHaveBeenCalledTimes(0);
        expect(finalizeLiquidationMocked).toHaveBeenCalledTimes(1);
        expect(finalizeLiquidationMocked.mock.calls[0]).toEqual(["0x00", "dropped"] as any);
        expect(lockContractMocked).toHaveBeenCalledTimes(1);
        expect(lockContractMocked.mock.calls[0]).toEqual(["0x01", "SPNS4V1TMDVNK1GXHP9XQ7PD4HR02GSDQ0THDCM.contract"] as any);
        expect(insertLiquidationMocked).toHaveBeenCalledTimes(1);
        expect(onLiqTxMocked).toHaveBeenCalledTimes(1);
    });

    test("test rbf threshold", async () => {
        const getContractListMocked = mock(() => [{ ...contract, lockTx: '0x00' }]);
        mock.module("../../dba/contract", () => ({
            getContractList: getContractListMocked
        }));

        const getMarketStateMocked = mock(() => (marketState));
        mock.module("../../dba/market", () => ({
            getMarketState: getMarketStateMocked,
        }));

        const getLiquidationByTxIdMocked = mock(() => ({
            txid: '0x00',
            contract: 'SPNS4V1TMDVNK1GXHP9XQ7PD4HR02GSDQ0THDCM.contract',
            status: 'pending',
            createdAt: epoch() - (RBF_THRESHOLD - 1),
            updatedAt: null,
            fee: 400000,
            nonce: 14
        }));
        mock.module("../../dba/liquidation", () => ({
            getLiquidationByTxId: getLiquidationByTxIdMocked,
        }));

        await liquidateWorker();

        expect(getContractListMocked).toHaveBeenCalledTimes(1);
        expect(getLiquidationByTxIdMocked).toHaveBeenCalledTimes(1);
        expect(getMarketStateMocked).toHaveBeenCalledTimes(0);
    });
})