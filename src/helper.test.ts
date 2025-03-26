import { describe, expect, test } from "bun:test";
import { toTicker } from "./helper";

describe("helper", () => {
    test("toTicker", () => {
        expect(toTicker("ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc")).toEqual("btc");
        expect(toTicker("ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth")).toEqual("eth");
        expect(toTicker("ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc")).toEqual("usdc");
        expect(toTicker("SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc")).toEqual("usdc");
        expect(toTicker("SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token")).toEqual("btc");
        expect(toTicker("aeUSDC")).toEqual("usdc");
        expect(toTicker("sBTC")).toEqual("btc");
    });
});

