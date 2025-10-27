import assert from "assert";
import { fetchGetBorrowerPositions } from "../../client/backend";
import { kvStoreSet } from "../../db/helper";
import { getMarketState } from "../../dba/market";
import { getMarket, toTicker } from "../../helper";
import { createLogger } from "../../logger";
import { getPriceFeed } from "../../price-feed";
import type { PriceTicker } from "../../types";
import { calcBorrowerStatus } from "../health-sync/lib";
import { generateDescendingPriceBuckets } from "./lib";


const logger = createLogger("liquidation-point-map");

type LiquidationPoint = { liquidationPriceUSD: number, liquidatedAmountUSD: number };

const getBorrowers = async () => {
    const borrowers: {
        address: string,
        debtShares: number,
        collaterals: Record<string, number>
    }[] = [];

    let limit = 20;
    let offset = 0;
    const adresses: string[] = [];

    while (true) {
        const resp = await fetchGetBorrowerPositions(limit, offset);
        for (const r of resp.data) {
            if (adresses.indexOf(r.user) === -1) {
                borrowers.push({ address: r.user, debtShares: r.debt_shares, collaterals: r.collateral_balances });
                adresses.push(r.user);
            }
        }
        if (resp.data.length < limit) break;
        offset += limit;
    }

    return borrowers;
}

export const workerInner = async () => {
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

export const worker = async () => {
    try {
        await workerInner();
    } catch (e) {
        logger.error(`Liquidation point mape error: ${e}`);
    }
}

export const main = async () => {
    await worker();

    setInterval(worker, 300_000); // 5 mins
}
