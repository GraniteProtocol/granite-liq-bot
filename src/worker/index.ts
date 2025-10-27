import { CONTRACTS } from "../constants";

import { createLogger } from "../logger";
import { main as contractSync } from "./contract-sync";
import { main as liquidate } from "./liquidate";
import { main as liquidationPointMapSync } from "./liquidation-point-map";
import { main as marketSync } from "./market-sync";
import { main as usdhSync } from "./usdh-sync";

const BASE_DELAY = 30_000;

const logger = createLogger("event-sync");

const workerInner = async () => {
    await contractSync();
    await marketSync();
    await usdhSync();
    await liquidate();
    await liquidationPointMapSync();
}

const worker = async () => {
    const start = Date.now();

    await workerInner();

    const end = Date.now();
    const delay = Math.max(1000, BASE_DELAY - (end - start));

    setTimeout(worker, delay);
}

export const main = async () => {
    console.log("--------------------------------");
    console.log("Worker started with contracts:")
    console.log(CONTRACTS);
    console.log("--------------------------------");
    worker();
}