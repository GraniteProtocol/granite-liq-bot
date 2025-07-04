import { describe, expect, mock, test } from "bun:test";
import { estimateSbtcToAeusdc } from ".";

describe("dex", () => {
    test("estimateSbtcToAeusdc", async () => {
        mock.module("./alex", () => {
            return {
                estimateSbtcToAeusdc: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(12);   
                    })
                }
            }
        });
    
        mock.module("./bitflow", () => {
            return {
                estimateSbtcToAeusdc: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(13)
                    })
                }
            }
        });

        const result = await estimateSbtcToAeusdc(0.01);
        expect(result).toEqual({dex: 2, dy: 13});
    });

    test("estimateSbtcToAeusdc 2", async () => {
        mock.module("./alex", () => {
            return {
                estimateSbtcToAeusdc: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(16.1);   
                    })
                }
            }
        });
    
        mock.module("./bitflow", () => {
            return {
                estimateSbtcToAeusdc: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(16)
                    })
                }
            }
        });

        const result = await estimateSbtcToAeusdc(0.01);
        expect(result).toEqual({dex: 1, dy: 16.1});
    });


    test("estimateSbtcToAeusdc usdh", async () => {
        mock.module("./hermetica", () => {
            return {
                getPriceSlippage: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(0);   
                    })
                }
            }
        });

        mock.module("./bitflow", () => {
            return {
                estimateUsdhToToAeusdc: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(1.1)
                    })
                }
            }
        });
    
        const result = await estimateSbtcToAeusdc(0.01, { btcPriceBn: 9488226303172n, minterContract: '' });
        expect(result).toEqual({dex: 2, dy: 1.1});
    });
});
