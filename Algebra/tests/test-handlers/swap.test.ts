import { assert, describe, test, clearStore, afterAll, newMockEvent, beforeAll } from 'matchstick-as/assembly/index'
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { handleSwap } from '../../src/mappings/core'
import { Participant, ParticipantTransactionHistory, Swap } from '../../src/types/schema'
import { Swap__Params, Swap as SwapEvent } from '../../src/types/templates/Pool/Pool'
import { newMockEventWithParams } from 'matchstick-as/assembly/index'
import {
  createMockAccount,
  createMockPoolEntity,
  createMockSwapEvent,
  createMockTokenEntity
} from '../mocks/dex/entities.mock'
import { ACCOUNT_ADDRESS, WBERA_ADDRESS, HPOT_ADDRESS, POOL_ADDRESS } from '../testConstants'

describe('Swap event assertions', () => {
  afterAll(() => {
    clearStore()
  })

  beforeAll(() => {
    const account = createMockAccount(Address.fromString(ACCOUNT_ADDRESS))

    const token0 = createMockTokenEntity(WBERA_ADDRESS)
    const token1 = createMockTokenEntity(HPOT_ADDRESS)

    const pool = createMockPoolEntity(POOL_ADDRESS)

    pool.save()
    token0.save()
    token1.save()
    account.save()
  })

  test('Swap event should right', () => {
    let swapEvent = createMockSwapEvent(POOL_ADDRESS)
    handleSwap(swapEvent)
  })
})
