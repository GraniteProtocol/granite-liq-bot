import marketsAeusdc from './markets-aeusdc';

import { type Config } from './types';

const config: Config = {
  markets: (() => {
    const market = process.env.NEXT_PUBLIC_MARKET || 'aeusdc';

    if (market === 'aeusdc') {
      return marketsAeusdc;
    }

    throw new Error('Unknown market');
  })()
} as const;

export default config;
