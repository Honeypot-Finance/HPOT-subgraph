/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, bigDecimal } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../types/templates/Pool/Factory'

export const POT2PUMP_FACTORY_ADDRESS = '0x30DbCcdFE17571c2Cec5caB61736a5AF194b1593'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '0xB21b59d368e04b6a55ca7Fb78DEaF0c82fD289cC'
export const FEE_DENOMINATOR = BigDecimal.fromString('1000000')

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let HUNDRED_BI = BigInt.fromI32(100)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let HUNDRED_BD = BigDecimal.fromString('100')
export let BI_18 = BigInt.fromI32(18)

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

export let pools_list = ['']

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

export const MEME_RACERS = [
  '0x0C9a7895a7d93cDAC09079eb37dfBb186ce664d1'.toLowerCase(),
  '0xea2148fcf19a75f0066b4a58967b6a46260db911'.toLowerCase(),
  '0x0de0da199f7702f9a012e0b44c416738134392c2'.toLowerCase(),
  '0xf5936c007541a428a7bcde997dcf92e4a3648728'.toLowerCase(),
  '0xa675885b5a767a9c5afec6ecfb4076d0f6a2322a'.toLowerCase(),
  '0xa57bb140c490fb01ce02ff6ee7596d47b52abaa5'.toLowerCase(),
  '0x0fb4a8e6f3d19449d5a5ba46e89bdeb218f627ef'.toLowerCase(),
  '0xe8d36edc13c1c687a3eb88a737c0fa34213d5aa7'.toLowerCase()
]
