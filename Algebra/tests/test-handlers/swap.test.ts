import {
  assert,
  describe,
  test,
  clearStore,
  afterAll,
  newMockEvent,
  beforeAll,
  log,
  beforeEach
} from 'matchstick-as/assembly/index'
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
  createMockTokenEntity,
  createMockBundleEntity
} from '../mocks/dex/entities.mock'
import { ACCOUNT_ADDRESS, TEST_TOKEN_1, TEST_TOKEN_2, POOL_ADDRESS } from '../testConstants'
import { mockGetPair, mockSwapFunctions } from '../mocks/dex/functions.mock'
import { ADDRESS_ZERO } from '../../src/utils/constants'
import { exponentToBigDecimal } from '../../src/utils'

describe('Swap event assertions', () => {
  const USER_INITIAL_SPEND = 10
  const USER_INITIAL_SWAP_COUNT = 2
  const BUNDLE_MATIC_PRICE_USD = 5
  const TOKEN_0_DERIVED_MATIC = 1
  const TOKEN_1_DERIVED_MATIC = 5
  const TOKEN_0_DERIVED_USD = 5
  const TOKEN_1_DERIVED_USD = 1
  const TOKEN_0_DECIMALS = 18
  const TOKEN_1_DECIMALS = 18
  const TOKEN_0_TOTAL_VALUE_LOCKED_USD = 1000
  const TOKEN_1_TOTAL_VALUE_LOCKED_USD = 50

  const price = BigDecimal.fromString('0.2')
    .times(BigDecimal.fromString('5'))
    .times(BigDecimal.fromString('1000000000000000000'))
  const MOCK_SQRT_PRICE = '306881000000000000000000000000'
  const MOCK_TICK = 20337
  const MOCK_LIQUIDITY = '515434481432456362150'

  afterAll(() => {
    clearStore()
  })

  beforeAll(() => {
    mockSwapFunctions()
  })

  beforeEach(() => {
    clearStore()

    const account = createMockAccount(Address.fromString(ACCOUNT_ADDRESS))

    const plugin = createMockPluginEntity(ADDRESS_ZERO, POOL_ADDRESS)

    const token0 = createMockTokenEntity(TEST_TOKEN_1)
    const token1 = createMockTokenEntity(TEST_TOKEN_2)

    const pool = createMockPoolEntity(POOL_ADDRESS, token0, token1)

    const bundle = createMockBundleEntity()

    pool.plugin = Bytes.fromHexString(plugin.id)
    pool.token0 = token0.id
    pool.token1 = token1.id
    pool.token0Price = bigDecimal.fromString('0.2')
    pool.token1Price = bigDecimal.fromString('5')
    pool.sqrtPrice = BigInt.fromString(MOCK_SQRT_PRICE)
    pool.liquidity = BigInt.fromString(MOCK_LIQUIDITY)
    pool.tick = BigInt.fromI32(MOCK_TICK)

    account.totalSpendUSD = BigDecimal.fromString(USER_INITIAL_SPEND.toString())
    account.swapCount = BigInt.fromI32(USER_INITIAL_SWAP_COUNT)

    token0.derivedUSD = BigDecimal.fromString(TOKEN_0_DERIVED_USD.toString())
    token1.derivedUSD = BigDecimal.fromString(TOKEN_1_DERIVED_USD.toString())
    token0.derivedMatic = BigDecimal.fromString(TOKEN_0_DERIVED_MATIC.toString())
    token1.derivedMatic = BigDecimal.fromString(TOKEN_1_DERIVED_MATIC.toString())
    token0.decimals = BigInt.fromI32(TOKEN_0_DECIMALS)
    token1.decimals = BigInt.fromI32(TOKEN_1_DECIMALS)
    token0.totalValueLockedUSD = BigDecimal.fromString(TOKEN_0_TOTAL_VALUE_LOCKED_USD.toString())
    token1.totalValueLockedUSD = BigDecimal.fromString(TOKEN_1_TOTAL_VALUE_LOCKED_USD.toString())

    bundle.maticPriceUSD = bigDecimal.fromString(BUNDLE_MATIC_PRICE_USD.toString())

    pool.save()
    token0.save()
    token1.save()
    account.save()
    plugin.save()
    bundle.save()
  })

  test('Swap event user total spent amount should be correct', () => {
    const TOKEN_0_AMOUNT = 100
    const TOKEN_1_AMOUNT = 10

    let swapEvent = createMockSwapEvent(POOL_ADDRESS)

    let user = Account.load(ACCOUNT_ADDRESS)!
    let pool = Pool.load(POOL_ADDRESS)!
    let token0 = Token.load(TEST_TOKEN_1)!
    let token1 = Token.load(TEST_TOKEN_2)!

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
    let liquidityParam = new ethereum.EventParam(
      'liquidity',
      ethereum.Value.fromSignedBigInt(BigInt.fromString(MOCK_LIQUIDITY))
    )
    let tickParam = new ethereum.EventParam('tick', ethereum.Value.fromSignedBigInt(BigInt.fromI32(MOCK_TICK)))
    let priceParam = new ethereum.EventParam(
      'price',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(MOCK_SQRT_PRICE))
    )
    let overrideFeeParam = new ethereum.EventParam('overrideFee', ethereum.Value.fromI32(100))
    let pluginFeeParam = new ethereum.EventParam('pluginFee', ethereum.Value.fromI32(100))

    swapEvent.transaction.from = Address.fromString(user.id)

    swapEvent.parameters.push(senderParam)
    swapEvent.parameters.push(recipientParam)
    swapEvent.parameters.push(amount0Param)
    swapEvent.parameters.push(amount1Param)
    swapEvent.parameters.push(priceParam)
    swapEvent.parameters.push(liquidityParam)
    swapEvent.parameters.push(tickParam)
    swapEvent.parameters.push(overrideFeeParam)
    swapEvent.parameters.push(pluginFeeParam)

    handleSwap(swapEvent)

    log.info('user.id: {}', [user.id])

    assert.fieldEquals(
      'Account',
      user.id,
      'totalSpendUSD',
      (
        USER_INITIAL_SPEND +
        (TOKEN_0_DERIVED_USD * TOKEN_0_AMOUNT + TOKEN_1_DERIVED_USD * TOKEN_1_AMOUNT) / 2
      ).toString()
    )
    assert.fieldEquals('Account', user.id, 'swapCount', (USER_INITIAL_SWAP_COUNT + 1).toString())
  })

  test('Swap event token total value locked should be correct', () => {
    const TOKEN_0_AMOUNT = 100
    const TOKEN_1_AMOUNT = 10

    let swapEvent = createMockSwapEvent(POOL_ADDRESS)

    let user = Account.load(ACCOUNT_ADDRESS)!
    let pool = Pool.load(POOL_ADDRESS)!
    let token0 = Token.load(TEST_TOKEN_1)!
    let token1 = Token.load(TEST_TOKEN_2)!

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
    let liquidityParam = new ethereum.EventParam(
      'liquidity',
      ethereum.Value.fromSignedBigInt(BigInt.fromString(MOCK_LIQUIDITY))
    )
    let tickParam = new ethereum.EventParam('tick', ethereum.Value.fromI32(MOCK_TICK))
    let priceParam = new ethereum.EventParam(
      'price',
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(MOCK_SQRT_PRICE))
    )
    let overrideFeeParam = new ethereum.EventParam('overrideFee', ethereum.Value.fromI32(100))
    let pluginFeeParam = new ethereum.EventParam('pluginFee', ethereum.Value.fromI32(100))

    swapEvent.transaction.from = Address.fromString(user.id)

    swapEvent.parameters.push(senderParam)
    swapEvent.parameters.push(recipientParam)
    swapEvent.parameters.push(amount0Param)
    swapEvent.parameters.push(amount1Param)
    swapEvent.parameters.push(priceParam)
    swapEvent.parameters.push(liquidityParam)
    swapEvent.parameters.push(tickParam)
    swapEvent.parameters.push(overrideFeeParam)
    swapEvent.parameters.push(pluginFeeParam)

    handleSwap(swapEvent)

    assert.fieldEquals('Token', token0.id, 'totalValueLockedUSD', '1500.009350502705351538844127394345')

    assert.fieldEquals('Token', token1.id, 'totalValueLockedUSD', '9.997999999999999999999999999999999')
  })
})
