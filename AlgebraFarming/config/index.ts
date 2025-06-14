import { config as berachainConfig } from './berachain';
import { config as ethereumConfig } from './ethereum';

export const configs = {
  'berachain-mainnet': berachainConfig,
  'mainnet': ethereumConfig,
  'berachain-bepolia': berachainConfig,
} as const;

export type Chain = keyof typeof configs; 