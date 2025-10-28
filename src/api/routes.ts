import {
    getAddressFromPrivateKey
} from "@stacks/transactions";
import { generateWallet } from "@stacks/wallet-sdk";
import { getBorrowersToLiquidate } from "../borrower";
import { getContractInfo } from "../client/hiro";
import { getAssetInfo, getLiquidatorContractInfo } from "../client/read-only-call";
import * as constants from "../constants";
import { kvStoreGet } from "../db/helper";
import { getContractList, insertContract } from "../dba/contract";
import { getLiquidationList } from "../dba/liquidation";
import { getMarketState } from "../dba/market";
import type { Filter } from "../dba/sql";
import { getPriceFeed } from "../price-feed";
import { parseUnits } from "../units";

export const errorResponse = (error: any) => {
    if (typeof error === 'string') {
        return Response.json({ error: error }, { status: 400 });
    };

    const message = error instanceof Error ? error.message : 'Server error';
    return Response.json({ error: message }, { status: 400 });
}

export const routes = {
    getContracts: async (_: Request) => {
        const contracts = getContractList({});
        return Response.json(contracts);
    },
    addContract: async (req: Request) => {
        const body = await req.json();
        const address = body.address?.trim();
        const mnemonic = body.mnemonic?.trim();

        if (address === '') {
            return errorResponse('Enter an address');
        }

        if (mnemonic === '') {
            return errorResponse('Enter a mnemonic');
        }

        if (getContractList({}).length > 0) {
            return errorResponse(`A contract is already exists`);
        }

        let wallet;
        try {
            wallet = await generateWallet({ secretKey: mnemonic, password: "", });
        } catch (error) {
            return errorResponse(error);
        }

        const [operator] = wallet.accounts;
        const operatorAddress = getAddressFromPrivateKey(operator.stxPrivateKey, 'mainnet');

        let contractInfo;
        try {
            contractInfo = await getContractInfo(address, 'mainnet');
        } catch (error) {
            return errorResponse('Could not fetch contract info');
        }

        if (contractInfo.error && contractInfo.message) {
            return errorResponse(contractInfo.message);
        }

        let onChainOperatorAddress;
        let marketAsset;
        let collateralAsset;
        let unprofitabilityThreshold;
        let flashLoanSc;
        let usdhThreshold;
        try {
            const info = await getLiquidatorContractInfo(address);

            onChainOperatorAddress = info.operator;
            marketAsset = info.marketAsset;
            collateralAsset = info.collateralAsset;
            unprofitabilityThreshold = info.unprofitabilityThreshold;
            flashLoanSc = info.flashLoanSc;
            usdhThreshold = info.usdhThreshold;
        } catch (error) {
            return errorResponse('Could not fetch contract info');
        }

        if (onChainOperatorAddress !== operatorAddress) {
            return errorResponse('Contract operator does not match');
        }

        let marketAssetInfo;
        try {
            marketAssetInfo = await getAssetInfo(marketAsset);
        } catch (error) {
            return errorResponse('Could not fetch market asset info');
        }

        let collateralAssetInfo;
        try {
            collateralAssetInfo = await getAssetInfo(collateralAsset);
        } catch (error) {
            return errorResponse('Could not fetch collateral asset info');
        }

        insertContract(address, operatorAddress, operator.stxPrivateKey, marketAssetInfo, collateralAssetInfo, unprofitabilityThreshold, flashLoanSc, usdhThreshold);
        const contracts = getContractList({});
        return Response.json(contracts);

    },
    getBorrowers: async (_: Request) => {
        const marketState = getMarketState();
        const priceFeed = await getPriceFeed(["btc"], marketState);
        const borrowers = await getBorrowersToLiquidate(marketState, priceFeed);

        return Response.json(borrowers);
    },
    health: async () => {
        const lastSync = kvStoreGet("last-sync");
        const now = Date.now();

        let operatorBalance: number | null = null;
        let marketAssetBalance: number | null = null;
        const contract = getContractList({})[0];
        if (contract) {
            operatorBalance = contract.operatorBalance;
            marketAssetBalance = contract.marketAsset?.balance || null;
        }

        const lastLiquidation = getLiquidationList({ limit: 1 })[0] || null;

        const isHealthy = lastSync && Number(lastSync) > now - 120_000 && // Healthy if last sync was less than 120 seconds ago
            (operatorBalance === null || operatorBalance >= parseUnits(constants.ALERT_BALANCE, 6)) // Operator balance can be null if there is no contract. Otherwise it should be bigger than ALERT_BALANCE

        return Response.json({
            now: new Date(now).toISOString(),
            lastSync: lastSync ? new Date(Number(lastSync)).toISOString() : null,
            lastLiquidation,
            balances: {
                operatorBalance,
                marketAssetBalance,
            },
            isHealthy
        });
    },
    liquidations: async (url: URL) => {
        const fromTimestamp = url.searchParams.get('fromTimestamp');
        const toTimestamp = url.searchParams.get('toTimestamp');
        const limit = Number(url.searchParams.get('limit'));

        let filters: Filter[] = [];
        if (fromTimestamp) {
            filters.push(['created_at', '>=', fromTimestamp]);
        }
        if (toTimestamp) {
            filters.push(['created_at', '<=', toTimestamp]);
        }

        const list = getLiquidationList({
            filters,
            limit: (Number.isInteger(limit) && limit > 0) ? Math.min(100, limit) : 50
        });
        return Response.json(list);
    },
    liquidationPointMap: async () => {
        const raw = kvStoreGet("liquidation-map");
        if (!raw) {
            return Response.json([]);
        }
        const map = JSON.parse(raw);
        return Response.json(map["btc"]);
    },
    config: async () => {
        return Response.json({
            ENV: process.env.NODE_ENV || "",
            ...constants
        });
    }
}
