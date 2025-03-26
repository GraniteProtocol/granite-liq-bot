import {
    cvToJSON, fetchCallReadOnlyFunction,
    getAddressFromPrivateKey
} from "@stacks/transactions";
import { generateWallet } from "@stacks/wallet-sdk";
import { getContractInfo } from "granite-liq-bot-common";
import { getAssetInfo } from "../client/read-only-call";
import { kvStoreGet } from "../db/helper";
import { getBorrowerStatusList } from "../dba/borrower";
import { getContractList, insertContract } from "../dba/contract";
import { getNetworkNameFromAddress } from "../helper";

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

        let network;

        try {
            network = getNetworkNameFromAddress(address);
        } catch (error) {
            return errorResponse(error);
        }

        if (network !== 'mainnet') {
            return errorResponse('Only mainnet allowed');
        }

        if (getContractList({ filters: { network } }).length > 0) {
            return errorResponse(`A contract for ${network} already exists`);
        }


        let wallet;
        try {
            wallet = await generateWallet({ secretKey: mnemonic, password: "", });
        } catch (error) {
            return errorResponse(error);
        }

        const [operator] = wallet.accounts;
        const operatorAddress = getAddressFromPrivateKey(operator.stxPrivateKey, network);

        let contractInfo;
        try {
            contractInfo = await getContractInfo(address, network);
        } catch (error) {
            return errorResponse('Could not fetch contract info');
        }

        if (contractInfo.error && contractInfo.message) {
            return errorResponse(contractInfo.message);
        }

        let onChainOperatorAddress;
        let marketAsset;
        let collateralAsset;
        const [contractAddress, contractName] = address.trim().split('.');
        try {
            const info = await fetchCallReadOnlyFunction({
                contractAddress,
                contractName,
                functionName: 'get-info',
                functionArgs: [],
                senderAddress: operatorAddress,
                network: network,
            }).then(r => cvToJSON(r));

            onChainOperatorAddress = info.value["operator"].value
            marketAsset = info.value["market-asset"].value;
            collateralAsset = info.value["collateral-asset"].value;
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

        insertContract(address, network, operatorAddress, operator.stxPrivateKey, marketAssetInfo, collateralAssetInfo);
        const contracts = getContractList({});
        return Response.json(contracts);

    },
    getBorrowers: async (_: Request, url: URL) => {
        const network = url.searchParams.get('network') || 'mainnet';

        const borrowers = await getBorrowerStatusList({
            filters: {
                network: network
            },
            orderBy: 'total_repay_amount DESC, risk DESC'
        });

        return Response.json(borrowers);
    },
    health: async () => {
        const lastSync = kvStoreGet("last-sync");

        const now = Date.now();
        const isHealthy = lastSync && Number(lastSync) > now - 120_000; // Healthy if last sync was less than 120 seconds ago

        return Response.json({
            now: new Date(now).toISOString(),
            lastSync: new Date(Number(lastSync)).toISOString(),
            isHealthy
        });
    }
}
