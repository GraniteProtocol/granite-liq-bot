declare const StacksNetworks: readonly [
  'mainnet',
];
type StacksNetworkName = (typeof StacksNetworks)[number];

export enum GRANITE_MARKETS {
  MAINNET = 'MAINNET',
  MAINNET_STAGING = 'MAINNET_STAGING',
}

export interface Chain {
  id: GRANITE_MARKETS;
  name: string;
  network: StacksNetworkName;
}

export interface Contract {
  id: string;
  name: string;
  principal: string;
}

export interface Token {
  display_name: string;
  contract: Contract;
  decimals: number;
  display_decimals: number;
  image: string;
  price_feed?: string;
  asset_cap?: number;
  dust_threshold?: number;
}

export interface CollateralToken extends Token {
  liquidationLTV: number;
  liquidationPremium: number;
  maxLTV: number;
}

export enum GraniteContracts {
  INTEREST_RATE = 'INTEREST_RATE',
  PYTH_STORAGE = 'PYTH_STORAGE',
}

export interface Market {
  chain_id: GRANITE_MARKETS;
  market_asset: Token;
  collaterals: CollateralToken[];
  contracts: Record<GraniteContracts, Contract>;
  scaling_factor: number;
}

export interface Config {
  markets: Record<GRANITE_MARKETS, Market>;
}
