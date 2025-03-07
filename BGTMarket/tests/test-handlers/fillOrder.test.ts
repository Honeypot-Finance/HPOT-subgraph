import { assert, describe, test, clearStore, afterAll, beforeEach, newMockEvent } from 'matchstick-as/assembly/index'
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { handleOrderPosted, handleOrderFilled, handleOrderClosed } from '../../src/mappings/bgt-market'
import { createMockAccount, createMockOrder } from '../mocks/entities.mock'
import { Account, Order } from '../../src/types/schema'
import { OrderClosed, OrderFilled, OrderPosted } from '../../src/types/bgt-market/BGTMarket'

describe('BGTMarket handler tests', () => {
  beforeEach(() => {
    clearStore()
  })

  afterAll(() => {
    clearStore()
  })

  test('handleOrderPosted creates new order and account correctly', () => {
    let mockEvent = newMockEvent()
    const orderPostedEvent = new OrderPosted(
      mockEvent.address,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      mockEvent.parameters,
      mockEvent.receipt
    )

    orderPostedEvent.parameters = new Array()

    orderPostedEvent.parameters.push(
      new ethereum.EventParam('orderId', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('123')))
    )
    orderPostedEvent.parameters.push(
      new ethereum.EventParam(
        'dealer',
        ethereum.Value.fromAddress(Address.fromString('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'.toLowerCase()))
      )
    )
    orderPostedEvent.parameters.push(
      new ethereum.EventParam('price', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100)))
    )
    orderPostedEvent.parameters.push(
      new ethereum.EventParam(
        'vaultAddress',
        ethereum.Value.fromAddress(Address.fromString('0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()))
      )
    )
    orderPostedEvent.parameters.push(
      new ethereum.EventParam('balance', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1000)))
    )
    orderPostedEvent.parameters.push(new ethereum.EventParam('orderType', ethereum.Value.fromI32(1)))

    // log.info('dealer: {}', [orderPostedEvent.params.dealer.toHexString()])
    // log.info('orderId: {}', [orderPostedEvent.params.orderId.toString()])
    // log.info('price: {}', [orderPostedEvent.params.price.toString()])
    // log.info('vaultAddress: {}', [orderPostedEvent.params.vaultAddress.toHexString()])
    // log.info('balance: {}', [orderPostedEvent.params.balance.toString()])
    // log.info('orderType: {}', [orderPostedEvent.params.orderType.toString()])

    handleOrderPosted(orderPostedEvent)

    assert.fieldEquals('Order', '123', 'dealer', '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'.toLowerCase())
    assert.fieldEquals('Order', '123', 'price', '100')
    assert.fieldEquals('Order', '123', 'vaultAddress', '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase())
    assert.fieldEquals('Order', '123', 'balance', '1000')
    assert.fieldEquals('Order', '123', 'orderType', 'BuyBGT')
    assert.fieldEquals('Order', '123', 'status', 'Pending')
  })

  test('handleOrderFilled updates order status correctly for SellBGT order', () => {
    createMockAccount(Address.fromString('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'))
    createMockOrder(
      '123',
      '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'.toLowerCase(),
      BigInt.fromI32(100),
      '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      BigInt.fromI32(1000),
      'SellBGT'
    )

    let mockEvent = newMockEvent()
    const orderFilledEvent = new OrderFilled(
      mockEvent.address,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      mockEvent.parameters,
      mockEvent.receipt
    )

    orderFilledEvent.parameters = new Array()
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('orderId', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('123')))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'taker',
        ethereum.Value.fromAddress(Address.fromString('0x71C7656EC7ab88b098defB751B7401B5f6d8976F'))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('price', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100)))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'vaultAddress',
        ethereum.Value.fromAddress(Address.fromString('0xc778417E063141139Fce010982780140Aa0cD5Ab'))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('payment', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(500)))
    )

    handleOrderFilled(orderFilledEvent)

    assert.fieldEquals('Order', '123', 'status', 'Filled')
    assert.fieldEquals('Order', '123', 'spentBalance', '500')
  })

  test('handleOrderClosed updates order status correctly', () => {
    createMockAccount(Address.fromString('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'))
    createMockOrder(
      '123',
      '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
      BigInt.fromI32(100),
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      BigInt.fromI32(1000),
      'BuyBGT'
    )

    let mockEvent = newMockEvent()
    const orderClosedEvent = new OrderClosed(
      mockEvent.address,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      mockEvent.parameters,
      mockEvent.receipt
    )

    orderClosedEvent.parameters = new Array()
    orderClosedEvent.parameters.push(
      new ethereum.EventParam('orderId', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('123')))
    )

    handleOrderClosed(orderClosedEvent)

    assert.fieldEquals('Order', '123', 'status', 'Closed')
  })

  test('handleOrderFilled updates order status correctly for BuyBGT order', () => {
    createMockAccount(Address.fromString('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'))
    createMockOrder(
      '123',
      '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'.toLowerCase(),
      BigInt.fromI32(100),
      '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      BigInt.fromI32(1000),
      'BuyBGT'
    )

    let mockEvent = newMockEvent()
    const orderFilledEvent = new OrderFilled(
      mockEvent.address,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      mockEvent.parameters,
      mockEvent.receipt
    )

    orderFilledEvent.parameters = new Array()
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('orderId', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('123')))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'taker',
        ethereum.Value.fromAddress(Address.fromString('0x71C7656EC7ab88b098defB751B7401B5f6d8976F'.toLowerCase()))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('price', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100)))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'vaultAddress',
        ethereum.Value.fromAddress(Address.fromString('0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('payment', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(500)))
    )

    handleOrderFilled(orderFilledEvent)

    // Order should not be marked as Filled since spentBalance < balance
    assert.fieldEquals('Order', '123', 'status', 'Pending')
    assert.fieldEquals('Order', '123', 'spentBalance', '500')

    // Second fill that exceeds balance
    orderFilledEvent.parameters = new Array()
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('orderId', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('123')))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'taker',
        ethereum.Value.fromAddress(Address.fromString('0x71C7656EC7ab88b098defB751B7401B5f6d8976F'.toLowerCase()))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('price', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100)))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'vaultAddress',
        ethereum.Value.fromAddress(Address.fromString('0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('payment', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(600)))
    )

    handleOrderFilled(orderFilledEvent)

    // Now order should be marked as Filled since total spentBalance >= balance
    assert.fieldEquals('Order', '123', 'status', 'Filled')
    assert.fieldEquals('Order', '123', 'spentBalance', '1100')
  })

  test('handleOrderFilled keeps BuyBGT order pending when partially filled', () => {
    createMockAccount(Address.fromString('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'))
    createMockOrder(
      '123',
      '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'.toLowerCase(),
      BigInt.fromI32(100),
      '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      BigInt.fromI32(1000),
      'BuyBGT'
    )

    let mockEvent = newMockEvent()
    const orderFilledEvent = new OrderFilled(
      mockEvent.address,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      mockEvent.parameters,
      mockEvent.receipt
    )

    orderFilledEvent.parameters = new Array()
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('orderId', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('123')))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'taker',
        ethereum.Value.fromAddress(Address.fromString('0x71C7656EC7ab88b098defB751B7401B5f6d8976F'.toLowerCase()))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('price', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100)))
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam(
        'vaultAddress',
        ethereum.Value.fromAddress(Address.fromString('0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()))
      )
    )
    orderFilledEvent.parameters.push(
      new ethereum.EventParam('payment', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(400)))
    )

    handleOrderFilled(orderFilledEvent)

    // Order should remain Pending since spentBalance < balance
    assert.fieldEquals('Order', '123', 'status', 'Pending')
    assert.fieldEquals('Order', '123', 'spentBalance', '400')
  })
})
