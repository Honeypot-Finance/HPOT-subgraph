import { ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'
import { POT2PUMP_FACTORY_ADDRESS } from '../../../src/utils/constants'
import { Address } from '@graphprotocol/graph-ts'
import { POOL_ADDRESS, TEST_TOKEN_1, TEST_TOKEN_2 } from '../../testConstants'
import { BigInt } from '@graphprotocol/graph-ts'

export function mockTotalFeeGrowth0Token0(): void {
  createMockedFunction(
    Address.fromString(POOL_ADDRESS),
    'totalFeeGrowth0Token',
    'totalFeeGrowth0Token():(uint256)'
  ).returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(0))])
}

export function mockTotalFeeGrowth1Token1(): void {
  createMockedFunction(
    Address.fromString(POOL_ADDRESS),
    'totalFeeGrowth1Token',
    'totalFeeGrowth1Token():(uint256)'
  ).returns([ethereum.Value.fromSignedBigInt(BigInt.fromI32(0))])
}

export function mockFee(): void {
  createMockedFunction(Address.fromString(POOL_ADDRESS), 'fee', 'fee():(uint16)').returns([
    ethereum.Value.fromSignedBigInt(BigInt.fromI32(0))
  ])
}

export function mockGetPair(): void {
  createMockedFunction(Address.fromString(POT2PUMP_FACTORY_ADDRESS), 'getPair', 'getPair(address):(address)')
    .withArgs([ethereum.Value.fromAddress(Address.fromString(TEST_TOKEN_1))])
    .returns([ethereum.Value.fromAddress(Address.fromString(POOL_ADDRESS))])

  createMockedFunction(Address.fromString(POT2PUMP_FACTORY_ADDRESS), 'getPair', 'getPair(address):(address)')
    .withArgs([ethereum.Value.fromAddress(Address.fromString(TEST_TOKEN_2))])
    .returns([ethereum.Value.fromAddress(Address.fromString(POOL_ADDRESS))])
}

export function mockSwapFunctions(): void {
  mockGetPair()
  mockTotalFeeGrowth0Token0()
  mockTotalFeeGrowth1Token1()
  mockFee()
}
