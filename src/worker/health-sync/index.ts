import assert from "assert";
import { calcBorrowerStatus } from "../../borrower";
import { dbCon } from "../../db/con";
import { clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowersForHealthCheck, insertBorrowerStatus } from "../../dba/borrower";
import { getMarketState } from "../../dba/market";
import { toTicker } from "../../helper";
import { getPriceFeed } from "../../price-feed";
import type { PriceTicker } from "../../types";

export const worker = async () => {
  const borrowers = getBorrowersForHealthCheck();
  if (borrowers.length === 0) {
    clearBorrowerStatuses();
    return;
  }

  const marketState = getMarketState();
  const tickers: PriceTicker[] = [];
  for (const borrower of borrowers) {
    for (const collateral of borrower.collaterals) {
      if(tickers.indexOf(toTicker(collateral)) === -1){
        tickers.push(toTicker(collateral));
      }
    }
  }

  const priceFeed =  await getPriceFeed(tickers, marketState);

  dbCon.transaction(() => {
    clearBorrowerStatuses();
    for (const borrower of borrowers) {
      if (borrower.debtShares === 0) {
        continue;
      }

      const collateralsDeposited: Record<string, { amount: number, price: number, decimals: number }> = {}
      for (const collateral of borrower.collaterals) {
        const amount = getBorrowerCollateralAmount(borrower.address, collateral);
        assert(amount !== undefined, "User collateral amount is undefined");
        const feed = priceFeed.items[toTicker(collateral)]!;
        const price = Number(feed.price);
        const decimals = -1 * feed.expo;
        collateralsDeposited[collateral] = {
          amount, price, decimals
        };
      }

      const status = calcBorrowerStatus({
        debtShares: borrower.debtShares,
        collateralsDeposited
      }, marketState);

      insertBorrowerStatus(borrower.address, status);
    }
  })();
};

export const main = async () => {
  await worker();
}


