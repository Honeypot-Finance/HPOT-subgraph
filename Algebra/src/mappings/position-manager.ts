/* eslint-disable prefer-const */
import {
  Collect,
  IncreaseLiquidity,
  DecreaseLiquidity,
  NonfungiblePositionManager,
  Transfer
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import { Bundle, LiquidatorData, Position, PositionSnapshot, Token } from '../types/schema'
import { ADDRESS_ZERO, factoryContract, ZERO_BD, ZERO_BI, pools_list, TransactionType } from '../utils/constants'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { convertTokenToDecimal, loadTransaction } from '../utils'
import { loadAccount } from '../utils/account'
import { getEthPriceInUSD } from '../utils/pricing'

function getPosition(event: ethereum.Event, tokenId: BigInt): Position | null {
  let position = Position.load(tokenId.toString())
  if (position === null) {
    let contract = NonfungiblePositionManager.bind(event.address)
    let positionCall = contract.try_positions(tokenId)

    // the following call reverts in situations where the position is minted
    // and deleted in the same block
    const stringBoolean = `${positionCall.reverted}`
    if (!positionCall.reverted) {
      let positionResult = positionCall.value
      let poolAddress = factoryContract.poolByPair(positionResult.value2, positionResult.value3)

      position = new Position(tokenId.toString())
      // The owner gets correctly updated in the Transfer handler
      position.owner = Address.fromString(ADDRESS_ZERO)
      position.pool = poolAddress.toHexString()
      if (pools_list.includes(position.pool)) {
        position.token0 = positionResult.value3.toHexString()
        position.token1 = positionResult.value2.toHexString()
      } else {
        position.token0 = positionResult.value2.toHexString()
        position.token1 = positionResult.value3.toHexString()
      }
      position.tickLower = position.pool.concat('#').concat(positionResult.value5.toString())
      position.tickUpper = position.pool.concat('#').concat(positionResult.value6.toString())
      position.liquidity = ZERO_BI
      position.depositedToken0 = ZERO_BD
      position.depositedToken1 = ZERO_BD
      position.withdrawnToken0 = ZERO_BD
      position.withdrawnToken1 = ZERO_BD
      position.collectedToken0 = ZERO_BD
      position.collectedToken1 = ZERO_BD
      position.collectedFeesToken0 = ZERO_BD
      position.collectedFeesToken1 = ZERO_BD
      position.transaction = loadTransaction(event, TransactionType.INCREASE_LIQUIDITY).id
      position.feeGrowthInside0LastX128 = positionResult.value8
      position.feeGrowthInside1LastX128 = positionResult.value9
    }
  }

  return position

  return null
}

function updateFeeVars(position: Position, event: ethereum.Event, tokenId: BigInt): Position {
  let positionManagerContract = NonfungiblePositionManager.bind(event.address)
  let positionResult = positionManagerContract.try_positions(tokenId)
  if (!positionResult.reverted) {
    position.feeGrowthInside0LastX128 = positionResult.value.value8
    position.feeGrowthInside1LastX128 = positionResult.value.value9
  }
  return position
}

function savePositionSnapshot(position: Position, event: ethereum.Event): void {
  let positionSnapshot = new PositionSnapshot(position.id.concat('#').concat(event.block.number.toString()))
  positionSnapshot.owner = position.owner
  positionSnapshot.pool = position.pool
  positionSnapshot.position = position.id
  positionSnapshot.blockNumber = event.block.number
  positionSnapshot.timestamp = event.block.timestamp
  positionSnapshot.liquidity = position.liquidity

  if (pools_list.includes(position.pool)) {
    positionSnapshot.depositedToken0 = position.depositedToken1
    positionSnapshot.depositedToken1 = position.depositedToken0
    positionSnapshot.withdrawnToken0 = position.withdrawnToken1
    positionSnapshot.withdrawnToken1 = position.withdrawnToken0
    positionSnapshot.collectedFeesToken0 = position.collectedFeesToken1
    positionSnapshot.collectedFeesToken1 = position.collectedFeesToken0
    positionSnapshot.transaction = loadTransaction(event, TransactionType.INCREASE_LIQUIDITY).id
    positionSnapshot.feeGrowthInside0LastX128 = position.feeGrowthInside1LastX128
    positionSnapshot.feeGrowthInside1LastX128 = position.feeGrowthInside0LastX128
  } else {
    positionSnapshot.depositedToken0 = position.depositedToken0
    positionSnapshot.depositedToken1 = position.depositedToken1
    positionSnapshot.withdrawnToken0 = position.withdrawnToken0
    positionSnapshot.withdrawnToken1 = position.withdrawnToken1
    positionSnapshot.collectedFeesToken0 = position.collectedFeesToken0
    positionSnapshot.collectedFeesToken1 = position.collectedFeesToken1
    positionSnapshot.transaction = loadTransaction(event, TransactionType.INCREASE_LIQUIDITY).id
    positionSnapshot.feeGrowthInside0LastX128 = position.feeGrowthInside0LastX128
    positionSnapshot.feeGrowthInside1LastX128 = position.feeGrowthInside1LastX128
  }

  positionSnapshot.save()
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  let position = getPosition(event, event.params.tokenId)
  let bundle = Bundle.load('1')!
  bundle.maticPriceUSD = getEthPriceInUSD()
  bundle.save()
  // position was not able to be fetched
  if (position == null) {
    return
  }

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)

  let amount1 = ZERO_BD
  let amount0 = ZERO_BD

  if (pools_list.includes(position.pool)) amount0 = convertTokenToDecimal(event.params.amount1, token0!.decimals)
  else amount0 = convertTokenToDecimal(event.params.amount0, token0!.decimals)

  if (pools_list.includes(position.pool)) amount1 = convertTokenToDecimal(event.params.amount0, token1!.decimals)
  else amount1 = convertTokenToDecimal(event.params.amount1, token1!.decimals)

  position.liquidity = position.liquidity.plus(event.params.actualLiquidity)
  position.depositedToken0 = position.depositedToken0.plus(amount0)
  position.depositedToken1 = position.depositedToken1.plus(amount1)

  // recalculatePosition(position)

  let transaction = loadTransaction(event, TransactionType.INCREASE_LIQUIDITY)
  let account = loadAccount(Address.fromString(transaction.account))
  const liquidatorId = `${event.transaction.from.toHex()}#${event.params.pool.toHex()}`
  let liquidator = LiquidatorData.load(liquidatorId)
  if (!liquidator) {
    liquidator = new LiquidatorData(liquidatorId)
    liquidator.token0 = token0!.id
    liquidator.token1 = token1!.id
    liquidator.account = event.transaction.from.toHex()
    liquidator.amount0 = new BigDecimal(new BigInt(0))
    liquidator.amount1 = new BigDecimal(new BigInt(0))
    liquidator.totalLiquidityUsd = new BigDecimal(new BigInt(0))
  }
  liquidator.amount0 = liquidator.amount0.plus(amount0)
  liquidator.amount1 = liquidator.amount1.plus(amount1)

  let amountUSD = amount0
    .times(token0!.derivedMatic.times(bundle.maticPriceUSD))
    .plus(amount1.times(token1!.derivedMatic.times(bundle.maticPriceUSD)))

  liquidator.totalLiquidityUsd = liquidator.totalLiquidityUsd.plus(amountUSD)
  liquidator.pool = position.pool

  if (account != null) {
    account.platformTxCount = account.platformTxCount.plus(BigInt.fromI32(1))
    account.save()
  }

  transaction.save()
  position.save()
  liquidator.save()

  savePositionSnapshot(position, event)
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }
  let bundle = Bundle.load('1')!
  bundle.maticPriceUSD = getEthPriceInUSD()
  bundle.save()

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)

  let amount1 = ZERO_BD
  let amount0 = ZERO_BD

  if (pools_list.includes(position.pool)) amount0 = convertTokenToDecimal(event.params.amount1, token0!.decimals)
  else amount0 = convertTokenToDecimal(event.params.amount0, token0!.decimals)

  if (pools_list.includes(position.pool)) amount1 = convertTokenToDecimal(event.params.amount0, token1!.decimals)
  else amount1 = convertTokenToDecimal(event.params.amount1, token1!.decimals)

  position.liquidity = position.liquidity.minus(event.params.liquidity)
  position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
  position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)

  position = updateFeeVars(position, event, event.params.tokenId)
  // recalculatePosition(position)

  let transaction = loadTransaction(event, TransactionType.DECREASE_LIQUIDITY)
  let account = loadAccount(Address.fromString(transaction.account))
  const liquidatorId = `${event.transaction.from.toHex()}#${position.pool}`
  let liquidator = LiquidatorData.load(liquidatorId)
  if (!liquidator) {
    liquidator = new LiquidatorData(liquidatorId)
    liquidator.token0 = token0!.id
    liquidator.token1 = token1!.id
    liquidator.account = event.transaction.from.toHex()
    liquidator.amount0 = new BigDecimal(new BigInt(0))
    liquidator.amount1 = new BigDecimal(new BigInt(0))
    liquidator.totalLiquidityUsd = new BigDecimal(new BigInt(0))
  }
  liquidator.amount0 = liquidator.amount0.minus(amount0)
  liquidator.amount1 = liquidator.amount1.minus(amount1)
  liquidator.pool = position.pool

  let amountUSD = amount0
    .times(token0!.derivedMatic.times(bundle.maticPriceUSD))
    .plus(amount1.times(token1!.derivedMatic.times(bundle.maticPriceUSD)))
  liquidator.totalLiquidityUsd = liquidator.totalLiquidityUsd.minus(amountUSD)

  if (account != null) {
    account.platformTxCount = account.platformTxCount.plus(BigInt.fromI32(1))
    account.save()
  }

  transaction.save()
  position.save()
  liquidator.save()

  savePositionSnapshot(position, event)
}

export function handleCollect(event: Collect): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)

  let amount1 = ZERO_BD
  let amount0 = ZERO_BD

  if (pools_list.includes(position.pool)) amount0 = convertTokenToDecimal(event.params.amount1, token0!.decimals)
  else amount0 = convertTokenToDecimal(event.params.amount0, token0!.decimals)

  if (pools_list.includes(position.pool)) amount1 = convertTokenToDecimal(event.params.amount0, token1!.decimals)
  else amount1 = convertTokenToDecimal(event.params.amount1, token1!.decimals)

  position.collectedToken0 = position.collectedToken0.plus(amount0)
  position.collectedToken1 = position.collectedToken1.plus(amount1)

  position.collectedFeesToken0 = position.collectedToken0.minus(position.withdrawnToken0)
  position.collectedFeesToken1 = position.collectedToken1.minus(position.withdrawnToken1)

  position = updateFeeVars(position, event, event.params.tokenId)

  // recalculatePosition(position)

  let transaction = loadTransaction(event, TransactionType.COLLECT)
  let account = loadAccount(Address.fromString(transaction.account))

  if (account != null) {
    account.platformTxCount = account.platformTxCount.plus(BigInt.fromI32(1))
    account.save()
  }

  transaction.save()
  position.save()

  savePositionSnapshot(position, event)
}

export function handleTransfer(event: Transfer): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }

  position.owner = event.params.to
  position.save()

  savePositionSnapshot(position, event)
}
