import {
  Buy as BuyEvent,
  Sell as SellEvent,
  Close as CloseEvent,
  LiquidityBootstrapPool
} from '../types/templates/LBP_Pool/LiquidityBootstrapPool'
import { LBPPool, Buy, Sell, Close } from '../types/schema'
import { BigInt, log } from '@graphprotocol/graph-ts'

export function handleBuy(event: BuyEvent): void {
  let pool = LBPPool.load(event.address.toHexString())

  if (!pool) {
    pool = new LBPPool(event.address.toHexString())
    pool.address = event.address
    pool.totalPurchased = BigInt.fromI32(0)
    pool.totalAssetsIn = BigInt.fromI32(0)
    pool.totalSwapFeesAsset = BigInt.fromI32(0)
    pool.totalSwapFeesShare = BigInt.fromI32(0)
    pool.cancelled = false
    pool.closed = false
  }

  let buy = new Buy(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  buy.pool = pool.id
  buy.caller = event.params.caller
  buy.assets = event.params.assets
  buy.shares = event.params.shares
  buy.swapFee = event.params.swapFee
  buy.timestamp = event.block.timestamp
  buy.blockNumber = event.block.number

  pool.totalPurchased = pool.totalPurchased.plus(event.params.shares)
  pool.totalAssetsIn = pool.totalAssetsIn.plus(event.params.assets)
  pool.totalSwapFeesAsset = pool.totalSwapFeesAsset.plus(event.params.swapFee)

  pool.save()
  buy.save()
}

export function handleSell(event: SellEvent): void {
  let pool = LBPPool.load(event.address.toHexString())
  if (!pool) return

  let sell = new Sell(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  sell.pool = pool.id
  sell.caller = event.params.caller
  sell.shares = event.params.shares
  sell.assets = event.params.assets
  sell.swapFee = event.params.swapFee
  sell.timestamp = event.block.timestamp
  sell.blockNumber = event.block.number

  pool.totalSwapFeesShare = pool.totalSwapFeesShare.plus(event.params.swapFee)

  pool.save()
  sell.save()
}

export function handleClose(event: CloseEvent): void {
  let pool = LBPPool.load(event.address.toHexString())
  if (!pool) return

  let close = new Close(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  close.pool = pool.id
  close.assets = event.params.assets
  close.platformFees = event.params.platformFees
  close.swapFeesAsset = event.params.swapFeesAsset
  close.swapFeesShare = event.params.swapFeesShare
  close.timestamp = event.block.timestamp
  close.blockNumber = event.block.number

  pool.closed = true

  pool.save()
  close.save()
}
