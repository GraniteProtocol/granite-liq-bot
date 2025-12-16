import { describe, expect, mock, test } from "bun:test";
import { estimateSbtcToAeusdc } from ".";

describe("dex", () => {
    test("estimateSbtcToAeusdc", async () => {    
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
        expect(result).toEqual({dex: 1, dy: 13});
    });
});
