import { fetchGetBorrowerPositions } from "../../client/backend";

export const generateDescendingPriceBuckets = (
    currentPrice: number,
    stepUsd: number = 100,
    count: number = 20,
    decimals: number = 8
): number[] => {
    const one = Math.pow(10, decimals); // 10^8
    const step = stepUsd * one;

    const start = Math.floor(currentPrice / step) * step;

    return Array.from({ length: count }, (_, i) => start - i * step);
}

export const getBorrowers = async () => {
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