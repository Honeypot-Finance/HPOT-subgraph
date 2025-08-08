/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, bigDecimal } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../types/templates/Pool/Factory'

export const POT2PUMP_FACTORY_ADDRESS = '${POT2PUMP_FACTORY_ADDRESS}'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '${FACTORY_ADDRESS}'
export const FEE_DENOMINATOR = BigDecimal.fromString('1000000')

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let HUNDRED_BI = BigInt.fromI32(100)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let HUNDRED_BD = BigDecimal.fromString('100')
export let BI_18 = BigInt.fromI32(18)

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

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

export const MEME_RACE_START_TIME = BigInt.fromI32(1734523200)
export const MEME_RACERS: string[] = [
  // '0x2004116f5bbc9f8df3cf46be48d0788fd284f979'.toLowerCase(),
  // '0xd92e5d89cfe82bb0c0f95a3f4b0ee5ddb22e5e87'.toLowerCase(),
  // '0x04457d8063168e7008df0f6d10961622a316dd1c'.toLowerCase(),
  // '0x3d7c362411b39ae2d1aae1088759711cb1c5f0f3'.toLowerCase(),
  // '0x6f82653a5f95f8d4215cfa6cbc07de2429989b1d'.toLowerCase(),
  // '0x223c1ee6fae816e430ada62a1e5a20c3060f0b4f'.toLowerCase(),
  // '0x6e504fcb8519820499ec2518bd912016b373c5dc'.toLowerCase(),
  // '0x24dc27d117aca1d8c0aace33bd840026c9a52e28'.toLowerCase()
]