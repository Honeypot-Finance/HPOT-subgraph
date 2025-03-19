/* eslint-disable @typescript-eslint/camelcase */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'

import { IchiVault, VaultShare } from '../types/schema'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const ZERO_BD = BigDecimal.fromString('0')
export const ONE_BD = BigDecimal.fromString('1')
export const BI_18 = BigInt.fromI32(18)

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

// TODO: these functions should really be named getVaultShare as it creates and returns VaultShare if it doesn't exist
// otherwise returns an existing VaultShare
export function createVaultShare(vault: Address, user: Address): VaultShare {
  const id = vault
    .toHexString()
    .concat('-')
    .concat(user.toHexString())
  let vaultShare = VaultShare.load(id)
  if (vaultShare === null) {
    const ichiVault = IchiVault.load(vault.toHexString())

    if (ichiVault === null) {
      throw new Error('IchiVault must exist in subgraph db')
    }

    vaultShare = new VaultShare(id)
    vaultShare.vaultShareBalance = ZERO_BD
    vaultShare.vault = vault.toHexString()
    vaultShare.user = user.toHexString()
    vaultShare.save()
  }
  return vaultShare
}

export function sqrtPriceToPriceDecimal(sqrtPriceX96: BigInt, decimals0: i32, decimals1: i32): BigDecimal {
  // Convert to BigDecimal first to avoid overflow
  const sqrtPrice = sqrtPriceX96.toBigDecimal()

  // Square it
  let price = sqrtPrice.times(sqrtPrice)

  // Divide by 2^(96*2)
  const Q192 = BigInt.fromI32(2)
    .pow(192)
    .toBigDecimal()
  price = price.div(Q192)

  // Adjust for decimal differences
  if (decimals0 >= decimals1) {
    // Multiply by 10^(decimals0 - decimals1)
    const decimalAdjustment = BigInt.fromI32(10)
      .pow(u8(decimals0 - decimals1))
      .toBigDecimal()
    price = price.times(decimalAdjustment)
  } else {
    // Divide by 10^(decimals1 - decimals0)
    const decimalAdjustment = BigInt.fromI32(10)
      .pow(u8(decimals1 - decimals0))
      .toBigDecimal()
    price = price.div(decimalAdjustment)
  }

  return price
}

function calculateFeeValuePerTvlPerSecond(
  feePerSecond0: BigInt,
  feePerSecond1: BigInt,
  price: BigDecimal,
  tvl: BigDecimal
): BigDecimal {
  return feePerSecond0
    .toBigDecimal()
    .times(price)
    .plus(feePerSecond1.toBigDecimal())
    .div(tvl)
}

function weightedAverage(oldValue: BigInt, newValue: BigInt, newValueTime: BigInt, totalTime: BigInt): BigInt {
  const oldWeight = totalTime.minus(newValueTime)
  return oldValue
    .times(oldWeight)
    .plus(newValue.times(newValueTime))
    .div(totalTime)
}

function updateHistoricalFeeRates(
  vault: IchiVault,
  newFeePerSecond0: BigInt,
  newFeePerSecond1: BigInt,
  timestamp: BigInt
): void {
  const secondsInDay = BigInt.fromI32(24 * 60 * 60)
  const timeSinceLastFee = timestamp.minus(vault.lastFeeUpdate)

  // Update 1 day rate
  if (timeSinceLastFee.lt(secondsInDay)) {
    vault.feePerSecond0_1d = weightedAverage(vault.feePerSecond0_1d, newFeePerSecond0, timeSinceLastFee, secondsInDay)
    vault.feePerSecond1_1d = weightedAverage(vault.feePerSecond1_1d, newFeePerSecond1, timeSinceLastFee, secondsInDay)
  } else {
    vault.feePerSecond0_1d = newFeePerSecond0
    vault.feePerSecond1_1d = newFeePerSecond1
  }

  // Update 3 day rate
  const threeDays = secondsInDay.times(BigInt.fromI32(3))
  if (timeSinceLastFee.lt(threeDays)) {
    vault.feePerSecond0_3d = weightedAverage(vault.feePerSecond0_3d, newFeePerSecond0, timeSinceLastFee, threeDays)
    vault.feePerSecond1_3d = weightedAverage(vault.feePerSecond1_3d, newFeePerSecond1, timeSinceLastFee, threeDays)
  } else {
    vault.feePerSecond0_3d = newFeePerSecond0
    vault.feePerSecond1_3d = newFeePerSecond1
  }

  // Update 7 day rate
  const sevenDays = secondsInDay.times(BigInt.fromI32(7))
  if (timeSinceLastFee.lt(sevenDays)) {
    vault.feePerSecond0_7d = weightedAverage(vault.feePerSecond0_7d, newFeePerSecond0, timeSinceLastFee, sevenDays)
    vault.feePerSecond1_7d = weightedAverage(vault.feePerSecond1_7d, newFeePerSecond1, timeSinceLastFee, sevenDays)
  } else {
    vault.feePerSecond0_7d = newFeePerSecond0
    vault.feePerSecond1_7d = newFeePerSecond1
  }

  // Update 30 day rate
  const thirtyDays = secondsInDay.times(BigInt.fromI32(30))
  if (timeSinceLastFee.lt(thirtyDays)) {
    vault.feePerSecond0_30d = weightedAverage(vault.feePerSecond0_30d, newFeePerSecond0, timeSinceLastFee, thirtyDays)
    vault.feePerSecond1_30d = weightedAverage(vault.feePerSecond1_30d, newFeePerSecond1, timeSinceLastFee, thirtyDays)
  } else {
    vault.feePerSecond0_30d = newFeePerSecond0
    vault.feePerSecond1_30d = newFeePerSecond1
  }
}

export function updateVaultFeeMetrics(vault: IchiVault, newFee0: BigInt, newFee1: BigInt, timestamp: BigInt): void {
  const timePassed = timestamp.minus(vault.lastFeeUpdate)
  if (timePassed.equals(BigInt.zero())) {
    return
  }

  const feePerSecond0 = newFee0.div(timePassed)
  const feePerSecond1 = newFee1.div(timePassed)

  // Update historical fee rates with weighted average
  updateHistoricalFeeRates(vault, feePerSecond0, feePerSecond1, timestamp)

  vault.lastFeeUpdate = timestamp

  // Calculate TVL in token1
  const tvl = vault.totalAmount1.toBigDecimal().plus(vault.totalAmount0.toBigDecimal().times(vault.lastPrice))

  // Calculate fee value per TVL per second for each period
  if (tvl.gt(BigDecimal.zero())) {
    const feeValuePerTvlPerSecond1d = calculateFeeValuePerTvlPerSecond(
      vault.feePerSecond0_1d,
      vault.feePerSecond1_1d,
      vault.lastPrice,
      tvl
    )
    const feeValuePerTvlPerSecond3d = calculateFeeValuePerTvlPerSecond(
      vault.feePerSecond0_3d,
      vault.feePerSecond1_3d,
      vault.lastPrice,
      tvl
    )
    const feeValuePerTvlPerSecond7d = calculateFeeValuePerTvlPerSecond(
      vault.feePerSecond0_7d,
      vault.feePerSecond1_7d,
      vault.lastPrice,
      tvl
    )
    const feeValuePerTvlPerSecond30d = calculateFeeValuePerTvlPerSecond(
      vault.feePerSecond0_30d,
      vault.feePerSecond1_30d,
      vault.lastPrice,
      tvl
    )

    // Calculate APRs (feeValuePerTvlPerSecond * seconds_in_year * 100)
    const SECONDS_IN_YEAR = BigDecimal.fromString('31536000') // 365 * 24 * 60 * 60
    const HUNDRED = BigDecimal.fromString('100')

    vault.feeApr_1d = feeValuePerTvlPerSecond1d.times(SECONDS_IN_YEAR).times(HUNDRED)
    vault.feeApr_3d = feeValuePerTvlPerSecond3d.times(SECONDS_IN_YEAR).times(HUNDRED)
    vault.feeApr_7d = feeValuePerTvlPerSecond7d.times(SECONDS_IN_YEAR).times(HUNDRED)
    vault.feeApr_30d = feeValuePerTvlPerSecond30d.times(SECONDS_IN_YEAR).times(HUNDRED)

    vault.save()
  }
}
