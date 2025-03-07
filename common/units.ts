export function formatUnits(
  amount: number,
  decimals: number
): number {
  if (amount === 0) return 0;
  return Number((BigInt(amount) / BigInt(10) ** BigInt(decimals)).toString());
}

export const parseUnits = ( 
  amount: string | number,
  decimals: number
) => {
  return Number((BigInt(amount) * BigInt(10) ** BigInt(decimals)).toString());
};

export const toFixedHalfDown = (num: number, precision: number) => {
  const factor = 10n ** BigInt(precision);
  return Number(((BigInt(num * Number(factor)) + 5n) / 10n * 10n ** BigInt(precision - 1)).toString());
};

export const toFixedDown = (num: number, precision: number) => {
  const factor = 10n ** BigInt(precision);
  return Number((BigInt(num * Number(factor)) / factor).toString());
};
