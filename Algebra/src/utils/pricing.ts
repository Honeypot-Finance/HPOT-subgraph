/* eslint-disable prefer-const */
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'
import { Bundle, Pool, Token } from './../types/schema'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal, safeDiv } from '../utils/index'

export const WNATIVE_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'.toLowerCase()
export const STABLE_NATIVE_POOL = '0x568e7d3811a78a5edbdb07df869f3ab0d793a786'.toLowerCase()

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export let WHITELIST_TOKENS: string[] = [
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
  ]

export let STABLE_COINS: string[] = [
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
  ]

let Q192 = Math.pow(2, 192)

let MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('0')

export function priceToTokenPrices(price: BigInt, token0: Token, token1: Token): BigDecimal[] {
  let num = price.times(price).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  let price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0.decimals))
    .div(exponentToBigDecimal(token1.decimals))

  let price0 = safeDiv(BigDecimal.fromString('1'), price1)
  return [price0, price1]
}

export function getEthPriceInUSD(): BigDecimal {
  let usdcPool = Pool.load(STABLE_NATIVE_POOL)
  if (usdcPool !== null) {
    // Check which token is the stable coin
    if (STABLE_COINS.includes(usdcPool.token0.toLowerCase())) {
      // token0 is stable, so native price is token0Price (stable per native)
      log.info('Native price in USD (token0 is stable): {}', [usdcPool.token0Price.toString()])
      return usdcPool.token0Price
    } else if (STABLE_COINS.includes(usdcPool.token1.toLowerCase())) {
      // token1 is stable, so native price is token1Price (stable per native)
      log.info('Native price in USD (token1 is stable): {}', [usdcPool.token1Price.toString()])
      return usdcPool.token1Price
    }
  }
  return ZERO_BD
}

/**
 * Search through graph to find derived Native per token.
 * @todo update to be derived Native (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WNATIVE_ADDRESS) {
    return ONE_BD
  }
  let whiteList = token.whitelistPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityNative = ZERO_BD
  let priceSoFar = ZERO_BD
  let bundle = Bundle.load('1')

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (STABLE_COINS.includes(token.id.toLowerCase())) {
    // Stablecoins have a fixed value, so 1 stablecoin = 1 USD
    // To get native per token: if 1 USDC = 1 USD and 1 WBNB = X USD, then 1 USDC = 1/X WBNB
    priceSoFar = bundle!.maticPriceUSD.gt(ZERO_BD) ? safeDiv(ONE_BD, bundle!.maticPriceUSD) : ZERO_BD
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      let poolAddress = whiteList[i]
      let pool = Pool.load(poolAddress)!
      if (pool.liquidity.gt(ZERO_BI)) {
        if (pool.token0 == token.id) {
          // whitelist token is token1
          let token1 = Token.load(pool.token1)!
          // get the derived Native in pool
          let nativeLocked = pool.totalValueLockedToken1.times(token1.derivedMatic)
          if (
            nativeLocked.gt(largestLiquidityNative) &&
            nativeLocked.gt(MINIMUM_NATIVE_LOCKED) &&
            pool.token1Price.gt(ZERO_BD)
          ) {
            largestLiquidityNative = nativeLocked
            // token1 per our token * Native per token1
            priceSoFar = pool.token1Price.times(token1.derivedMatic as BigDecimal)

            // log.info(
            //   'poolAddress: {}, token1.id: {}, nativeLocked: {}, token1.derivedMatic: {}, pool.token1Price: {}, priceSoFar: {}, priceCalculated: {}',
            //   [
            //     poolAddress,
            //     token1.id.toString(),
            //     nativeLocked.toString(),
            //     token1.derivedMatic.toString(),
            //     pool.token1Price.toString(),
            //     priceSoFar.toString(),
            //     pool.token1Price.times(token1.derivedMatic as BigDecimal).toString()
            //   ]
            // )
          }
        }
        if (pool.token1 == token.id) {
          // whitelist token is token0
          let token0 = Token.load(pool.token0)!
          // get the derived Native in pool
          let nativeLocked = pool.totalValueLockedToken0.times(token0.derivedMatic)
          if (
            nativeLocked.gt(largestLiquidityNative) &&
            nativeLocked.gt(MINIMUM_NATIVE_LOCKED) &&
            pool.token0Price.gt(ZERO_BD)
          ) {
            largestLiquidityNative = nativeLocked
            // token0 per our token * Native per token0
            priceSoFar = pool.token0Price.times(token0.derivedMatic as BigDecimal)

            // log.info(
            //   'poolAddress: {}, token0.id: {}, nativeLocked: {}, token0.derivedMatic: {}, pool.token0Price: {}, priceSoFar: {}, priceCalculated: {}',
            //   [
            //     poolAddress,
            //     token0.id.toString(),
            //     nativeLocked.toString(),
            //     token0.derivedMatic.toString(),
            //     pool.token0Price.toString(),
            //     priceSoFar.toString(),
            //     pool.token0Price.times(token0.derivedMatic as BigDecimal).toString()
            //   ]
            // )
          }
        }
      }
    }
  }

  return priceSoFar // nothing was found return 0
}

export function getDerivedPriceUSD(token: Token): BigDecimal {
  // Stablecoins should always be $1
  if (STABLE_COINS.includes(token.id.toLowerCase())) {
    return ONE_BD
  }
  
  let bundle = Bundle.load('1')!
  return token.derivedMatic.times(bundle.maticPriceUSD)
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedAmountUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')!
  let price0USD = token0.derivedMatic.times(bundle.maticPriceUSD)
  let price1USD = token1.derivedMatic.times(bundle.maticPriceUSD)

  // both are whitelist tokens, return sum of both amounts
  if (WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
    return tokenAmount0.times(price0USD).plus(tokenAmount1.times(price1USD))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST_TOKENS.includes(token0.id) && !WHITELIST_TOKENS.includes(token1.id)) {
    return tokenAmount0.times(price0USD).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
    return tokenAmount1.times(price1USD).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked amount is 0
  return ZERO_BD
}