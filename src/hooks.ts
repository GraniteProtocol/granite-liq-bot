import { WebClient } from "@slack/web-api";
import { createLogger } from "./logger";
import type { LiquidationBatch } from "./types";

const logger = createLogger("hooks");

const SLACK_TOKEN = process.env.SLACK_TOKEN?.trim();
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID?.trim();

const slackClient = SLACK_TOKEN && SLACK_CHANNEL_ID ? new WebClient(process.env.SLACK_TOKEN, {}) : null;

export const MESSAGE_EXPIRES = 60_000;

export const MESSAGE_CACHE: Record<string, number> = {};

export const clearMessageCache = () => {
    for (const c of Object.keys(MESSAGE_CACHE)) {
        if (MESSAGE_CACHE[c] <= Date.now()) {
            MESSAGE_CACHE[c] = 0;
        }
    }
}

setInterval(clearMessageCache, MESSAGE_EXPIRES);

const slackMessage = async (message: string, key?: string) => {
    const cacheKey = Bun.hash(key || message).toString();

    if (MESSAGE_CACHE[cacheKey]) {
        return;
    }

    MESSAGE_CACHE[cacheKey] = Date.now() + MESSAGE_EXPIRES;

    if (slackClient) {
        try {
            await slackClient.chat.postMessage({
                text: message,
                channel: SLACK_CHANNEL_ID!,
            });
        } catch (e) {
            logger.error(`Could not post slack message due to: ${e}`);
        }
    }
}

export const onStart = async () => {
    await slackMessage('Info: Liq-bot started');
}

export const onExit = async (msg?: string) => {
    await slackMessage(msg ? `Error: Liq-bot stopped: ${'`'}${msg}${'`'}` : 'Info: Liq-bot stopped');
}

export const onLiqTx = async (txid: string, spend: number, receive: number, minExpected: number, dex: string, collateralPrice: string, batch: LiquidationBatch[]) => {
    await slackMessage(`Info: New liquidation: ${'`'}${txid}${'`'} ${'```'}spend: ${spend} usd \nreceive: ${receive} btc \nmin expected: ${minExpected} \ndex: ${dex} \ncollateralPrice:${collateralPrice} usd \nbatch: ${JSON.stringify(batch, null, 2)}${'```'}`);
}

export const onLiqSwapOutError = async (spend: number, receive: number, minExpected: number, dex: string, dy: number) => {
    await slackMessage(`Warning: Swap out is lower than min expected.${'```'}spend: ${spend} usd, \nreceive: ${receive} btc, \nmin expected: ${minExpected} usd, \ndex: ${dex} \nswap out: ${dy} usd${'```'}`, dy.toString());
}

export const onLiqTxError = async (reason: string) => {
    await slackMessage(`Error: Transaction broadcast failed due to: ${'`'}${reason}${'`'}`);
}

export const onLiqTxEnd = async (txid: string, status: string) => {
    await slackMessage(`Info: Liquidation tx ${'`'}${txid}${'`'} finalized with status ${'`'}${status}${'`'}`);
}

export const onLowFunds = async (balance: string, address: string) => {
    await slackMessage(`Warning: Operator balance is low: ${'`'}${balance}${'`'}, Send funds to: ${address}`, balance);
}