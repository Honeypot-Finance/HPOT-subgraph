import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { Purchased, Withdraw } from '../types/WasabeeIDO/WasabeeIDO'
import { IDOPool, Purchase, Withdraw as WithdrawEntity } from '../types/schema'

export function handlePurchased(event: Purchased): void {
  let pool = IDOPool.load(event.address.toHexString())
  if (!pool) {
    pool = new IDOPool(event.address.toHexString())
    pool.address = event.address
    pool.idoToken = Bytes.empty()
    pool.idoTotalAmount = BigInt.fromI32(0)
    pool.priceInETH = BigInt.fromI32(0)
    pool.startTime = BigInt.fromI32(0)
    pool.endTime = BigInt.fromI32(0)
    pool.idoSold = BigInt.fromI32(0)
    pool.feeRate = BigInt.fromI32(0)
    pool.maxEthPerWallet = BigInt.fromI32(0)
  }

  let purchase = new Purchase(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  purchase.pool = pool.id
  purchase.buyer = event.params.buyer
  purchase.ethAmount = event.params.ethAmount
  purchase.tokenAmount = event.params.tokenAmount
  purchase.timestamp = event.block.timestamp
  purchase.blockNumber = event.block.number

  pool.idoSold = pool.idoSold.plus(event.params.tokenAmount)

  purchase.save()
  pool.save()
}

export function handleWithdraw(event: Withdraw): void {
  let pool = IDOPool.load(event.address.toHexString())
  if (!pool) {
    pool = new IDOPool(event.address.toHexString())
    pool.address = event.address
    pool.idoToken = Bytes.empty()
    pool.idoTotalAmount = BigInt.fromI32(0)
    pool.priceInETH = BigInt.fromI32(0)
    pool.startTime = BigInt.fromI32(0)
    pool.endTime = BigInt.fromI32(0)
    pool.idoSold = BigInt.fromI32(0)
    pool.feeRate = BigInt.fromI32(0)
    pool.maxEthPerWallet = BigInt.fromI32(0)
  }

  let withdraw = new WithdrawEntity(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  withdraw.pool = pool.id
  withdraw.to = event.params.to
  withdraw.amount = event.params.amount
  withdraw.timestamp = event.block.timestamp
  withdraw.blockNumber = event.block.number

  withdraw.save()
  pool.save()
}
