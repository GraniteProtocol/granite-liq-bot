import { fetchAndProcessPriceFeed } from "./client/pyth";
import { PRICE_FEED_FRESHNESS_BUFFER, PRICE_FEED_FRESHNESS_THRESHOLD } from "./constants";
import type { MarketState, PriceFeedItemWithAttestation, PriceTicker } from "./types";
import { epoch } from "./util";

export const getPriceFeed = async (ticker: PriceTicker, marketState: MarketState): Promise<PriceFeedItemWithAttestation> => {

    if (marketState.onChainPriceFeed[ticker] &&
        (epoch() - marketState.onChainPriceFeed[ticker].publish_time) < (PRICE_FEED_FRESHNESS_THRESHOLD - PRICE_FEED_FRESHNESS_BUFFER)) {
        return { attestation: null, ...marketState.onChainPriceFeed[ticker] };
    }

    const liveFeed = await fetchAndProcessPriceFeed();
    if (liveFeed.items[ticker]) {
        return { attestation: liveFeed.attestation, ...liveFeed.items[ticker] }
    }

    throw new Error('Feed not found');
}