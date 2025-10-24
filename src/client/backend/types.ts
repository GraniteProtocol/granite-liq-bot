interface Cap {
  cap_factor: number;
  current_bucket: number;
  max_bucket: number;
}

export interface MarketInfoResponse {
  withdrawal_caps: {
    lp: Cap;
    debt: Cap;
    collateral: Cap;
  };
  collaterals: {
    display_name: string;
    id: string;
    image: string;
    decimals: number;
    max_ltv: number;
    liquidation_ltv: number;
    liquidation_premium: number;
    balance: number;
  }[];
  open_interest: number;
  reserve_balance: number;
  total_assets: number;
  total_debt_shares: number;
  total_lp_shares: number;
  borrowable_balance: number;
  asset_cap: number;
  protocol_reserve_percentage: number;
  market_token_balance: number;
  onchain_interest_params: {
    last_accrued_block_time: number;
    open_interest: number;
    total_assets: number;
  };
  staking_info: {
    total_staked_tokens: number;
    total_staked_lp_tokens: number;
    total_staked_active_lp_tokens: number;
  };
}

interface UserInfoBase {
  user: string;
  collateral_balances: Record<string, number>;
  debt_shares: number;
  lp_shares: number;
  staked_lp_shares: number;
  account_health: number;
}

export type UserInfoResponse = UserInfoBase;

export interface LiquidationPosition extends UserInfoBase {
  liquidable_amount: number;
  current_debt: number;
}

export interface LiquidationsResponse {
  total: number;
  limit: number;
  data: LiquidationPosition[];
}