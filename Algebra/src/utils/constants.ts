/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, Bytes } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../types/templates/Pool/Factory'


export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = Bytes.fromHexString('0x306F06C147f064A010530292A1EB6737c3e378e4')

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let TICK_SPACING = BigInt.fromI32(60)
export let Q96 = BigDecimal.fromString("79228162514264337593543950336")

export let factoryContract = FactoryContract.bind(Address.fromBytes(FACTORY_ADDRESS))

export let pools_list = [""]