import {
  Buy as BuyEvent,
  Sell as SellEvent,
  Close as CloseEvent,
  MaxRaiseReached as MaxRaiseReachedEvent,
  FeesPaid as FeesPaidEvent,
  Cancelled as CancelledEvent,
  V2LPCreated as V2LPCreatedEvent,
  LiquidityBootstrapPool
} from '../types/templates/LBP_Pool/LiquidityBootstrapPool'
import { LBPPool, Buy, Sell, Close, MaxRaiseReached, FeesPaid, V2LPCreated } from '../types/schema'
import { BigInt } from '@graphprotocol/graph-ts'

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
  buy.recipient = event.params.recipient
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
  sell.recipient = event.params.recipient
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

export function handleMaxRaiseReached(event: MaxRaiseReachedEvent): void {
  let pool = LBPPool.load(event.address.toHexString())
  if (!pool) return

  let maxRaise = new MaxRaiseReached(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  maxRaise.pool = pool.id
  maxRaise.totalPurchased = event.params.totalPurchased
  maxRaise.totalAssetsIn = event.params.totalAssetsIn
  maxRaise.totalSwapFeesAsset = event.params.totalSwapFeesAsset
  maxRaise.totalSwapFeesShare = event.params.totalSwapFeesShare
  maxRaise.timestamp = event.block.timestamp
  maxRaise.blockNumber = event.block.number

  pool.totalPurchased = event.params.totalPurchased
  pool.totalAssetsIn = event.params.totalAssetsIn
  pool.totalSwapFeesAsset = event.params.totalSwapFeesAsset
  pool.totalSwapFeesShare = event.params.totalSwapFeesShare

  pool.save()
  maxRaise.save()
}

export function handleFeesPaid(event: FeesPaidEvent): void {
  let pool = LBPPool.load(event.address.toHexString())
  if (!pool) return

  let feesPaid = new FeesPaid(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  feesPaid.pool = pool.id
  feesPaid.platformFees = event.params.platformFees
  feesPaid.swapFeesAsset = event.params.swapFeesAsset
  feesPaid.swapFeesShare = event.params.swapFeesShare
  feesPaid.timestamp = event.block.timestamp
  feesPaid.blockNumber = event.block.number

  feesPaid.save()
}

export function handleCancelled(event: CancelledEvent): void {
  let pool = LBPPool.load(event.address.toHexString())
  if (!pool) return

  pool.cancelled = true
  pool.save()
}

export function handleV2LPCreated(event: V2LPCreatedEvent): void {
  let pool = LBPPool.load(event.address.toHexString())
  if (!pool) return

  let lpCreated = new V2LPCreated(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  lpCreated.pool = pool.id
  lpCreated.lp = event.params.lp
  lpCreated.lpReceiver = event.params.lpReceiver
  lpCreated.lpToken = event.params.lpToken
  lpCreated.addedLpAssets = event.params.addedLpAssets
  lpCreated.addedShares = event.params.addedshares
  lpCreated.timestamp = event.block.timestamp
  lpCreated.blockNumber = event.block.number

  lpCreated.save()
}
