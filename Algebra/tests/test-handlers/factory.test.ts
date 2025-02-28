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
import { Account, Factory, Participant, ParticipantTransactionHistory, Pool, Swap, Token } from '../../src/types/schema'
import { Swap__Params, Swap as SwapEvent } from '../../src/types/templates/Pool/Pool'
import { newMockEventWithParams } from 'matchstick-as/assembly/index'
import {
  createMockAccount,
  createMockPluginEntity,
  createMockPoolEntity,
  createMockSwapEvent,
  createMockTokenEntity,
  createMockBundleEntity,
  createDexFactoryEntity
} from '../mocks/dex/entities.mock'
import { ACCOUNT_ADDRESS, TEST_TOKEN_1, TEST_TOKEN_2, POOL_ADDRESS } from '../testConstants'
import { mockGetPair, mockSwapFunctions } from '../mocks/dex/functions.mock'
import { ADDRESS_ZERO, FACTORY_ADDRESS } from '../../src/utils/constants'
import { exponentToBigDecimal } from '../../src/utils'

describe('factory test', () => {
  afterAll(() => {
    clearStore()
  })

  beforeAll(() => {})

  beforeEach(() => {
    clearStore()

    const factory = createDexFactoryEntity()

    const account = createMockAccount(Address.fromString(ACCOUNT_ADDRESS))

    const plugin = createMockPluginEntity(ADDRESS_ZERO, POOL_ADDRESS)

    const token0 = createMockTokenEntity(TEST_TOKEN_1)
    const token1 = createMockTokenEntity(TEST_TOKEN_2)

    const pool = createMockPoolEntity(POOL_ADDRESS, token0, token1)

    const bundle = createMockBundleEntity()

    pool.save()
    token0.save()
    token1.save()
    account.save()
    plugin.save()
    bundle.save()
    factory.save()
  })

  test('factory default community fee should be correct', () => {
    const factory = Factory.load(FACTORY_ADDRESS)!

    assert.fieldEquals('Factory', factory.id, 'defaultCommunityFee', '100')
  })
})
