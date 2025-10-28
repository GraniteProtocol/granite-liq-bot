import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { bufferFromHex } from "@stacks/transactions/dist/cl";
import { getMarket } from "../helper";
import type { InterestRateParams } from "../types";
import { type AssetInfo } from '../types';
import { fetchFn, } from "./hiro";

export const getIrParams = async (): Promise<InterestRateParams> => {
  const market = getMarket();
  const { contracts } = market;

  return fetchCallReadOnlyFunction({
    contractAddress: contracts.INTEREST_RATE.principal,
    contractName: contracts.INTEREST_RATE.name,
    functionName: "get-ir-params",
    functionArgs: [],
    senderAddress: contracts.INTEREST_RATE.principal,
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

export const getLiquidatorContractInfo = async (address: string) => {
  const [contractAddress, contractName] = address.trim().split('.');
  const info = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-info',
    functionArgs: [],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => cvToJSON(r));

  const operator = info.value["operator"].value
  const marketAsset = info.value["market-asset"].value;
  const collateralAsset = info.value["collateral-asset"].value;
  const unprofitabilityThreshold = Number(info.value["unprofitability-threshold"].value);
  const flashLoanSc = info.value["flash-loan-sc"].value
  const usdhThreshold = Number(info.value["usdh-threshold"].value);

  return {
    operator,
    marketAsset,
    collateralAsset,
    unprofitabilityThreshold,
    flashLoanSc,
    usdhThreshold
  }
}

export const getPythPriceFeed = async (priceId: string) => {
  const { principal: contractAddress, name: contractName } = getMarket().contracts.PYTH_STORAGE;

  const resp = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'read-price-with-staleness-check',
    functionArgs: [
      bufferFromHex(priceId)
    ],
    senderAddress: contractAddress,
    network: 'mainnet',
    client: {
      fetch: fetchFn,
    }
  }).then(r => cvToJSON(r));

  if (typeof resp?.value?.value !== "object") {
    return null;
  }

  const { value } = resp.value;

  return {
    price: value.price.value,
    expo: Number(value.expo.value),
    publish_time: Number(value["publish-time"].value),
  }
}