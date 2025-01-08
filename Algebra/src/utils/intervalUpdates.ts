import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  AlgebraDayData,
  Factory,
  Pool,
  PoolDayData,
  Token,
  TokenDayData,
  TokenHourData,
  Bundle,
  PoolHourData,
  TickDayData,
  FeeHourData,
  Tick,
  PoolWeekData,
  PoolMonthData,
  Pot2Pump
} from './../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { ethereum, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { LoadPoolDayData, LoadPoolHourData, LoadPoolMonthData, LoadPoolWeekData } from './liquidityPools'
import { fetchTokenPot2PumpAddress } from './token'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateAlgebraDayData(event: ethereum.Event): AlgebraDayData {
  let algebra = Factory.load(FACTORY_ADDRESS)!
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded
  let dayStartTimestamp = dayID * 86400
  let algebraDayData = AlgebraDayData.load(dayID.toString())
  if (algebraDayData === null) {
    algebraDayData = new AlgebraDayData(dayID.toString())
    algebraDayData.date = dayStartTimestamp
    algebraDayData.volumeMatic = ZERO_BD
    algebraDayData.volumeUSD = ZERO_BD
    algebraDayData.volumeUSDUntracked = ZERO_BD
    algebraDayData.feesUSD = ZERO_BD
  }
  algebraDayData.tvlUSD = algebra.totalValueLockedUSD
  algebraDayData.txCount = algebra.txCount
  algebraDayData.save()
  return algebraDayData as AlgebraDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  let pool = Pool.load(event.address.toHexString())!
  let poolDayData = LoadPoolDayData(pool, event)

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  poolDayData.save()

  return poolDayData as PoolDayData
}

export function updatePoolWeekData(event: ethereum.Event): PoolWeekData {
  let pool = Pool.load(event.address.toHexString())!
  let poolWeekData = LoadPoolWeekData(pool, event)

  if (pool.token0Price.gt(poolWeekData.high)) {
    poolWeekData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolWeekData.low)) {
    poolWeekData.low = pool.token0Price
  }

  poolWeekData.liquidity = pool.liquidity
  poolWeekData.sqrtPrice = pool.sqrtPrice
  poolWeekData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolWeekData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolWeekData.token0Price = pool.token0Price
  poolWeekData.token1Price = pool.token1Price
  poolWeekData.tick = pool.tick
  poolWeekData.tvlUSD = pool.totalValueLockedUSD
  poolWeekData.txCount = poolWeekData.txCount.plus(ONE_BI)

  poolWeekData.save()

  return poolWeekData
}

export function updatePoolMonthData(event: ethereum.Event): PoolMonthData {
  let pool = Pool.load(event.address.toHexString())!
  let poolMonthData = LoadPoolMonthData(pool, event)

  if (pool.token0Price.gt(poolMonthData.high)) {
    poolMonthData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolMonthData.low)) {
    poolMonthData.low = pool.token0Price
  }

  poolMonthData.liquidity = pool.liquidity
  poolMonthData.sqrtPrice = pool.sqrtPrice
  poolMonthData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolMonthData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolMonthData.token0Price = pool.token0Price
  poolMonthData.token1Price = pool.token1Price
  poolMonthData.tick = pool.tick
  poolMonthData.tvlUSD = pool.totalValueLockedUSD
  poolMonthData.txCount = poolMonthData.txCount.plus(ONE_BI)
  poolMonthData.save()

  return poolMonthData
}

export function updateFeeHourData(event: ethereum.Event, Fee: BigInt): void {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600
  let hourStartUnix = hourIndex * 3600
  let hourFeeID = event.address
    .toHexString()
    .concat('-')
    .concat(hourIndex.toString())
  let FeeHourDataEntity = FeeHourData.load(hourFeeID)
  if (FeeHourDataEntity) {
    FeeHourDataEntity.timestamp = BigInt.fromI32(hourStartUnix)
    FeeHourDataEntity.fee = FeeHourDataEntity.fee.plus(Fee)
    FeeHourDataEntity.changesCount = FeeHourDataEntity.changesCount.plus(ONE_BI)
    if (FeeHourDataEntity.maxFee < Fee) FeeHourDataEntity.maxFee = Fee
    if (FeeHourDataEntity.minFee > Fee) FeeHourDataEntity.minFee = Fee
    FeeHourDataEntity.endFee = Fee
  } else {
    FeeHourDataEntity = new FeeHourData(hourFeeID)
    FeeHourDataEntity.timestamp = BigInt.fromI32(hourStartUnix)
    FeeHourDataEntity.fee = Fee
    FeeHourDataEntity.changesCount = ONE_BI
    FeeHourDataEntity.pool = event.address.toHexString()
    if (Fee != ZERO_BI) {
      FeeHourDataEntity.startFee = Fee
      FeeHourDataEntity.endFee = Fee
      FeeHourDataEntity.maxFee = Fee
      FeeHourDataEntity.minFee = Fee
    }
  }
  FeeHourDataEntity.save()
}

export function updatePoolHourData(event: ethereum.Event): PoolHourData {
  let pool = Pool.load(event.address.toHexString())!
  let poolHourData = LoadPoolHourData(pool, event)

  if (pool.token0Price.gt(poolHourData.high)) {
    poolHourData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolHourData.low)) {
    poolHourData.low = pool.token0Price
  }

  poolHourData.liquidity = pool.liquidity
  poolHourData.sqrtPrice = pool.sqrtPrice
  poolHourData.token0Price = pool.token0Price
  poolHourData.token1Price = pool.token1Price
  poolHourData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolHourData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolHourData.close = pool.token0Price
  poolHourData.tick = pool.tick
  poolHourData.tvlUSD = pool.totalValueLockedUSD
  poolHourData.txCount = poolHourData.txCount.plus(ONE_BI)
  poolHourData.save()

  // test
  return poolHourData as PoolHourData
}

export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  let bundle = Bundle.load('1')!
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let lastDayID = dayID - 1
  let lastDayStartTimestamp = lastDayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(dayID.toString())
  let lastTokenDayID = token.id
    .toString()
    .concat('-')
    .concat(lastDayID.toString())
  let tokenDayData = TokenDayData.load(tokenDayID)
  let lastTokenDayData = TokenDayData.load(lastTokenDayID)
  let tokenPrice = token.derivedMatic.times(bundle.maticPriceUSD)
  let pot2pumpAddress = fetchTokenPot2PumpAddress(Address.fromString(token.id))
  let pot2pump = Pot2Pump.load(pot2pumpAddress.toHexString())

  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.feesUSD = ZERO_BD
    tokenDayData.untrackedVolumeUSD = ZERO_BD
    tokenDayData.open = tokenPrice
    tokenDayData.high = tokenPrice
    tokenDayData.low = tokenPrice
    tokenDayData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenDayData.high)) {
    tokenDayData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenDayData.low)) {
    tokenDayData.low = tokenPrice
  }

  tokenDayData.close = tokenPrice
  tokenDayData.priceUSD = token.derivedMatic.times(bundle.maticPriceUSD)
  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD

  if (lastTokenDayData && lastTokenDayData.priceUSD.gt(ZERO_BD)) {
    const priceChange24h = tokenDayData.priceUSD.minus(lastTokenDayData.priceUSD)
    const priceChange24hPercentage = priceChange24h.div(lastTokenDayData.priceUSD).times(BigDecimal.fromString('100'))
    token.priceChange24h = priceChange24h
    token.priceChange24hPercentage = priceChange24hPercentage

    if (pot2pump) {
      pot2pump.LaunchTokenPriceChange24h = priceChange24h
      pot2pump.LaunchTokenPriceChange24hPercentage = priceChange24hPercentage
      pot2pump.save()
    }
  }

  tokenDayData.save()
  token.save()
  if (pot2pump) {
    pot2pump.save()
  }

  return tokenDayData as TokenDayData
}

export function updateTokenHourData(token: Token, event: ethereum.Event): TokenHourData {
  let bundle = Bundle.load('1')!
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let tokenHourID = token.id
    .toString()
    .concat('-')
    .concat(hourIndex.toString())
  let tokenHourData = TokenHourData.load(tokenHourID)
  let tokenPrice = token.derivedMatic.times(bundle.maticPriceUSD)

  if (tokenHourData === null) {
    tokenHourData = new TokenHourData(tokenHourID)
    tokenHourData.periodStartUnix = hourStartUnix
    tokenHourData.token = token.id
    tokenHourData.volume = ZERO_BD
    tokenHourData.volumeUSD = ZERO_BD
    tokenHourData.untrackedVolumeUSD = ZERO_BD
    tokenHourData.feesUSD = ZERO_BD
    tokenHourData.open = tokenPrice
    tokenHourData.high = tokenPrice
    tokenHourData.low = tokenPrice
    tokenHourData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenHourData.high)) {
    tokenHourData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenHourData.low)) {
    tokenHourData.low = tokenPrice
  }

  tokenHourData.close = tokenPrice
  tokenHourData.priceUSD = tokenPrice
  tokenHourData.totalValueLocked = token.totalValueLocked
  tokenHourData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenHourData.save()

  return tokenHourData as TokenHourData
}

export function updateTickDayData(tick: Tick, event: ethereum.Event): TickDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tickDayDataID = tick.id.concat('-').concat(dayID.toString())
  let tickDayData = TickDayData.load(tickDayDataID)
  if (tickDayData === null) {
    tickDayData = new TickDayData(tickDayDataID)
    tickDayData.date = dayStartTimestamp
    tickDayData.pool = tick.pool
    tickDayData.tick = tick.id
  }
  tickDayData.liquidityGross = tick.liquidityGross
  tickDayData.liquidityNet = tick.liquidityNet
  tickDayData.volumeToken0 = tick.volumeToken0
  tickDayData.volumeToken1 = tick.volumeToken0
  tickDayData.volumeUSD = tick.volumeUSD
  tickDayData.feesUSD = tick.feesUSD
  tickDayData.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128
  tickDayData.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128

  tickDayData.save()

  return tickDayData as TickDayData
}
