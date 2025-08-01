import { PRICE_FEED_IDS } from "../constants";
import type { PriceFeedResponse } from "../types";


export async function fetchAndProcessPriceFeed(): Promise<PriceFeedResponse> {
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

