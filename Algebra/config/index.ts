import { config as berachainConfig } from './berachain'
import { config as ethereumConfig } from './ethereum'
import { config as bscConfig } from './bsc'
import { config as monadTestnetConfig } from './monad-test'

export const configs = {
  'berachain-mainnet': berachainConfig,
  mainnet: ethereumConfig,
  bsc: bscConfig,
  'monad-testnet': monadTestnetConfig
} as const

export type Chain = keyof typeof configs
