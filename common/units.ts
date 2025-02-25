import BigNumber from "bignumber.js";

export function formatUnits(
  amount: number,
  decimals: number
): number {
  if (amount === 0) return 0;
  return Number(BigNumber(amount).div(BigNumber(10).pow(decimals)).toString());
}

export const parseUnits = ( 
  amount: string | number,
  decimals: number
) => {
  return Number(BigNumber(amount).multipliedBy(BigNumber(10).pow(decimals)).toString());
};

export const toFixedHalfDown = (num: number, precision: number) => {
  return Number(BigNumber(num).toFixed(precision, BigNumber.ROUND_HALF_DOWN).toString());
}

export const toFixedDown = (num: number, precision: number) => {
  return Number(BigNumber(num).toFixed(precision, BigNumber.ROUND_DOWN).toString());
}

// to fixed without rounding
export const toFixed = (num: number, precision: number) => {
  const s = num.toString();
  const [integer, decimal] = s.split(".");
  if (decimal) {
    return Number(`${integer}.${decimal.slice(0, precision)}`);
  }
  return Number(s);
}
