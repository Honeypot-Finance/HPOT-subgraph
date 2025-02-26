import { assert, describe, test, clearStore, afterAll, newMockEvent, beforeAll } from 'matchstick-as/assembly/index'
import { Address, BigInt, Bytes, ethereum, BigDecimal, bigDecimal } from '@graphprotocol/graph-ts'
import { handleSwap } from '../../src/mappings/core'
import { Account, Participant, ParticipantTransactionHistory, Pool, Swap, Token } from '../../src/types/schema'
import { Swap__Params, Swap as SwapEvent } from '../../src/types/templates/Pool/Pool'
import { newMockEventWithParams } from 'matchstick-as/assembly/index'
import {
  createMockAccount,
  createMockPluginEntity,
  createMockPoolEntity,
  createMockSwapEvent,
  createMockTokenEntity
} from '../mocks/dex/entities.mock'
import { ACCOUNT_ADDRESS, TEST_TOKEN_1, TEST_TOKEN_2, POOL_ADDRESS } from '../testConstants'
import { mockGetPair, mockSwapFunctions } from '../mocks/dex/functions.mock'
import { ADDRESS_ZERO } from '../../src/utils/constants'
import { exponentToBigDecimal } from '../../src/utils'

describe('Swap event assertions', () => {
  afterAll(() => {
    clearStore()
  })

  beforeAll(() => {
    mockSwapFunctions()

    const account = createMockAccount(Address.fromString(ACCOUNT_ADDRESS))

    const plugin = createMockPluginEntity(ADDRESS_ZERO, POOL_ADDRESS)

    const token0 = createMockTokenEntity(TEST_TOKEN_1)
    const token1 = createMockTokenEntity(TEST_TOKEN_2)

    const pool = createMockPoolEntity(POOL_ADDRESS, token0, token1)

    pool.plugin = Bytes.fromHexString(plugin.id)
    pool.token0 = token0.id
    pool.token1 = token1.id

    pool.save()
    token0.save()
    token1.save()
    account.save()
    plugin.save()
  })

  test('Swap event user total spent amount should be correct', () => {
    const USER_INITIAL_SPEND = 10
    const TOKEN_0_DERIVED_USD = 100
    const TOKEN_1_DERIVED_USD = 10
    const TOKEN_0_AMOUNT = 100
    const TOKEN_1_AMOUNT = 10
    const TOKEN_0_DECIMALS = 18
    const TOKEN_1_DECIMALS = 6

    let swapEvent = createMockSwapEvent(POOL_ADDRESS)

    let user = Account.load(ACCOUNT_ADDRESS)!
    let pool = Pool.load(POOL_ADDRESS)!
    let token0 = Token.load(TEST_TOKEN_1)!
    let token1 = Token.load(TEST_TOKEN_2)!

    user.totalSpendUSD = BigDecimal.fromString(USER_INITIAL_SPEND.toString())

    token0.derivedUSD = BigDecimal.fromString(TOKEN_0_DERIVED_USD.toString())
    token1.derivedUSD = BigDecimal.fromString(TOKEN_1_DERIVED_USD.toString())
    token0.decimals = BigInt.fromI32(TOKEN_0_DECIMALS)
    token1.decimals = BigInt.fromI32(TOKEN_1_DECIMALS)

    const token0amount = BigDecimal.fromString(TOKEN_0_AMOUNT.toString()).times(
      exponentToBigDecimal(BigInt.fromI32(TOKEN_0_DECIMALS))
    )
    const token1amount = BigDecimal.fromString(TOKEN_1_AMOUNT.toString()).times(
      exponentToBigDecimal(BigInt.fromI32(TOKEN_1_DECIMALS))
    )

    let senderParam = new ethereum.EventParam('sender', ethereum.Value.fromAddress(Address.fromString(user.id)))
    let recipientParam = new ethereum.EventParam('recipient', ethereum.Value.fromAddress(Address.fromString(user.id)))
    let amount0Param = new ethereum.EventParam(
      'amount0',
      ethereum.Value.fromSignedBigInt(BigInt.fromString(token0amount.toString()))
    )
    let amount1Param = new ethereum.EventParam(
      'amount1',
      ethereum.Value.fromSignedBigInt(BigInt.fromString(token1amount.toString()))
    )
    let liquidityParam = new ethereum.EventParam('liquidity', ethereum.Value.fromSignedBigInt(BigInt.fromI32(100)))
    let tickParam = new ethereum.EventParam('tick', ethereum.Value.fromI32(100))
    let priceParam = new ethereum.EventParam('price', ethereum.Value.fromSignedBigInt(BigInt.fromI32(100)))
    let overrideFeeParam = new ethereum.EventParam('overrideFee', ethereum.Value.fromI32(100))
    let pluginFeeParam = new ethereum.EventParam('pluginFee', ethereum.Value.fromI32(100))

    swapEvent.transaction.from = Address.fromString(user.id)
    swapEvent.parameters.push(senderParam)
    swapEvent.parameters.push(recipientParam)
    swapEvent.parameters.push(amount0Param)
    swapEvent.parameters.push(amount1Param)
    swapEvent.parameters.push(liquidityParam)
    swapEvent.parameters.push(tickParam)
    swapEvent.parameters.push(priceParam)
    swapEvent.parameters.push(overrideFeeParam)
    swapEvent.parameters.push(pluginFeeParam)

    handleSwap(swapEvent)

    assert.fieldEquals(
      'Account',
      user.id,
      'totalSpendUSD',
      (USER_INITIAL_SPEND + TOKEN_0_DERIVED_USD * TOKEN_0_AMOUNT + TOKEN_1_DERIVED_USD * TOKEN_1_AMOUNT).toString()
    )
  })
})
