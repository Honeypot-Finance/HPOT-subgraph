import {
  OrderPosted as OrderPostedEvent,
  OrderClosed as OrderClosedEvent,
  OrderFilled as OrderFilledEvent
} from '../types/bgt-market/BGTMarket'
import { Account, Order, OrderFilled, OrderPosted } from '../types/schema'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleOrderPosted(event: OrderPostedEvent): void {
  // Create or load Account entity
  let account = Account.load(event.params.dealer.toHexString())
  if (!account) {
    account = new Account(event.params.dealer.toHexString())
    account.save()
  }

  // Create Order entity
  let order = new Order(event.params.orderId.toString())
  order.id = event.params.orderId.toString()
  order.dealer = account.id
  order.price = event.params.price
  order.vaultAddress = event.params.vaultAddress.toHexString()
  order.balance = event.params.balance
  order.spentBalance = BigInt.fromI32(0)
  order.height = event.block.number
  order.orderType = event.params.orderType ? 'BuyBGT' : 'SellBGT'
  order.status = 'Pending'
  order.save()

  // Create OrderPosted entity
  let orderPosted = new OrderPosted(event.params.orderId.toString())
  orderPosted.dealer = account.id
  orderPosted.price = event.params.price
  orderPosted.vaultAddress = event.params.vaultAddress.toHexString()
  orderPosted.balance = event.params.balance
  orderPosted.save()
}

export function handleOrderFilled(event: OrderFilledEvent): void {
  // Create or load Account entity for taker
  let taker = Account.load(event.params.taker.toHexString())
  if (!taker) {
    taker = new Account(event.params.taker.toHexString())
    taker.save()
  }

  // Update Order status
  let order = Order.load(event.params.orderId.toString())
  if (order) {
    order.spentBalance = order.spentBalance.plus(event.params.payment)

    if (order.orderType == 'SellBGT') {
      order.status = 'Filled'
    } else if (order.orderType == 'BuyBGT' && order.spentBalance >= order.balance) {
      order.status = 'Filled'
    }

    order.save()
  }

  // Create OrderFilled entity
  const orderFilledId = event.params.orderId
    .toString()
    .concat('-')
    .concat(event.transaction.hash.toHexString())

  let orderFilled = new OrderFilled(orderFilledId)
  orderFilled.taker = taker.id
  orderFilled.price = event.params.price
  orderFilled.vaultAddress = event.params.vaultAddress.toHexString()
  orderFilled.payment = event.params.payment
  orderFilled.save()
}

export function handleOrderClosed(event: OrderClosedEvent): void {
  // Load and update Order status
  let order = Order.load(event.params.orderId.toString())
  if (order) {
    order.status = 'Closed'
    order.save()
  }
}
