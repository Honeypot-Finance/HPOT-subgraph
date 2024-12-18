import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { ZERO_BD, ONE_BD } from './constants'
import { Pool, PoolDayData, PoolWeekData, PoolMonthData } from '../types/schema'

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
export function updatePoolAPR(pool: Pool): void {
  // Use 24h fees for APR calculation
  let dayData = PoolDayData.load(pool.id)
  if (!dayData) {
    pool.aprPercentage = ZERO_BD
    return
  }

  pool.aprPercentage = calculateAPR(
    dayData.feesUSD,
    pool.totalValueLockedUSD,
    BigInt.fromI32(1) // 1 day period
  )
}

// Update day data APR
export function updateDayDataAPR(dayData: PoolDayData): void {
  dayData.aprPercentage = calculateAPR(dayData.feesUSD, dayData.tvlUSD, BigInt.fromI32(1))
}

// Update week data APR
export function updateWeekDataAPR(weekData: PoolWeekData): void {
  weekData.aprPercentage = calculateAPR(weekData.feesUSD, weekData.tvlUSD, BigInt.fromI32(7))
}

// Update month data APR
export function updateMonthDataAPR(monthData: PoolMonthData): void {
  monthData.aprPercentage = calculateAPR(monthData.feesUSD, monthData.tvlUSD, BigInt.fromI32(30))
}
