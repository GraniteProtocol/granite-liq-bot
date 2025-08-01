import assert from "assert";
import { dbCon } from "../../db/con";
import { clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowersForHealthCheck, insertBorrowerStatus } from "../../dba/borrower";
import { getMarketState } from "../../dba/market";
import { toTicker } from "../../helper";
import { getPriceFeed } from "../../price-feed";
import { calcBorrowerStatus } from "./lib";

export const worker = async () => {
  const borrowers = getBorrowersForHealthCheck();
  if (borrowers.length === 0) {
    clearBorrowerStatuses();
    return;
  }

  const marketState = getMarketState();

  dbCon.transaction(async () => {
    clearBorrowerStatuses();
    for (const borrower of borrowers) {
      if (borrower.debtShares === 0) {
        continue;
      }

      const collateralsDeposited: Record<string, { amount: number, price: number, decimals: number }> = {}
      for (const collateral of borrower.collaterals) {
        const amount = getBorrowerCollateralAmount(borrower.address, collateral);
        assert(amount !== undefined, "User collateral amount is undefined");
        const feed = await getPriceFeed(toTicker(collateral), marketState);
        console.log(feed)
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


