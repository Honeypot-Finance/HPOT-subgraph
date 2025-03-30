/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, bigDecimal } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../types/templates/Pool/Factory'

export const POT2PUMP_FACTORY_ADDRESS = '0xC38eF79A6cA9b3EfBe20F3dD3b99B3e25d09F52B'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const BGT_MARKET_ADDRESS = '0x53458cE30b71a7f306BDd1ACD8790B91Bd45bFD0'
export const HEY_BGT_ADDRESS = '0x5f8a463334E29635Bdaca9c01B76313395462430'
export const FEE_DENOMINATOR = BigDecimal.fromString('1000000')

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let HUNDRED_BI = BigInt.fromI32(100)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let HUNDRED_BD = BigDecimal.fromString('100')
export let BI_18 = BigInt.fromI32(18)

export enum TransactionType {
  DEPOSIT, // 0
  REFUND, // 1
  CLAIM_LP, // 2
  SWAP, // 3
  COLLECT, // 4
  MINT, // 5
  BURN, // 6
  INCREASE_LIQUIDITY, // 7
  DECREASE_LIQUIDITY // 8
}

export const TransactionTypeToString = (type: i32): string => {
  switch (type) {
    case TransactionType.DEPOSIT:
      return 'DEPOSIT'
    case TransactionType.REFUND:
      return 'REFUND'
    case TransactionType.CLAIM_LP:
      return 'CLAIM_LP'
    case TransactionType.SWAP:
      return 'SWAP'
    case TransactionType.COLLECT:
      return 'COLLECT'
    case TransactionType.MINT:
      return 'MINT'
    case TransactionType.BURN:
      return 'BURN'
    case TransactionType.INCREASE_LIQUIDITY:
      return 'INCREASE_LIQUIDITY'
    case TransactionType.DECREASE_LIQUIDITY:
      return 'DECREASE_LIQUIDITY'
    default:
      return 'UNKNOWN'
  }
}
