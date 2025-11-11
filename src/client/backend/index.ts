import { USE_STAGING } from "../../constants";
import { createLogger } from "../../logger";
import { withRetry } from "../../util";
import type { LiquidationsResponse, MarketInfoResponse } from "./types";

const logger = createLogger("backend");

const baseUrl = USE_STAGING ? 'https://api-staging.granite.world' : 'https://api.granite.world';

export const _fetchGetMarketInfo = async (): Promise<MarketInfoResponse> => {
    const url = `${baseUrl}/v1/market/info`;
    return fetch(url).then(r => r.json());
};

export const _fetchGetBorrowerPositions = async (limit: number = 20, offset: number = 0): Promise<LiquidationsResponse> => {
    const url = `${baseUrl}/v1/liquidations/account_health?limit=${limit}&offset=${offset}`;
    return fetch(url).then(r => r.json());
};

export async function fetchGetMarketInfo(): Promise<MarketInfoResponse> {
    return withRetry(_fetchGetMarketInfo, 5, async (err, attempt) => {
        logger.error(
            `fetchGetMarketInfo call failed at attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`
        );
        await new Promise(res => setTimeout(res, 200));
    });
};

export const fetchGetBorrowerPositions = async (limit: number = 20, offset: number = 0): Promise<LiquidationsResponse> => {
    return withRetry(async () => _fetchGetBorrowerPositions(limit, offset), 5, async (err, attempt) => {
        logger.error(
            `fetchGetBorrowerPositions call failed at attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`
        );
        await new Promise(res => setTimeout(res, 200));
    });
};