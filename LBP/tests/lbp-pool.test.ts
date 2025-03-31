import { assert, describe, test, clearStore, beforeAll, afterAll, beforeEach } from 'matchstick-as/assembly/index'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import { handleBuy, handleSell, handleClose, handleMaxRaiseReached } from '../src/mappings/LBP_Pool'
import { createBuyEvent, createSellEvent, createCloseEvent } from './lbp-pool-utils'

// Test address constants
const POOL_ADDRESS = '0x0000000000000000000000000000000000000001'
const USER_ADDRESS = '0x0000000000000000000000000000000000000002'

describe('LBP Pool Mappings', () => {
  beforeEach(() => {
    clearStore()
  })

  test('Can handle Buy event', () => {
    const assets = BigInt.fromI32(1000)
    const shares = BigInt.fromI32(100)
    const swapFee = BigInt.fromI32(10)

    const buyEvent = createBuyEvent(
      Address.fromString(USER_ADDRESS), // caller
      Address.fromString(USER_ADDRESS), // recipient
      assets,
      shares,
      swapFee,
      Address.fromString(POOL_ADDRESS)
    )

    handleBuy(buyEvent)

    assert.entityCount('Buy', 1)
    assert.entityCount('LBPPool', 1)

    // Check Buy entity
    assert.fieldEquals(
      'Buy',
      buyEvent.transaction.hash.toHexString() + '-' + buyEvent.logIndex.toString(),
      'assets',
      assets.toString()
    )
    assert.fieldEquals(
      'Buy',
      buyEvent.transaction.hash.toHexString() + '-' + buyEvent.logIndex.toString(),
      'shares',
      shares.toString()
    )
    assert.fieldEquals(
      'Buy',
      buyEvent.transaction.hash.toHexString() + '-' + buyEvent.logIndex.toString(),
      'swapFee',
      swapFee.toString()
    )

    // Check Pool entity updates
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalPurchased', shares.toString())
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalAssetsIn', assets.toString())
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'totalSwapFeesAsset', swapFee.toString())
  })

  test('Can handle Sell event', () => {
    // First create a pool
    const buyEvent = createBuyEvent(
      Address.fromString(USER_ADDRESS),
      Address.fromString(USER_ADDRESS),
      BigInt.fromI32(1000),
      BigInt.fromI32(100),
      BigInt.fromI32(10),
      Address.fromString(POOL_ADDRESS)
    )
    handleBuy(buyEvent)

    const shares = BigInt.fromI32(50)
    const assets = BigInt.fromI32(500)
    const swapFee = BigInt.fromI32(5)

    const sellEvent = createSellEvent(
      Address.fromString(USER_ADDRESS),
      Address.fromString(USER_ADDRESS),
      shares,
      assets,
      swapFee,
      Address.fromString(POOL_ADDRESS)
    )

    handleSell(sellEvent)

    assert.entityCount('Sell', 1)

    // Check Sell entity
    assert.fieldEquals(
      'Sell',
      sellEvent.transaction.hash.toHexString() + '-' + sellEvent.logIndex.toString(),
      'shares',
      shares.toString()
    )
    assert.fieldEquals(
      'Sell',
      sellEvent.transaction.hash.toHexString() + '-' + sellEvent.logIndex.toString(),
      'assets',
      assets.toString()
    )
    assert.fieldEquals(
      'Sell',
      sellEvent.transaction.hash.toHexString() + '-' + sellEvent.logIndex.toString(),
      'swapFee',
      swapFee.toString()
    )
  })

  test('Can handle Close event', () => {
    // First create a pool
    const buyEvent = createBuyEvent(
      Address.fromString(USER_ADDRESS),
      Address.fromString(USER_ADDRESS),
      BigInt.fromI32(1000),
      BigInt.fromI32(100),
      BigInt.fromI32(10),
      Address.fromString(POOL_ADDRESS)
    )
    handleBuy(buyEvent)

    const assets = BigInt.fromI32(1000)
    const platformFees = BigInt.fromI32(20)
    const swapFeesAsset = BigInt.fromI32(30)
    const swapFeesShare = BigInt.fromI32(40)

    const closeEvent = createCloseEvent(
      assets,
      platformFees,
      swapFeesAsset,
      swapFeesShare,
      Address.fromString(POOL_ADDRESS)
    )

    handleClose(closeEvent)

    assert.entityCount('Close', 1)

    // Check Close entity
    assert.fieldEquals(
      'Close',
      closeEvent.transaction.hash.toHexString() + '-' + closeEvent.logIndex.toString(),
      'assets',
      assets.toString()
    )
    assert.fieldEquals(
      'Close',
      closeEvent.transaction.hash.toHexString() + '-' + closeEvent.logIndex.toString(),
      'platformFees',
      platformFees.toString()
    )

    // Check Pool closed status
    assert.fieldEquals('LBPPool', POOL_ADDRESS, 'closed', 'true')
  })
})
