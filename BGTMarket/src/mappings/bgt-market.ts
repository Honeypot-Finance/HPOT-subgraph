import {
  OrderPosted as OrderPostedEvent,
  OrderClosed as OrderClosedEvent,
  OrderFilled as OrderFilledEvent
} from '../types/bgt-market/BGTMarket'
import { Account, Order, OrderFilled, OrderPosted } from '../types/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import {
  BuyBgtOrderOpened as BuyBgtOrderOpenedEvent,
  BgtOrderClosed as BgtOrderClosedEvent,
  BuyBgtOrderFilled as BuyBgtOrderFilledEvent,
  SellBgtOrderFilled as SellBgtOrderFilledEvent,
  SellBgtOrderOpened as SellBgtOrderOpenedEvent
} from '../types/hey-bgt/HeyBGT'

export function handleOrderPostedBGTMarket(event: OrderPostedEvent): void {
  // Create or load Account entity
  let account = Account.load(event.params.dealer.toHexString())
  if (!account) {
    account = new Account(event.params.dealer.toHexString())
    account.save()
  }

  const orderId = 'bgtmarket-' + event.params.orderId.toString()

  // Create Order entity
  let order = new Order(orderId)
  order.dealer = account.id
  order.price = event.params.price
  order.vaultAddress = event.params.vaultAddress.toHexString()
  order.balance = event.params.balance
  order.spentBalance = BigInt.fromI32(0)
  order.height = event.block.number
  order.orderType = event.params.orderType ? 'BuyBGT' : 'SellBGT'
  order.status = 'Pending'
  order.contract = 'BGTMarket'
  order.save()

  // Create OrderPosted entity
  let orderPosted = new OrderPosted(orderId)
  orderPosted.dealer = account.id
  orderPosted.price = event.params.price
  orderPosted.vaultAddress = event.params.vaultAddress.toHexString()
  orderPosted.balance = event.params.balance
  orderPosted.order = orderId
  orderPosted.save()
}

export function handleOrderFilledBGTMarket(event: OrderFilledEvent): void {
  // Create or load Account entity for taker
  let taker = Account.load(event.params.taker.toHexString())
  if (!taker) {
    taker = new Account(event.params.taker.toHexString())
    taker.save()
  }

  const orderId = 'bgtmarket-' + event.params.orderId.toString()

  // Update Order status
  let order = Order.load(orderId)
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
  const orderFilledId = orderId.concat('-').concat(event.transaction.hash.toHexString())

  let orderFilled = new OrderFilled(orderFilledId)
  orderFilled.taker = taker.id
  orderFilled.price = event.params.price
  orderFilled.vaultAddress = event.params.vaultAddress.toHexString()
  orderFilled.payment = event.params.payment
  orderFilled.order = orderId
  orderFilled.save()
}

export function handleOrderClosedBGTMarket(event: OrderClosedEvent): void {
  const orderId = 'bgtmarket-' + event.params.orderId.toString()

  // Load and update Order status
  let order = Order.load(orderId)
  if (order) {
    order.status = 'Closed'
    order.save()
  }
}

export function handleBuyBgtOrderOpenedHeyBGT(event: BuyBgtOrderOpenedEvent): void {
  // Create or load Account entity
  let account = Account.load(event.transaction.from.toHexString())
  if (!account) {
    account = new Account(event.transaction.from.toHexString())
    account.save()
  }

  const orderId = 'heybgt-' + event.params.orderId.toString()

  // Create Order entity
  let order = new Order(orderId)
  order.dealer = account.id
  order.price = event.params.nodeId // Using nodeId as price for HeyBGT
  order.vaultAddress = '0x0000000000000000000000000000000000000000' // Will be set when filled
  order.balance = BigInt.fromI32(0) // Will be updated when filled
  order.spentBalance = BigInt.fromI32(0)
  order.height = event.block.number
  order.orderType = 'BuyBGT'
  order.status = 'Pending'
  order.contract = 'HeyBGT'
  order.save()

  // Create OrderPosted entity
  let orderPosted = new OrderPosted(orderId)
  orderPosted.dealer = account.id
  orderPosted.price = event.params.nodeId
  orderPosted.vaultAddress = '0x0000000000000000000000000000000000000000'
  orderPosted.balance = BigInt.fromI32(0)
  orderPosted.order = orderId
  orderPosted.save()
}

export function handleSellBgtOrderOpenedHeyBGT(event: SellBgtOrderOpenedEvent): void {
  // Create or load Account entity
  let account = Account.load(event.transaction.from.toHexString())
  if (!account) {
    account = new Account(event.transaction.from.toHexString())
    account.save()
  }

  const orderId = 'heybgt-' + event.params.orderId.toString()

  // Create Order entity
  let order = new Order(orderId)
  order.dealer = account.id
  order.price = event.params.nodeId // Using nodeId as price for HeyBGT
  order.vaultAddress = '0x0000000000000000000000000000000000000000' // Will be set when filled
  order.balance = BigInt.fromI32(0) // Will be updated when filled
  order.spentBalance = BigInt.fromI32(0)
  order.height = event.block.number
  order.orderType = 'SellBGT'
  order.status = 'Pending'
  order.contract = 'HeyBGT'
  order.save()

  // Create OrderPosted entity
  let orderPosted = new OrderPosted(orderId)
  orderPosted.dealer = account.id
  orderPosted.price = event.params.nodeId
  orderPosted.vaultAddress = '0x0000000000000000000000000000000000000000'
  orderPosted.balance = BigInt.fromI32(0)
  orderPosted.order = orderId
  orderPosted.save()
}

export function handleBuyBgtOrderFilledHeyBGT(event: BuyBgtOrderFilledEvent): void {
  // Create or load Account entity for buyer
  let buyer = Account.load(event.params.buyer.toHexString())
  if (!buyer) {
    buyer = new Account(event.params.buyer.toHexString())
    buyer.save()
  }

  const orderId = 'heybgt-' + event.params.orderId.toString()

  // Update Order
  let order = Order.load(orderId)
  if (order) {
    order.vaultAddress = event.params.vault.toHexString()
    order.balance = event.params.paymentFilled
    order.spentBalance = event.params.paymentFilled
    order.status = 'Filled'
    order.save()
  }

  // Create OrderFilled entity
  const orderFilledId = event.params.orderId
    .toString()
    .concat('-')
    .concat(event.transaction.hash.toHexString())

  let orderFilled = new OrderFilled(orderFilledId)
  orderFilled.taker = buyer.id
  orderFilled.price = event.params.bgtFilled
  orderFilled.vaultAddress = event.params.vault.toHexString()
  orderFilled.payment = event.params.paymentFilled
  orderFilled.order = event.params.orderId.toString()
  orderFilled.save()
}

export function handleSellBgtOrderFilledHeyBGT(event: SellBgtOrderFilledEvent): void {
  // Create or load Account entity for buyer
  let buyer = Account.load(event.params.buyer.toHexString())
  if (!buyer) {
    buyer = new Account(event.params.buyer.toHexString())
    buyer.save()
  }

  const orderId = 'heybgt-' + event.params.orderId.toString()

  // Update Order
  let order = Order.load(orderId)
  if (order) {
    order.balance = event.params.paymentFilled
    order.spentBalance = event.params.paymentFilled
    order.status = 'Filled'
    order.save()
  }

  // Create OrderFilled entity
  const orderFilledId = event.params.orderId
    .toString()
    .concat('-')
    .concat(event.transaction.hash.toHexString())

  let orderFilled = new OrderFilled(orderFilledId)
  orderFilled.taker = buyer.id
  orderFilled.price = event.params.bgtFilled
  orderFilled.vaultAddress = '0x0000000000000000000000000000000000000000'
  orderFilled.payment = event.params.paymentFilled
  orderFilled.order = event.params.orderId.toString()
  orderFilled.save()
}

export function handleBgtOrderClosedHeyBGT(event: BgtOrderClosedEvent): void {
  const orderId = 'heybgt-' + event.params.orderId.toString()

  // Load and update Order status
  let order = Order.load(orderId)
  if (order) {
    order.status = 'Closed'
    order.save()
  }
}
