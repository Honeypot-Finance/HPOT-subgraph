import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ZERO_BD, ONE_BD, ZERO_BI } from './constants'
import { Pool, PoolDayData, PoolWeekData, PoolMonthData, PoolHourData } from '../types/schema'
import { LoadPoolDayData, LoadPoolHourData, LoadPoolMonthData, LoadPoolWeekData } from './liquidityPools'

// Calculate APR based on fees and TVL
export function calculateAPR(feeUSD: BigDecimal, tvlUSD: BigDecimal, periodInDays: BigInt): BigDecimal {
  if (tvlUSD.equals(ZERO_BD)) {
    return ZERO_BD
  }

  // APR = (Fee * 365 / period) / TVL * 100
  let annualizedFee = feeUSD.times(BigDecimal.fromString('365')).div(periodInDays.toBigDecimal())
  return annualizedFee.div(tvlUSD).times(BigDecimal.fromString('100'))
}

// Update APR for pool
export function updatePoolAPR(pool: Pool, event: ethereum.Event): void {
  // Use 24h fees for APR calculation
  let poolHourData = LoadPoolHourData(pool, event)
  let poolDayData = LoadPoolDayData(pool, event)
  let poolWeekData = LoadPoolWeekData(pool, event)
  let poolMonthData = LoadPoolMonthData(pool, event)

  const aprHourPercentage = calculateAPR(poolHourData.feesUSD, poolHourData.volumeUSD, BigInt.fromI32(1))
  const aprDayPercentage = calculateAPR(poolDayData.feesUSD, poolDayData.volumeUSD, BigInt.fromI32(1))
  const aprWeekPercentage = calculateAPR(poolWeekData.feesUSD, poolWeekData.volumeUSD, BigInt.fromI32(1))
  const aprMonthPercentage = calculateAPR(poolMonthData.feesUSD, poolMonthData.volumeUSD, BigInt.fromI32(1))

  poolHourData.aprPercentage = aprHourPercentage
  poolDayData.aprPercentage = aprDayPercentage
  poolWeekData.aprPercentage = aprWeekPercentage
  poolMonthData.aprPercentage = aprMonthPercentage
  pool.aprPercentage = aprHourPercentage

  pool.save()
  poolHourData.save()
  poolDayData.save()
  poolWeekData.save()
  poolMonthData.save()
}
