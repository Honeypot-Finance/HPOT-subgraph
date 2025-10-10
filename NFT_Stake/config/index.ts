import { config as berachain } from "./berachain";
import { config as ethereum } from "./ethereum";
import { config as bsc } from "./bsc";
import { config as berachainBepolia } from "./berachain-bepolia";

export const configs = {
  berachain,
  ethereum,
  bsc,
  berachainBepolia,
} as const;

export type ChainConfig = typeof berachain;
