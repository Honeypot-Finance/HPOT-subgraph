import { PoolCreated as PoolEvent } from '../types/LBP_Factory/LiquidityBootstrapPoolFactory'
import { LBPPool } from './../types/schema'
import { LBP_Pool as LBPPoolTemplate } from '../types/templates'
import { BigInt } from '@graphprotocol/graph-ts'

export function handlePoolCreated(event: PoolEvent): void {
  // Create a new pool entity
  let pool = new LBPPool(event.params.pool.toHexString())

  // Initialize pool properties
  pool.address = event.params.pool
  pool.totalPurchased = BigInt.fromI32(0)
  pool.totalAssetsIn = BigInt.fromI32(0)
  pool.totalSwapFeesAsset = BigInt.fromI32(0)
  pool.totalSwapFeesShare = BigInt.fromI32(0)
  pool.cancelled = false
  pool.closed = false
  pool.createdAt = event.block.timestamp

  // Save the pool entity
  pool.save()

  // Create a new pool template instance to track events from this pool
  LBPPoolTemplate.create(event.params.pool)
}
