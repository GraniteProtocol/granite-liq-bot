## Endpoints

### /contracts [GET] 

Returns [ContractEntity](#ContractEntity) list

### /add-contract [POST]

Content-Type: application/json

Post Params: 
- address: Full address of the contract (e.g: SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator)
- mnemonic: mnemonic of the operator (e.g: 'oval express iron distance ...')

Returns: [ContractEntity](#ContractEntity) list

Example: 
```bash
curl --header "Content-Type: application/json" \
--request POST \
--data '{"address":"SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator","mnemonic":"oval express iron distance ..."}' \
http://localhost:8081/add-contract  
```

### /borrowers [GET]

Returns: [BorrowerStatusEntity](#BorrowerStatusEntity) list

### /health [GET]

Returns: [Health](#Health)

### /liquidations [GET]

SearchParams: 
- fromTimestamp: unix timestamp in seconds
- toTimestamp: unix timestamp in seconds
- limit: Maximum number of results to return. Valid range: 1–100.

Returns: [LiquidationEntity](#LiquidationEntity) list


### /liquidation-point-map [GET]

Returns: [LiquidationPoint](#LiquidationPoint) list

### /config [GET]

Returns: [Config](#Config)


## Objects

### AssetInfoWithBalance
```ts
{
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    balance: number,
}
```

### ContractEntity

```ts
{
    id: string,
    address: string,
    name: string,
    operatorAddress: string,
    operatorBalance: number,
    marketAsset: AssetInfoWithBalance | null,
    collateralAsset: AssetInfoWithBalance | null,
    unprofitabilityThreshold: number,
    flashLoanSc: {
        address: string,
        name: string
    },
    lockTx: string | null
    unlocksAt: number | null,
}
```

### LiquidationEntity

```ts
{
    txid: string,
    contract: string,
    status: string,
    createdAt: number,
    updatedAt: number | null,
}
```


### BorrowerStatusEntity

```ts
{
    address: string,
    ltv: number,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    maxRepay: Record<string, number>,
    totalRepayAmount: number,
}
```

### Health

```ts
{
    now: string, // current server date (ISO)
    lastSync: string | null, // null if the first worker cycle haven't completed yet otherwise last sync date (ISO)
    lastLiquidation: LiquidationEntity | null,
    balances: {
        operatorBalance: number | null,
        marketAssetBalance: number | null,
    },
    isHealthy: boolean
}
```

### LiquidationPoint

```ts
{ 
    liquidationPriceUSD: number, 
    liquidatedAmountUSD: number 
}
```

### Config

```ts
{
  ALERT_BALANCE: number,
  CONTRACTS: {
    borrower: string,
    state: string,
    ir: string,
    liquidator: string,
    collaterals: string[]
  },
  DRY_RUN: boolean,
  HAS_HIRO_API_KEY: boolean,
  IR_PARAMS_SCALING_FACTOR: number,
  MARKET_ASSET_DECIMAL: number,
  MARKET_ASSET: string,
  MIN_TO_LIQUIDATE: number,
  MIN_TO_LIQUIDATE_PER_USER: number,
  PRICE_FEED_IDS: {
      ticker: string,
      feed_id: string
    }[],
  SKIP_SWAP_CHECK: boolean,
  TX_TIMEOUT: 600,
  USE_STAGING: boolean,
  USE_FLASH_LOAN: boolean
}
```