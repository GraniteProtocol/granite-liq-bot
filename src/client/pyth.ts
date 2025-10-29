import { PRICE_FEED_IDS } from "../constants";
import { createLogger } from "../logger";
import type { PriceFeedResponse } from "../types";
import { withRetry } from "../util";

const logger = createLogger("pyth");

export async function fetchAndProcessPriceFeedInner(): Promise<PriceFeedResponse> {
  const feedParams = PRICE_FEED_IDS.map((t) => `ids[]=${t.feed_id}`).join('&');
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${feedParams}&binary=true`;

  const data = await fetch(url).then(r => r.arrayBuffer())

  const buffer = Buffer.from(data);
  const decodedText = buffer.toString();
  const result = JSON.parse(decodedText);

  const attestation = result.binary.data[0];
  const items = result.parsed.reduce(
    (acc: any, item: any, index: number) => {
      const { price, expo, publish_time } = item.price;
      acc[PRICE_FEED_IDS[index].ticker] = { price, expo, publish_time };
      return acc;
    },
    {}
  );

  return {
    attestation: attestation,
    items,
  };
}


export async function fetchAndProcessPriceFeed(): Promise<PriceFeedResponse> {
  return withRetry(fetchAndProcessPriceFeedInner, 5, async (err, attempt) => {
    logger.error(
      `Pyth HTTP call failed at attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`
    );
    await new Promise(res => setTimeout(res, 1000));
  });
}