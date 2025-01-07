import { WHITELIST_TOKENS } from '../utils/pricing'
/* eslint-disable prefer-const */
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD, ADDRESS_ZERO, pools_list } from '../utils/constants'
import { Factory } from '../types/schema'
import { Pool as PoolEvent } from '../types/Factory/Factory'
import { DefaultCommunityFee, CustomPool } from '../types/Factory/Factory'
import { Pool, Token, Bundle } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenTotalSupply,
  fetchTokenDecimals,
  fetchTokenPot2PumpAddress,
  loadToken
} from '../utils/token'
import { log, BigInt, Address } from '@graphprotocol/graph-ts'
import { updatePoolFees } from '../utils/liquidityPools'

export function handlePoolCreated(event: PoolEvent): void {
  // load factory
  let factory = loadFactory()

  factory.poolCount = factory.poolCount.plus(ONE_BI)

  let pool = loadDefaultPool(event.params.pool.toHexString())

  let token0_address = event.params.token0
  let token1_address = event.params.token1

  if (pools_list.includes(event.params.pool.toHexString())) {
    token0_address = event.params.token1
    token1_address = event.params.token0
  }

  let token0 = loadToken(token0_address)
  let token1 = loadToken(token1_address)

  // update white listed pools
  if (WHITELIST_TOKENS.includes(token0.id)) {
    let newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }

  if (WHITELIST_TOKENS.includes(token1.id)) {
    let newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.communityFee = factory.defaultCommunityFee
  pool.searchString = pool.id.toLowerCase() + ' ' + token0.symbol.toLowerCase() + ' ' + token1.symbol.toLowerCase()

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
  factory.save()

  updatePoolFees(pool)
}

export function handleCustomPoolCreated(event: CustomPool): void {
  // load factory
  let factory = loadFactory()

  factory.poolCount = factory.poolCount.plus(ONE_BI)

  let pool = loadDefaultPool(event.params.pool.toHexString())

  let token0_address = event.params.token0
  let token1_address = event.params.token1

  if (pools_list.includes(event.params.pool.toHexString())) {
    token0_address = event.params.token1
    token1_address = event.params.token0
  }

  let token0 = loadToken(token0_address)
  let token1 = loadToken(token1_address)

  // update white listed pools
  if (WHITELIST_TOKENS.includes(token0.id)) {
    let newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }
  if (WHITELIST_TOKENS.includes(token1.id)) {
    let newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.deployer = event.params.deployer
  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.communityFee = factory.defaultCommunityFee
  pool.searchString = pool.id.toLowerCase() + ' ' + token0.symbol.toLowerCase() + ' ' + token1.symbol.toLowerCase()

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
  factory.save()

  updatePoolFees(pool)
}

export function handleNewCommunityFee(event: DefaultCommunityFee): void {
  let factory = loadFactory()
  factory.defaultCommunityFee = BigInt.fromI32(event.params.newDefaultCommunityFee as i32)
  factory.save()
}

function loadFactory(): Factory {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory == null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.poolCount = ZERO_BI
    factory.totalVolumeMatic = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesMatic = ZERO_BD
    factory.defaultCommunityFee = ZERO_BI
    factory.totalValueLockedMatic = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.totalValueLockedMaticUntracked = ZERO_BD
    factory.txCount = ZERO_BI
    factory.owner = ADDRESS_ZERO
    factory.accountCount = ZERO_BI
    // create new bundle for tracking matic price
    let bundle = new Bundle('1')
    bundle.maticPriceUSD = ZERO_BD
    bundle.save()
  }

  factory.save()
  return factory
}

function loadDefaultPool(id: string): Pool {
  let pool = new Pool(id) as Pool
  pool.deployer = Address.fromString(ADDRESS_ZERO)
  pool.plugin = Address.fromString(ADDRESS_ZERO)
  pool.token0 = ''
  pool.token1 = ''
  pool.fee = BigInt.fromI32(100)
  pool.pluginConfig = 0
  pool.createdAtTimestamp = ZERO_BI
  pool.createdAtBlockNumber = ZERO_BI
  pool.liquidityProviderCount = ZERO_BI
  pool.tickSpacing = BigInt.fromI32(60)
  pool.tick = ZERO_BI
  pool.txCount = ZERO_BI
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.feeGrowthGlobal0X128 = ZERO_BI
  pool.feeGrowthGlobal1X128 = ZERO_BI
  pool.communityFee = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.observationIndex = ZERO_BI
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.totalValueLockedMatic = ZERO_BD
  pool.totalValueLockedUSDUntracked = ZERO_BD
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.feesToken0 = ZERO_BD
  pool.feesToken1 = ZERO_BD
  pool.untrackedVolumeUSD = ZERO_BD
  pool.untrackedFeesUSD = ZERO_BD
  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD
  pool.aprPercentage = ZERO_BD

  return pool
}
