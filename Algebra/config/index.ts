import { config as berachainConfig } from './berachain'
import { config as ethereumConfig } from './ethereum'
import { config as bscConfig } from './bsc'

export const configs = {
  'berachain-mainnet': berachainConfig,
  mainnet: ethereumConfig,
  bsc: bscConfig
} as const

export type Chain = keyof typeof configs
