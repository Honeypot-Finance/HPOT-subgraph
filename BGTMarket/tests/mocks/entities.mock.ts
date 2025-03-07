import { Address, BigInt } from '@graphprotocol/graph-ts'
import { Account, Order } from '../../src/types/schema'

export function createMockAccount(address: Address): Account {
  let account = new Account(address.toHexString())
  account.save()
  return account
}

export function createMockOrder(
  orderId: string,
  dealer: string,
  price: BigInt,
  vaultAddress: string,
  balance: BigInt,
  orderType: string
): Order {
  let order = new Order(orderId)
  order.dealer = dealer
  order.price = price
  order.vaultAddress = vaultAddress
  order.balance = balance
  order.spentBalance = BigInt.fromI32(0)
  order.height = BigInt.fromI32(1)
  order.orderType = orderType
  order.status = 'Pending'
  order.save()
  return order
}
