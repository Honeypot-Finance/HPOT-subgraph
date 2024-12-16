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

export class TransactionType {
  static DEPOSIT: string = 'DEPOSIT'
  static REFUND: string = 'REFUND'
  static CLAIM_LP: string = 'CLAIM_LP'
  static SWAP: string = 'SWAP'
  static COLLECT: string = 'COLLECT'
  static MINT: string = 'MINT'
  static BURN: string = 'BURN'
  static INCREASE_LIQUIDITY: string = 'INCREASE_LIQUIDITY'
  static DECREASE_LIQUIDITY: string = 'DECREASE_LIQUIDITY'
}

export const MEME_RACERS = [
  '0x150bcee57b23a79c9dd5e707c8a64c65016215d0',
  '0x5b0c7cccc718ee837238be9323ccb63aee538ff4',
  '0x8b045d02c581284295be33d4f261f8e1e6f78f18',
  '0xff4abcd6d4cea557e4267bc81f1d2064615cb49e',
  '0x3F7AAE503000A08A8d4A9AFefa738b565f3A6CD6'
]
