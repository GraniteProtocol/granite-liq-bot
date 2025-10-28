import { intCV, responseErrorCV, responseOkCV, tupleCV, uintCV } from "@stacks/transactions";
import { uint } from "@stacks/transactions/dist/cl";
import { expect, mock, test } from "bun:test";
import { getPythPriceFeed } from "./read-only-call";

test("getPythPriceFeed with success response", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => responseOkCV(tupleCV({
            "conf": uintCV(2961227449),
            "ema-conf": uintCV(3200851000),
            "ema-price": uint(11279433900000),
            "expo": intCV(-8),
            "prev-publish-time": uintCV(1755859534),
            "price": uintCV(11255522419598),
            "publish-time": uintCV(1755859534)
        }))
    }));

    expect(await getPythPriceFeed("0x")).toEqual({
        price: "11255522419598",
        expo: -8,
        publish_time: 1755859534,
    })
});

test("getPythPriceFeed with error response", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => responseErrorCV(uintCV(5002))
    }));

    expect(await getPythPriceFeed("0x")).toBe(null);
});
