import { config as berachainConfig } from "./berachain";

export const configs = {
  berachain: berachainConfig,
} as const;

export type ChainName = keyof typeof configs;
