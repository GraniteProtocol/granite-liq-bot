import { networkFromName, type StacksNetworkName } from "@stacks/network";
import type { AddressBalanceResponse, AddressNonces, MempoolTransaction, MempoolTransactionListResponse, Transaction, TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";

const TIMEOUT = 10000;
const MAX_RETRIES = 5;
const INITIAL_DELAY = 5000;
const HIRO_API_KEY = process?.env?.HIRO_API_KEY;

const WINDOW_MS = 20_000;
const REQUEST_THRESHOLD = 10;
const requestTimestamps: number[] = [];

export function shouldUseHiroApiKey(): boolean {
    const now = Date.now();

    const recent = requestTimestamps.filter(ts => now - ts <= WINDOW_MS);
    requestTimestamps.length = 0;
    requestTimestamps.push(...recent);

    requestTimestamps.push(now);

    if (requestTimestamps.length > 1000) {
        requestTimestamps.splice(0, requestTimestamps.length - 1000);
    }

    return requestTimestamps.length >= REQUEST_THRESHOLD;
}

export const fetchFn = async (
    input: string | URL,
    init?: RequestInit,
): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const useApiKey = shouldUseHiroApiKey();

        const _init = useApiKey && HIRO_API_KEY ? {
            ...init,
            headers: {
                ...init?.headers,
                'X-API-Key': HIRO_API_KEY
            }
        } : init;

        try {
            const r = await fetch(input, {
                ..._init,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if ([200, 404, 400].includes(r.status)) {

                // Validate response content-type
                const contentType = r.headers.get('content-type') || '';
                if (contentType.indexOf('application/json') === -1) {
                    throw new Error(`Invalid content-type: ${contentType}`);
                }

                // Ensure the response body is valid JSON by attempting to parse it.
                // We do this because Hiro API occasionally returns an HTML error page
                // while still setting the `Content-Type: application/json` header.
                const text = await r.text();
                JSON.parse(text);

                return new Response(text, {
                    status: r.status,
                    statusText: r.statusText,
                    headers: r.headers
                });
            }

            lastError = new Error(`HTTP ${r.status}: ${await r.text()}`);

            // Only retry if we haven't reached max attempts
            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Hiro api error: ${lastError}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            lastError = error as Error;

            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Hiro api error: ${lastError}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Request failed after max retries');
}

export const fetchGetWrapper = async (path: string, network: StacksNetworkName) => {
    const networkObj = networkFromName(network);
    const url = `${networkObj.client.baseUrl}${path}`;
    return fetchFn(url);
}

export const getContractInfo = async (contractId: string, network: StacksNetworkName) => {
    return fetchGetWrapper(`/extended/v1/contract/${contractId}`, network).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: StacksNetworkName): Promise<TransactionEventsResponse> => {
    return fetchGetWrapper(`/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`, network).then(r => r.json())
}

export const getAccountBalances = async (principal: string, network: StacksNetworkName): Promise<AddressBalanceResponse> => {
    return fetchGetWrapper(`/extended/v1/address/${principal}/balances`, network).then(r => r.json())
}

export const getAccountNonces = async (principal: string, network: StacksNetworkName): Promise<AddressNonces> => {
    return fetchGetWrapper(`/extended/v1/address/${principal}/nonces`, network).then(r => r.json());
}

export const getTransaction = async (txId: string, network: StacksNetworkName): Promise<Transaction | MempoolTransaction> => {
    return fetchGetWrapper(`/extended/v1/tx/${txId}`, network).then(r => r.json());
}

export const getMempoolTransactions = async (limit: number, network: StacksNetworkName): Promise<MempoolTransactionListResponse> => {
    return fetchGetWrapper(`/extended/v1/tx/mempool?limit=${limit}`, network).then(r => r.json());
}