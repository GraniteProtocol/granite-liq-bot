# Granite Liquidation Bot

To install dependencies:

```bash
bun install
```

To test:

```bash
bun test
```

Run with docker compose:

```bash
docker-compose up --build -d
```


## Environment variables

- `HIRO_API_KEY`: (optional) Hiro API key for stacks api
- `USE_STAGING`: (optional) 1 to use staging contracts on mainnet
- `DRY_RUN`: (optional) 1 to block liquidations
- `MIN_TO_LIQUIDATE`: Minimum usdc amount to run liquidation transactions. Default: 4
- `TX_TIMEOUT`: Liquidation transaction deadline value. As seconds. Default: 600
- `MIN_TO_LIQUIDATE_PER_USER`: Minimum usdc amount to include a position (user) in liquidation batch. Default: 1
- `SKIP_SWAP_CHECK`: (optional) 1 to skip swap output check. Note that transactions might fail
- `SLACK_TOKEN`: Slack oauth token for alerts
- `SLACK_CHANNEL_ID`: Channel id to push slack alert messages
- `USE_FLASH_LOAN`: 1 to use flash loan based liquidations
- `USE_USDH`: 1 to use USDh based liquidations
- `USDH_SLIPPAGE_TOLERANCE`: USDh minting slippage tolerance
- `GRANITE_RPC`: Granite Rpc node to make heavy read only contract calls
- `LIQUIDATON_CAP`: The maximum capital to be used for a single liquidation.
- `ALERT_BALANCE`: The bot starts alerting when operator balance goes under this value. Default: 1

## API

See api [docs](src/api/API.md)
