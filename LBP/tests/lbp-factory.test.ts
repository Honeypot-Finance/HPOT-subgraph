import { assert, describe, test, clearStore, beforeEach } from 'matchstick-as/assembly/index'
import { Address } from '@graphprotocol/graph-ts'
import { handlePoolCreated } from '../src/mappings/LBP_factory'
import { createPoolCreatedEvent } from './lbp-factory-utils'

const POOL_ADDRESS = '0x0000000000000000000000000000000000000001'

describe('LBP Factory Mappings', () => {
  beforeEach(() => {
    clearStore()
  })

  test('Can handle PoolCreated event', () => {
    const poolEvent = createPoolCreatedEvent(Address.fromString(POOL_ADDRESS))

    handlePoolCreated(poolEvent)

    assert.entityCount('LBPPool', 1)
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'address', POOL_ADDRESS)
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalPurchased', '0')
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalAssetsIn', '0')
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalSwapFeesAsset', '0')
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalSwapFeesShare', '0')
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'cancelled', 'false')
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'closed', 'false')
  })
})
