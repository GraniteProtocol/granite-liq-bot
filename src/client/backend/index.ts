import { USE_STAGING } from "../../constants";
import type { LiquidationsResponse, MarketInfoResponse } from "./types";

const baseUrl = USE_STAGING ? 'https://api-staging.granite.world' : 'https://api.granite.world';

export const fetchGetMarketInfo = async (): Promise<MarketInfoResponse> => {
    const url = `${baseUrl}/v1/market/info`;
    return fetch(url).then(r => r.json());
};

export const fetchGetBorrowerPositions = async (limit: number = 20, offset: number = 0): Promise<LiquidationsResponse> => {
    const url = `${baseUrl}/v1/liquidations/account_health?limit=${limit}&offset=${offset}`;
    return fetch(url).then(r => r.json());
};
