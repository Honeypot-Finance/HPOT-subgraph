/* eslint-disable prefer-const */
import { Address, ethereum } from '@graphprotocol/graph-ts'
import { Pool, PoolDayData, PoolHourData, PoolMonthData, PoolWeekData } from '../types/schema'
import { Pool as PoolContract } from '../types/templates/Pool/Pool'
import { BigInt } from '@graphprotocol/graph-ts'
import { ZERO_BD } from './constants'
import { ZERO_BI } from './constants'

// import { isNullEthValue } from '.'
// import { Pot2PumpFactory } from '../types/Factory/Pot2PumpFactory'
// import { POT2PUMP_FACTORY_ADDRESS, ZERO_BD, ZERO_BI } from './constants'
// import { Token } from '../types/schema'

// export function fetchTokenPot2PumpAddress(tokenAddress: Address): Address {
//   const pot2PumpContract = Pot2PumpFactory.bind(Address.fromString(POT2PUMP_FACTORY_ADDRESS))
//   const pairAddress = pot2PumpContract.try_getPair(tokenAddress)

//   if (pairAddress.reverted) {
//     return Address.zero()
//   }
//   return pairAddress.value
// }

export function fetchPoolFees(pool: Pool): BigInt {
  const poolContract = PoolContract.bind(Address.fromString(pool.id))
  const globalState = poolContract.try_globalState()
  let fee = pool.fee ? pool.fee : BigInt.fromI32(0)

  if (!globalState.reverted) {
    fee = BigInt.fromI32(globalState.value.value2)
    pool.fee = fee
    pool.save()
  }

  return fee
}

export function updatePoolFees(pool: Pool): BigInt {
  const fees = fetchPoolFees(pool)
  pool.fee = fees
  pool.save()

  return fees
}

export function LoadPoolHourData(pool: Pool, event: ethereum.Event): PoolHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(hourIndex.toString())

  let poolHourData = PoolHourData.load(hourPoolID)

  if (poolHourData === null) {
    poolHourData = new PoolHourData(hourPoolID)
    poolHourData.periodStartUnix = hourStartUnix
    poolHourData.pool = pool.id
    poolHourData.liquidity = pool.liquidity
    poolHourData.sqrtPrice = pool.sqrtPrice
    poolHourData.token0Price = pool.token0Price
    poolHourData.token1Price = pool.token1Price
    poolHourData.tick = pool.tick
    poolHourData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
    poolHourData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
    poolHourData.tvlUSD = ZERO_BD
    poolHourData.volumeToken0 = ZERO_BD
    poolHourData.volumeToken1 = ZERO_BD
    poolHourData.volumeUSD = ZERO_BD
    poolHourData.untrackedVolumeUSD = ZERO_BD
    poolHourData.feesUSD = ZERO_BD
    poolHourData.untrackedVolumeUSD = ZERO_BD
    poolHourData.txCount = ZERO_BI
    poolHourData.open = pool.token0Price
    poolHourData.high = pool.token0Price
    poolHourData.low = pool.token0Price
    poolHourData.close = pool.token0Price
    poolHourData.aprPercentage = pool.aprPercentage

    poolHourData.save()
  }
  return poolHourData
}

export function LoadPoolDayData(pool: Pool, event: ethereum.Event): PoolDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayIndex = timestamp / 86400 // get unique day within unix history
  let dayStartUnix = dayIndex * 86400 // want the rounded effect
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayStartUnix.toString())

  let poolDayData = PoolDayData.load(dayPoolID)

  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartUnix
    poolDayData.pool = pool.id
    poolDayData.liquidity = pool.liquidity
    poolDayData.sqrtPrice = pool.sqrtPrice
    poolDayData.untrackedVolumeUSD = ZERO_BD
    poolDayData.token0Price = pool.token0Price
    poolDayData.token1Price = pool.token1Price
    poolDayData.tick = pool.tick
    poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
    poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
    poolDayData.tvlUSD = pool.totalValueLockedUSD
    poolDayData.feesToken0 = pool.feesToken0
    poolDayData.feesToken1 = pool.feesToken1
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.untrackedVolumeUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
    poolDayData.aprPercentage = pool.aprPercentage
    poolDayData.dailyFeeUSD = ZERO_BD

    poolDayData.save()
  }

  return poolDayData
}

export function LoadPoolWeekData(pool: Pool, event: ethereum.Event): PoolWeekData {
  let timestamp = event.block.timestamp.toI32()
  let weekIndex = timestamp / 604800 // get unique week within unix history
  let weekStartUnix = weekIndex * 604800 // want the rounded effect
  let weekPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(weekStartUnix.toString())

  let poolWeekData = PoolWeekData.load(weekPoolID)

  if (poolWeekData === null) {
    poolWeekData = new PoolWeekData(weekPoolID)
    poolWeekData.week = weekStartUnix
    poolWeekData.pool = pool.id
    poolWeekData.liquidity = pool.liquidity
    poolWeekData.sqrtPrice = pool.sqrtPrice
    poolWeekData.untrackedVolumeUSD = ZERO_BD
    poolWeekData.token0Price = pool.token0Price
    poolWeekData.token1Price = pool.token1Price
    poolWeekData.tick = pool.tick
    poolWeekData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
    poolWeekData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
    poolWeekData.tvlUSD = pool.totalValueLockedUSD
    poolWeekData.feesToken0 = pool.feesToken0
    poolWeekData.feesToken1 = pool.feesToken1
    poolWeekData.volumeToken0 = ZERO_BD
    poolWeekData.volumeToken1 = ZERO_BD
    poolWeekData.volumeUSD = ZERO_BD
    poolWeekData.feesUSD = ZERO_BD
    poolWeekData.txCount = ZERO_BI
    poolWeekData.open = pool.token0Price
    poolWeekData.high = pool.token0Price
    poolWeekData.low = pool.token0Price
    poolWeekData.close = pool.token0Price
    poolWeekData.aprPercentage = pool.aprPercentage
    poolWeekData.weeklyFeeUSD = ZERO_BD

    poolWeekData.save()
  }

  return poolWeekData
}

export function LoadPoolMonthData(pool: Pool, event: ethereum.Event): PoolMonthData {
  let timestamp = event.block.timestamp.toI32()
  let monthIndex = timestamp / 2592000 // get unique month within unix history
  let monthStartUnix = monthIndex * 2592000 // want the rounded effect
  let monthPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(monthStartUnix.toString())

  let poolMonthData = PoolMonthData.load(monthPoolID)

  if (poolMonthData === null) {
    poolMonthData = new PoolMonthData(monthPoolID)
    poolMonthData.month = monthStartUnix
    poolMonthData.pool = pool.id
    poolMonthData.liquidity = pool.liquidity
    poolMonthData.sqrtPrice = pool.sqrtPrice
    poolMonthData.untrackedVolumeUSD = ZERO_BD
    poolMonthData.token0Price = pool.token0Price
    poolMonthData.token1Price = pool.token1Price
    poolMonthData.tick = pool.tick
    poolMonthData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
    poolMonthData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
    poolMonthData.tvlUSD = pool.totalValueLockedUSD
    poolMonthData.feesToken0 = pool.feesToken0
    poolMonthData.feesToken1 = pool.feesToken1
    poolMonthData.volumeToken0 = ZERO_BD
    poolMonthData.volumeToken1 = ZERO_BD
    poolMonthData.volumeUSD = ZERO_BD
    poolMonthData.feesUSD = ZERO_BD
    poolMonthData.txCount = ZERO_BI
    poolMonthData.open = pool.token0Price
    poolMonthData.high = pool.token0Price
    poolMonthData.low = pool.token0Price
    poolMonthData.close = pool.token0Price
    poolMonthData.aprPercentage = pool.aprPercentage
    poolMonthData.monthlyFeeUSD = ZERO_BD

    poolMonthData.save()
  }

  return poolMonthData
}
