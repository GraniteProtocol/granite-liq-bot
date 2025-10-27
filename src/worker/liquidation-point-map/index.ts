import assert from "assert";
import { kvStoreSet } from "../../db/helper";
import { getMarketState } from "../../dba/market";
import { getMarket, toTicker } from "../../helper";
import { createLogger } from "../../logger";
import { getPriceFeed } from "../../price-feed";
import type { PriceTicker } from "../../types";
import { epoch } from "../../util";
import { calcBorrowerStatus } from "../health-sync/lib";
import { generateDescendingPriceBuckets, getBorrowers } from "./lib";

const logger = createLogger("liquidation-point-map");

type LiquidationPoint = { liquidationPriceUSD: number, liquidatedAmountUSD: number };

export const worker = async () => {
    const marketState = getMarketState();
    const borrowers = await getBorrowers();
    const market = getMarket();
    const tickers: PriceTicker[] = market.collaterals.map(x => toTicker(x.contract.id));
    const priceFeed = await getPriceFeed(tickers, marketState);
    const map: Record<string, LiquidationPoint[]> = {}

    for (let coll of market.collaterals) {
        const collateral = `${coll.contract.principal}.${coll.contract.name}`;
        const ticker = toTicker(collateral);
        const feed = priceFeed.items[ticker]!;
        const price = Number(feed.price);
        const decimals = -1 * feed.expo;
        const buckets = generateDescendingPriceBuckets(price, 100, 300, decimals);
        const data: LiquidationPoint[] = [];

        for (let bucket of buckets) {
            let liquidatedAmountUSD = 0;

            for (const borrower of borrowers) {
                if (borrower.debtShares === 0) {
                    continue;
                }
                const amount = borrower.collaterals[collateral];
                assert(amount !== undefined, "User collateral amount is undefined");
                const collateralsDeposited = {
                    [collateral]:
                    {
                        amount, price: bucket, decimals
                    }
                };

                const status = calcBorrowerStatus({
                    debtShares: borrower.debtShares,
                    collateralsDeposited
                }, marketState);

                liquidatedAmountUSD += status.totalRepayAmount;
            }
            data.push({ liquidationPriceUSD: bucket / 10 ** decimals, liquidatedAmountUSD });
        }

        map[ticker] = data;
    }

    kvStoreSet("liquidation-map", JSON.stringify(map));
};

let lastSyncTs = 0

export const main = async () => {
    if (lastSyncTs < epoch() - 300) { // 5 mins
        await worker();
        lastSyncTs = epoch();
    }
}
