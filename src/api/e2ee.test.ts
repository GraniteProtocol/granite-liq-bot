import { getAddressFromPrivateKey } from "@stacks/transactions";
import { generateWallet, randomSeedPhrase } from "@stacks/wallet-sdk";
import { describe, expect, mock, setSystemTime, test } from "bun:test";
import { dbCon } from "../db/con";
import { kvStoreSet } from "../db/helper";
import { main as apiMain } from "./index";

const API_BASE = `http://localhost:${process.env.API_PORT}`;

const prepareTestDb = () => {
    const insert = (r: string, table: string) => {
        return `INSERT INTO ${table} VALUES (${r.split('|').map(x => `'${x.trim()}'`).join(',')})`;
    }

    dbCon.run('DELETE FROM kv_store');
    dbCon.run('DELETE FROM contract');
    dbCon.run('DELETE FROM liquidation');

    `
        53bdce5437e1346b44eda525c8d4c98c7faf09abe37b8b85ee40778e9eed36c4|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator|success|1743168820|1743168837|20000|1
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'liquidation'));
    });

    `
        SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA|liquidator|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA|7b62c15db7f5281f67968d567e478a9d2aeca7c68588d792e33f54624ed2e0e501|1998330|{"address":"SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc","name":"Ethereum USDC via Allbridge","symbol":"aeUSDC","decimals":6}|12176373|{"address":"SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token","name":"sBTC","symbol":"sBTC","decimals":8}|0|0|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.flash-loan-v1|9975|||1743168773
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'contract'));
    });

    `
        db_ver|1
        ir-params|{"baseIR":3000000000000,"slope1":50000000000,"slope2":750000000000,"urKink":800000000000}
        lp-params|{"totalAssets":109878238,"totalShares":99841424}
        accrue-interest-params|{"lastAccruedBlockTime":1743168818}
        debt-params|{"openInterest":34532335,"totalDebtShares":25237966}
        collateral-params|{"SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token":{"liquidationLTV":45000001,"maxLTV":45000000,"liquidationPremium":10000000}}
        flash-loan-capacity|{ "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc": 0 }
        on-chain-price-feed|{ "btc": { "price": "11470000751501", "expo": -8, "publish_time": 1754045925 }}
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'kv_store'));
    });
}

setSystemTime(1743515825000);

const MNEMONIC = randomSeedPhrase();
const wallet = await generateWallet({ secretKey: MNEMONIC, password: "", });
const ADDRESS = getAddressFromPrivateKey(wallet.accounts[0].stxPrivateKey, 'mainnet');


describe("api e2e", () => {

    mock.module("../client/hiro", () => {
        return {
            getContractInfo: () => {
                return {

                }
            }
        }
    });

    mock.module("../client/read-only-call", () => {
        return {
            getLiquidatorContractInfo: () => {
                return {
                    operator: ADDRESS,
                    marketAsset: '',
                    collateralAsset: '',
                    unprofitabilityThreshold: 0,
                    flashLoanSc: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.flash-loan-v1",
                    usdhThreshold: 9997
                }
            },
            getAssetInfo: () => {
                return {
                    address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
                    name: 'sBTC',
                    symbol: 'sBTC',
                    decimals: 8
                }
            }
        }
    });

    test("start api", async () => {
        await apiMain();
    });

    test("prepareTestDb", () => {
        prepareTestDb();
    })

    test("/health (not healthy - last sync)", async () => {
        kvStoreSet("last-sync", Date.now() - 121_000);
        const resp = await fetch(`${API_BASE}/health`).then(r => r.json());
        expect(resp.lastSync).toEqual("2025-04-01T13:55:04.000Z");
        expect(resp.isHealthy).toEqual(false);
    })

    test("/health", async () => {
        kvStoreSet("last-sync", Date.now() - 1000);
        const resp = await fetch(`${API_BASE}/health`).then(r => r.json());
        expect(resp).toEqual({
            now: "2025-04-01T13:57:05.000Z",
            lastSync: "2025-04-01T13:57:04.000Z",
            lastLiquidation: {
                txid: "53bdce5437e1346b44eda525c8d4c98c7faf09abe37b8b85ee40778e9eed36c4",
                contract: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator",
                status: "success",
                createdAt: 1743168820,
                updatedAt: 1743168837,
                fee: 20000,
                nonce: 1
            },
            balances: {
                operatorBalance: 1998330,
                marketAssetBalance: 12176373,
            },
            isHealthy: true,
        });
    })

    test("/contracts", async () => {
        const resp = await fetch(`${API_BASE}/contracts`).then(r => r.json());

        expect(resp).toEqual([
            {
                id: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator",
                address: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA",
                name: "liquidator",
                operatorAddress: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA",
                operatorBalance: 1998330,
                marketAsset: {
                    address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                    name: "Ethereum USDC via Allbridge",
                    symbol: "aeUSDC",
                    decimals: 6,
                    balance: 12176373,
                },
                collateralAsset: {
                    address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                    name: "sBTC",
                    symbol: "sBTC",
                    decimals: 8,
                    balance: 0,
                },
                lockTx: "",
                unlocksAt: null,
                unprofitabilityThreshold: 0,
                flashLoanSc: {
                    address: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA",
                    name: "flash-loan-v1"
                },
                usdhThreshold: 9975,
            }
        ]);
    })

    test("/liquidations", async () => {
        const resp = await fetch(`${API_BASE}/liquidations`).then(r => r.json());

        expect(resp).toEqual([
            {
                txid: "53bdce5437e1346b44eda525c8d4c98c7faf09abe37b8b85ee40778e9eed36c4",
                contract: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator",
                status: "success",
                createdAt: 1743168820,
                updatedAt: 1743168837,
                fee: 20000,
                nonce: 1
            }
        ]);
    })

    test("/liquidations wtih timestamp filter", async () => {
        const resp = await fetch(`${API_BASE}/liquidations?fromTimestamp=1743168810&toTimestamp=1743168831`).then(r => r.json());

        expect(resp).toEqual([
            {
                txid: "53bdce5437e1346b44eda525c8d4c98c7faf09abe37b8b85ee40778e9eed36c4",
                contract: "SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator",
                status: "success",
                createdAt: 1743168820,
                updatedAt: 1743168837,
                fee: 20000,
                nonce: 1
            }
        ]);
    })

    test("/liquidations wtih timestamp filter (empty)", async () => {
        const resp = await fetch(`${API_BASE}/liquidations?fromTimestamp=1743168840&toTimestamp=1743168850`).then(r => r.json());

        expect(resp).toEqual([]);
    })

    test("/config", async () => {
        const resp = await fetch(`${API_BASE}/config`).then(r => r.json());
        expect(resp).toEqual({
            ALERT_BALANCE: 1,
            CONTRACT_UNLOCK_DELAY: 60,
            DRY_RUN: false,
            ENV: "test",
            GRANITE_RPC: "https://my.rpc.com",
            HAS_HIRO_API_KEY: true,
            IR_PARAMS_SCALING_FACTOR: 12,
            LIQUIDATON_CAP: 500000,
            LIQUIDATON_POS_COUNT_MAX: 20,
            LIQUIDATON_POS_COUNT_MIN: 3,
            MARKET_ASSET_DECIMAL: 6,
            MARKET_ASSET: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
            MIN_TO_LIQUIDATE: 4,
            MIN_TO_LIQUIDATE_PER_USER: 1,
            PRICE_FEED_FRESHNESS_BUFFER: 60,
            PRICE_FEED_FRESHNESS_THRESHOLD: 300,
            PRICE_FEED_IDS: [
                {
                    ticker: "btc",
                    feed_id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
                },
                {
                    ticker: "usdc",
                    feed_id: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                }
            ],
            RBF_THRESHOLD: 15,
            SKIP_SWAP_CHECK: false,
            SWAP_THRESHOLD: 4,
            TX_TIMEOUT: 600,
            USDH_RESERVE_CONTRACT: "SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.redeeming-reserve-v1-1",
            USDH_SLIPPAGE_TOLERANCE: 500,
            USE_STAGING: false,
            USE_FLASH_LOAN: false,
            USE_USDH: false
        })
    });

    test("/add-contract", async () => {
        dbCon.run('DELETE FROM contract');

        const resp = await fetch(`${API_BASE}/add-contract`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ address: `${ADDRESS}.liquidator`, mnemonic: MNEMONIC })
        });

        expect(resp.status).toEqual(200);
    })

    test("/add-contract (A contract is already exists)", async () => {
        const resp = await fetch(`${API_BASE}/add-contract`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ address: `${ADDRESS}.liquidator`, mnemonic: MNEMONIC })
        });

        expect(resp.status).toEqual(400);
        expect(await resp.json()).toEqual({
            error: "A contract is already exists",
        });
    });

    test("/health (not healthy - low balance)", async () => {
        const resp = await fetch(`${API_BASE}/health`).then(r => r.json());
        expect(resp.isHealthy).toEqual(false);
        expect(resp.balances.operatorBalance).toEqual(0);
    });
});