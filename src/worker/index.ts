import { USE_STAGING } from "../constants";
import { createLogger } from "../logger";
import { main as contractSync } from "./contract-sync";
import { main as liquidate } from "./liquidate";
import { main as liquidationPointMapSync } from "./liquidation-point-map";
import { main as marketSync } from "./market-sync";

const BASE_DELAY = 15_000;

const logger = createLogger("event-sync");

const workerInner = async () => {
    await contractSync();
    await marketSync();
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
    console.log(`Worker started in "${USE_STAGING ? 'staging' : 'production'}" environment`);
    worker();
}