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
    dbCon.run('DELETE FROM borrower');
    dbCon.run('DELETE FROM borrower_position');
    dbCon.run('DELETE FROM borrower_collaterals');
    dbCon.run('DELETE FROM borrower_status');
    dbCon.run('DELETE FROM liquidation');

    `
        SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7|0|0
        SP1GJSC4GG3MDA1KYZJYS9FEVCKHASR1N7089BEQK|0|0
        SP1RG3YP9C8SC82GVHT1E1WG22MYHTCJ4FT3T9R4G|0|0
        SP3666C2NYH5HVDZ8X323EQ327D6WNCZEVX4G3QCZ|0|0
        SP2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE5VYT9SJ|0|0
        SP2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX50CQQAWN|0|0
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'borrower'));
    });

    `
        SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7|0.2783|1.6167|11.9128|42.7993|0.6185|{}|0.0
        SP1RG3YP9C8SC82GVHT1E1WG22MYHTCJ4FT3T9R4G|0.4487|1.0029|15.678|34.9399|0.9971|{}|0.0
        SP2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE5VYT9SJ|0.4467|1.0074|6.9424|15.541|0.9927|{}|0.0
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'borrower_status'));
    });

    `
        53bdce5437e1346b44eda525c8d4c98c7faf09abe37b8b85ee40778e9eed36c4|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator|success|1743168820|1743168837|200|1
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'liquidation'));
    });

    `
        SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7|SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token|50100.0
        SP3666C2NYH5HVDZ8X323EQ327D6WNCZEVX4G3QCZ|SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token|20200.0
        SP1RG3YP9C8SC82GVHT1E1WG22MYHTCJ4FT3T9R4G|SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token|40900.0
        SP2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE5VYT9SJ|SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token|18192.0
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'borrower_collaterals'));
    });

    `
        SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA|liquidator|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA|7b62c15db7f5281f67968d567e478a9d2aeca7c68588d792e33f54624ed2e0e501|1998330|{"address":"SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc","name":"Ethereum USDC via Allbridge","symbol":"aeUSDC","decimals":6}|12176373|{"address":"SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token","name":"sBTC","symbol":"sBTC","decimals":8}|0|0|SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.flash-loan-v1|9975|||1743168773
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'contract'));
    });

    `
        SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7|8706247.0|["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"]
        SP1GJSC4GG3MDA1KYZJYS9FEVCKHASR1N7089BEQK|0.0|[]
        SP3666C2NYH5HVDZ8X323EQ327D6WNCZEVX4G3QCZ|0.0|["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"]
        SP2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX50CQQAWN|0.0|[]
        SP1RG3YP9C8SC82GVHT1E1WG22MYHTCJ4FT3T9R4G|11457996.0|["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"]
        SP2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE5VYT9SJ|5073723.0|["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"]
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'borrower_position'));
    });

    `
        db_ver|1
        contract_hash|15264183702619828235
        borrower-sync-last-tx-seen-SP1M6MHD4EJ70MPJSH1C0PXSHCQ3D9C881AB7CVAZ.borrower-v1|0x4f448430b516abb89b2aaada632f0792c48ed20319b8db68a25ba3cfb6fd3332
        borrower-sync-last-tx-seen-SP1M6MHD4EJ70MPJSH1C0PXSHCQ3D9C881AB7CVAZ.state-v1|0xe1ba5faed33581769533a656ca6b0cf562da691d4d45523072e6ba697e5d1e96
        borrower-sync-last-tx-seen-SP36P9SC1CKW9YN2DM0FC78Q6060BRGDWPQM96HR1.liquidator-v1|0x444e6b900061a14347b8dce48b191726f18f7f4ba9afada40f97bc3780da4c5c
        ir-params|{"baseIR":3000000000000,"slope1":50000000000,"slope2":750000000000,"urKink":800000000000}
        lp-params|{"totalAssets":109878238,"totalShares":99841424}
        accrue-interest-params|{"lastAccruedBlockTime":1743168818}
        debt-params|{"openInterest":34532335,"totalDebtShares":25237966}
        collateral-params|{"SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token":{"liquidationLTV":45000001,"maxLTV":45000000,"liquidationPremium":10000000}}
        last-sync|1743169049661
        `.split("\n").map(x => x.trim()).filter(x => x).forEach(r => {
        dbCon.run(insert(r, 'kv_store'));
    });
}

setSystemTime(1743515825000);

const MNEMONIC = randomSeedPhrase();
const wallet = await generateWallet({ secretKey: MNEMONIC, password: "", });
const ADDRESS = getAddressFromPrivateKey(wallet.accounts[0].stxPrivateKey, 'mainnet');

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


describe("api e2e", () => {
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

    test("/borrowers", async () => {
        const resp = await fetch(`${API_BASE}/borrowers`).then(r => r.json());

        expect(resp).toEqual([
            {
                address: "SP1RG3YP9C8SC82GVHT1E1WG22MYHTCJ4FT3T9R4G",
                ltv: 0.4487,
                health: 1.0029,
                debt: 15.678,
                collateral: 34.9399,
                risk: 0.9971,
                maxRepay: {},
                totalRepayAmount: 0,
            }, {
                address: "SP2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE5VYT9SJ",
                ltv: 0.4467,
                health: 1.0074,
                debt: 6.9424,
                collateral: 15.541,
                risk: 0.9927,
                maxRepay: {},
                totalRepayAmount: 0,
            }, {
                address: "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7",
                ltv: 0.2783,
                health: 1.6167,
                debt: 11.9128,
                collateral: 42.7993,
                risk: 0.6185,
                maxRepay: {},
                totalRepayAmount: 0,
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
            BORROWER_SYNC_DELAY: 10,
            CONTRACTS: {
                borrower: "SP26NGV9AFZBX7XBDBS2C7EC7FCPSAV9PKREQNMVS.borrower-v1",
                state: "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.state-v1",
                ir: "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.linear-kinked-ir-v1",
                liquidator: "SP26NGV9AFZBX7XBDBS2C7EC7FCPSAV9PKREQNMVS.liquidator-v1",
                collaterals: ["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"],
            },
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
            SKIP_SWAP_CHECK: false,
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