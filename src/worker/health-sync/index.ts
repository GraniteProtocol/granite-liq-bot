import assert from "assert";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { dbCon } from "../../db/con";
import { clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowersForHealthCheck, insertBorrowerStatus } from "../../dba/borrower";
import { getMarketState } from "../../dba/market";
import { calcBorrowerStatus } from "./lib";

export const worker = async () => {
  const borrowers = getBorrowersForHealthCheck();
  if (borrowers.length === 0) {
    clearBorrowerStatuses();
    return;
  }

  const priceFeed = await fetchAndProcessPriceFeed();
  const marketState = getMarketState();

  dbCon.transaction(() => {
    clearBorrowerStatuses();
    for (const borrower of borrowers) {
      if (borrower.debtShares === 0) {
        continue;
      }

      const collateralsDeposited: Record<string, number> = {}
      for (const collateral of borrower.collaterals) {
        const amount = getBorrowerCollateralAmount(borrower.address, collateral);
        assert(amount !== undefined, "User collateral amount is undefined");
        collateralsDeposited[collateral] = amount;
      }

      const status = calcBorrowerStatus({
        debtShares: borrower.debtShares,
        collateralsDeposited
      }, marketState, priceFeed);

      insertBorrowerStatus(borrower.address, status);
    }
  })();
};

export const main = async () => {
  await worker();
}


