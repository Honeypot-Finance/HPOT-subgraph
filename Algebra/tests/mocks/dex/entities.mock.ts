import { Account, Bundle, Factory, Pool, Token } from '../../../src/types/schema'
import { Swap } from '../../../src/types/templates/Pool/Pool'
import { FACTORY_ADDRESS, ONE_BI } from '../../../src/utils/constants'
import { ZERO_BD } from '../../../src/utils/constants'
import { ADDRESS_ZERO } from '../../../src/utils/constants'
import { ZERO_BI } from '../../../src/utils/constants'
import { loadDefaultPool, loadFactory } from '../../../src/mappings/factory'
import { loadToken } from '../../../src/utils/token'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Plugin } from '../../../src/types/schema'

import { newMockEvent } from 'matchstick-as/assembly/defaults'
import { Burn, Mint } from '../../../src/types/Factory/Pool'

let CREATION_COUNT = 0

export function createDexFactoryEntity(): Factory {
  return loadFactory()
}

//make createMockBurnEvent and createMockMintEvent for me

export function createMockSwapEvent(poolAddress: string): Swap {
  let mockEvent = newMockEvent()

  let mockSwapEvent = new Swap(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  )

  mockSwapEvent.address = Address.fromString(poolAddress)

  return mockSwapEvent
}

export function createMockTokenEntity(tokenAddress: string): Token {
  const token = new Token(tokenAddress)

  let mockTokenId = tokenAddress
  let mockTokenName = 'Test' + CREATION_COUNT.toString()
  let mockTokenSymbol = 'TEST' + CREATION_COUNT.toString()
  let mockTokenDecimals = BigInt.fromI32(18)
  let mockTokenTotalSupply = BigInt.fromI32(1000000)
  let mockTokenDerivedUSD = ZERO_BD
  let mockTokenVolume = ZERO_BD
  let mockTokenVolumeUSD = ZERO_BD
  let mockTokenFeesUSD = ZERO_BD
  let mockTokenUntrackedVolumeUSD = ZERO_BD
  let mockTokenTotalValueLocked = ZERO_BD
  let mockTokenTotalValueLockedUSD = ZERO_BD
  let mockTokenTotalValueLockedUSDUntracked = ZERO_BD
  let mockTokenTxCount = ZERO_BI
  let mockTokenPoolCount = ZERO_BI
  let mockTokenHolderCount = BigInt.fromI32(0)
  let mockTokenMarketCap = ZERO_BD
  let mockTokenInitialUSD = ZERO_BD
  let mockTokenPriceChange24h = ZERO_BD
  let mockTokenPriceChange24hPercentage = ZERO_BD
  let mockTokenLiquidityUSD = ZERO_BD

  token.id = mockTokenId
  token.symbol = mockTokenSymbol
  token.name = mockTokenName
  token.decimals = mockTokenDecimals
  token.totalSupply = mockTokenTotalSupply
  token.derivedMatic = mockTokenDerivedUSD
  token.volume = mockTokenVolume
  token.volumeUSD = mockTokenVolumeUSD
  token.feesUSD = mockTokenFeesUSD
  token.untrackedVolumeUSD = mockTokenUntrackedVolumeUSD
  token.totalValueLocked = mockTokenTotalValueLocked
  token.totalValueLockedUSD = mockTokenTotalValueLockedUSD
  token.totalValueLockedUSDUntracked = mockTokenTotalValueLockedUSDUntracked
  token.txCount = mockTokenTxCount
  token.poolCount = mockTokenPoolCount
  token.whitelistPools = []
  token.holderCount = mockTokenHolderCount
  token.marketCap = mockTokenMarketCap
  token.derivedUSD = mockTokenDerivedUSD
  token.initialUSD = mockTokenInitialUSD // initial price in USD only for pot2pump tokens
  token.priceChange24h = mockTokenPriceChange24h
  token.priceChange24hPercentage = mockTokenPriceChange24hPercentage
  token.liquidityUSD = mockTokenLiquidityUSD

  token.save()

  CREATION_COUNT++

  return token
}

export function createMockPoolEntity(
  poolAddress: string,
  token0: Token = createMockTokenEntity('0x0000000000000000000000000000000000000001'),
  token1: Token = createMockTokenEntity('0x0000000000000000000000000000000000000002')
): Pool {
  const pool = loadDefaultPool(poolAddress)

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.createdAtTimestamp = ZERO_BI
  pool.createdAtBlockNumber = ZERO_BI
  pool.communityFee = ZERO_BI
  pool.searchString = pool.id.toLowerCase() + ' ' + token0.symbol.toLowerCase() + ' ' + token1.symbol.toLowerCase()

  CREATION_COUNT++

  return pool
}

export function createMockAccount(address: Address): Account {
  let factory = loadFactory()
  const newAcc = new Account(address.toHexString())

  newAcc.id = address.toHexString()
  newAcc.memeTokenHoldingCount = ZERO_BI
  newAcc.pot2PumpLaunchCount = ZERO_BI
  newAcc.platformTxCount = ZERO_BI
  newAcc.participateCount = ZERO_BI
  newAcc.swapCount = ZERO_BI
  newAcc.holdingPoolCount = ZERO_BI
  newAcc.totalSpendUSD = ZERO_BD

  factory.accountCount = factory.accountCount.plus(ONE_BI)

  newAcc.save()
  factory.save()
  return newAcc
}

export function createMockPluginEntity(address: string, poolAddress: string): Plugin {
  const plugin = new Plugin(address)

  plugin.id = address
  plugin.pool = poolAddress
  plugin.collectedFeesToken0 = ZERO_BD
  plugin.collectedFeesToken1 = ZERO_BD
  plugin.collectedFeesUSD = ZERO_BD
  plugin.save()
  return plugin
}

export function createMockBundleEntity(): Bundle {
  const bundle = new Bundle('1')
  bundle.id = '1'
  bundle.maticPriceUSD = ZERO_BD
  bundle.save()
  return bundle
}

export function createMockBurnEvent(poolAddress: string): Burn {
  let mockEvent = newMockEvent()

  let mockBurnEvent = new Burn(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  )

  return mockBurnEvent
}

export function createMockMintEvent(poolAddress: string): Mint {
  let mockEvent = newMockEvent()

  let mockMintEvent = new Mint(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  )

  return mockMintEvent
}
