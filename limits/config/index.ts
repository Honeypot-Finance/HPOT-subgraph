import { config as ethereumConfig } from './ethereum';

export const configs = {
  'mainnet': ethereumConfig,
} as const;

export type Chain = keyof typeof configs; 