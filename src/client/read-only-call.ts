import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction, principalCV } from "@stacks/transactions";
import { fetchFn, type AssetInfo, type NetworkName } from "granite-liq-bot-common";
import { CONTRACTS } from "../constants";
import type { AccrueInterestParams, BorrowerPositionEntity, CollateralParams, DebtParams, InterestRateParams, LpParams } from "../types";


export const getIrParams = async (): Promise<InterestRateParams> => {
  const [contractAddress, contractName] = CONTRACTS.ir.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-ir-params",
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);
    return {
      baseIR: Number(json.value["base-ir"].value),
      slope1: Number(json.value["ir-slope-1"].value),
      slope2: Number(json.value["ir-slope-2"].value),
      urKink: Number(json.value["utilization-kink"].value),
    }
  })
}

export const getLpParams = async (): Promise<LpParams> => {
  const [contractAddress, contractName] = CONTRACTS.state.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-lp-params",
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);
    return {
      totalAssets: Number(json.value["total-assets"].value),
      totalShares: Number(json.value["total-shares"].value),
    }
  })
};

export const getAccrueInterestParams = async (): Promise<AccrueInterestParams> => {
  const [contractAddress, contractName] = CONTRACTS.state.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-accrue-interest-params",
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);

    return {
      lastAccruedBlockTime: Number(json.value.value["last-accrued-block-time"].value)
    }
  })
}

export const getDebtParams = async (): Promise<DebtParams> => {
  const [contractAddress, contractName] = CONTRACTS.state.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-debt-params",
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);

    return {
      openInterest: Number(json.value["open-interest"].value),
      totalDebtShares: Number(json.value["total-debt-shares"].value),
    }
  })
};

export const getCollateralParams = async (collateral: string): Promise<CollateralParams> => {
  const [contractAddress, contractName] = CONTRACTS.state.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-collateral",
    functionArgs: [
      contractPrincipalCV(collateral.split(".")[0], collateral.split(".")[1])
    ],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);

    return {
      liquidationLTV: Number(json.value.value["liquidation-ltv"].value),
      maxLTV: Number(json.value.value["max-ltv"].value),
      liquidationPremium: Number(json.value.value["liquidation-premium"].value)
    }
  })
};

export const getUserPosition = async (address: string): Promise<Pick<BorrowerPositionEntity, 'debtShares' | 'collaterals'>> => {
  const [contractAddress, contractName] = CONTRACTS.state.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-user-position",
    functionArgs: [
      principalCV(address),
    ],
    senderAddress: address,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);

    if (json.value === null) {
      return {
        debtShares: 0,
        collaterals: []
      }
    };

    return {
      debtShares: Number(json.value.value["debt-shares"].value),
      collaterals: json.value.value.collaterals.value.map((c: any) => c.value)
    }
  })
}

export const getUserCollateralAmount = async (address: string, collateral: string): Promise<number> => {
  const [contractAddress, contractName] = CONTRACTS.state.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-user-collateral",
    functionArgs: [
      principalCV(address),
      contractPrincipalCV(collateral.split(".")[0], collateral.split(".")[1])
    ],
    senderAddress: address,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => {
    const json = cvToJSON(r);
    return Number(json.value.value.amount.value);
  })
}

export const getAssetInfo = async (address: string): Promise<AssetInfo> => {
  const [contractAddress, contractName] = address.split(".");
  const name = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-name',
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => cvToJSON(r).value.value);

  const symbol = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-symbol',
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => cvToJSON(r).value.value);

  const decimals = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-decimals',
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => cvToJSON(r).value.value);

  return {
    address, name, symbol, decimals: Number(decimals)
  }
}

export const getAssetBalance = async (assetAddress: string, contractId: string) => {
  const [contractAddress, contractName] = assetAddress.split(".");
  return await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-balance',
    functionArgs: [
      contractPrincipalCV(contractId.split(".")[0], contractId.split(".")[1])
    ],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => Number(cvToJSON(r).value.value));
}