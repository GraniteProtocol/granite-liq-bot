import { AEUSDC, SBTC } from './constants';
import { GRANITE_MARKETS, type Market } from './types';

const market: Record<GRANITE_MARKETS, Market> = {
  MAINNET: {
    chain_id: GRANITE_MARKETS.MAINNET,
    market_asset: {
      display_name: 'aeUSDC',
      contract: AEUSDC,
      decimals: 6,
      display_decimals: 4,
      image:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      price_feed:
        'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
      asset_cap: 15000000,
      dust_threshold: 0.01,
    },
    collaterals: [
      {
        display_name: 'sBTC',
        maxLTV: 0.5,
        liquidationLTV: 0.65,
        liquidationPremium: 0.1,
        contract: SBTC,
        decimals: 8,
        display_decimals: 5,
        image:
          'https://teal-worldwide-cattle-228.mypinata.cloud/ipfs/bafkreigsh7sxsgbxfgx7mfvepqhtdkuec6nmzgwjscx5w3rg6ikoungz3q',
        price_feed:
          'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      },
    ],
    contracts: {
      INTEREST_RATE: {
        id: 'linear-kinked-ir-v1',
        name: 'linear-kinked-ir-v1',
        principal: 'SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA',
      },
      PYTH_STORAGE: {
        id: 'pyth-storage-v4',
        name: 'pyth-storage-v4',
        principal: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y',
      },
    },
    scaling_factor: 1000000000000,
  },

  MAINNET_STAGING: {
    chain_id: GRANITE_MARKETS.MAINNET_STAGING,
    market_asset: {
      display_name: 'aeUSDC',
      contract: AEUSDC,
      decimals: 6,
      display_decimals: 4,
      image:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      price_feed:
        'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
      asset_cap: 100000000000000,
      dust_threshold: 0.01,
    },
    collaterals: [
      {
        display_name: 'sBTC',
        maxLTV: 0.45,
        liquidationLTV: 0.45000001,
        liquidationPremium: 0.1,
        contract: SBTC,
        decimals: 8,
        display_decimals: 5,
        image:
          'https://teal-worldwide-cattle-228.mypinata.cloud/ipfs/bafkreigsh7sxsgbxfgx7mfvepqhtdkuec6nmzgwjscx5w3rg6ikoungz3q',
        price_feed:
          'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      },
    ],
    contracts: {
      INTEREST_RATE: {
        id: 'linear-kinked-ir-v1',
        name: 'linear-kinked-ir-v1',
        principal: 'SP3Y6GFKWN50HPA8RKRXMY0EXAJR9VXPY899P88JN',
      },
      PYTH_STORAGE: {
        id: 'pyth-storage-v4',
        name: 'pyth-storage-v4',
        principal: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y',
      },
    },
    scaling_factor: 1000000000000,
  },
};

export default market;
