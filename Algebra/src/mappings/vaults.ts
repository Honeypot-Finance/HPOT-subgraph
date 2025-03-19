/* eslint-disable prefer-const */
import {
  Affiliate as AffiliateEvent,
  Approval as ApprovalEvent,
  DeployICHIVault as DeployICHIVaultEvent,
  Deposit as DepositEvent,
  DepositMax as DepositMaxEvent,
  CollectFees as CollectFeesEvent,
  Hysteresis as HysteresisEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Rebalance as RebalanceEvent,
  SetTwapPeriod as SetTwapPeriodEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
  ICHIVault
} from '../types/templates/Vault/ICHIVault'

import { BigDecimal } from '@graphprotocol/graph-ts'

import {
  VaultAffiliate,
  IchiVault,
  VaultApproval,
  DeployICHIVault,
  VaultDeposit,
  VaultDepositMax,
  VaultCollectFee,
  VaultHysteresis,
  VaultOwnershipTransferred,
  VaultRebalance,
  VaultSetTwapPeriod,
  VaultTransfer,
  VaultWithdraw
} from '../types/schema'

import { AlgebraPool } from '../types/templates/Vault/AlgebraPool'

import {
  ADDRESS_ZERO,
  createVaultShare,
  BI_18,
  convertTokenToDecimal,
  sqrtPriceToPriceDecimal,
  updateVaultFeeMetrics
} from '../utils/helpers'
import { loadAccount } from '../utils/account'
import { loadToken } from '../utils/token'

export function handleAffiliate(event: AffiliateEvent): void {
  const affiliate = new VaultAffiliate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  affiliate.vault = event.address.toHexString()
  affiliate.sender = event.params.sender
  affiliate.affiliate = event.params.affiliate
  affiliate.save()
}

export function handleApproval(event: ApprovalEvent): void {
  const approval = new VaultApproval(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  approval.vault = event.address.toHexString()
  approval.owner = event.params.owner
  approval.spender = event.params.spender
  approval.value = event.params.value
  approval.save()
}

export function handleDeployICHIVault(event: DeployICHIVaultEvent): void {
  const deployIchiVault = new DeployICHIVault(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  deployIchiVault.vault = event.address.toHexString()
  deployIchiVault.sender = event.params.sender
  deployIchiVault.pool = event.params.pool.toHexString()
  deployIchiVault.allowToken0 = event.params.allowToken0
  deployIchiVault.allowToken1 = event.params.allowToken1
  deployIchiVault.owner = event.params.owner
  deployIchiVault.twapPeriod = event.params.twapPeriod
  deployIchiVault.save()
}

export function handleDeposit(event: DepositEvent): void {
  const deposit = new VaultDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  deposit.vault = event.address.toHexString()
  const vaultContract = ICHIVault.bind(event.address)
  const tokenA = loadToken(vaultContract.token0())
  const tokenB = loadToken(vaultContract.token1())

  const tryPool = vaultContract.try_pool()
  const tryTotalSupply = vaultContract.try_totalSupply()
  const tryCurrentTick = vaultContract.try_currentTick()
  const tryTotalAmounts = vaultContract.try_getTotalAmounts()

  if (!tryPool.reverted && !tryTotalSupply.reverted && !tryCurrentTick.reverted && !tryTotalAmounts.reverted) {
    const poolContract = AlgebraPool.bind(tryPool.value)
    const currentTick = tryCurrentTick.value
    const totalSupply = tryTotalSupply.value

    deposit.sender = event.params.sender
    deposit.to = event.params.to
    deposit.shares = event.params.shares
    deposit.amount0 = event.params.amount0
    deposit.amount1 = event.params.amount1
    deposit.tick = currentTick
    deposit.createdAtTimestamp = event.block.timestamp
    deposit.totalSupply = totalSupply

    const tryGlobalState = poolContract.try_globalState()
    if (!tryGlobalState.reverted) {
      const sqrtPriceX96 = tryGlobalState.value.value0
      deposit.sqrtPrice = sqrtPriceX96

      // Get current total amounts
      const totalAmount0 = tryTotalAmounts.value.value0
      const totalAmount1 = tryTotalAmounts.value.value1

      deposit.totalAmount0 = totalAmount0
      deposit.totalAmount1 = totalAmount1
      deposit.totalAmount0BeforeEvent = totalAmount0.minus(event.params.amount0)
      deposit.totalAmount1BeforeEvent = totalAmount1.minus(event.params.amount1)

      // Calculate and store price
      let vault = IchiVault.load(event.address.toHexString())
      if (vault) {
        let price = sqrtPriceToPriceDecimal(sqrtPriceX96, tokenA.decimals.toI32(), tokenB.decimals.toI32())
        deposit.lastPrice = price
        vault.lastPrice = price
        vault.lastPriceTimestamp = event.block.timestamp
        vault.totalAmount0 = totalAmount0
        vault.totalAmount1 = totalAmount1
        vault.totalSupply = totalSupply
        vault.save()
      }

      deposit.save()
    }
  }
}

export function handleDepositMax(event: DepositMaxEvent): void {
  const depositMax = new VaultDepositMax(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  depositMax.vault = event.address.toHexString()
  depositMax.sender = event.params.sender
  depositMax.deposit0Max = event.params.deposit0Max
  depositMax.deposit1Max = event.params.deposit1Max
  depositMax.save()
}

export function handleCollectFees(event: CollectFeesEvent): void {
  const collectFee = new VaultCollectFee(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

  const vaultContract = ICHIVault.bind(event.address)
  const tokenA = loadToken(vaultContract.token0())
  const tokenB = loadToken(vaultContract.token1())

  const tryPool = vaultContract.try_pool()
  const tryTotalSupply = vaultContract.try_totalSupply()
  const tryCurrentTick = vaultContract.try_currentTick()
  const tryTotalAmounts = vaultContract.try_getTotalAmounts()
  if (!tryPool.reverted && !tryTotalSupply.reverted && !tryCurrentTick.reverted && !tryTotalAmounts.reverted) {
    const poolContract = AlgebraPool.bind(tryPool.value)
    const currentTick = tryCurrentTick.value
    const totalSupply = tryTotalSupply.value
    const totalAmount0 = tryTotalAmounts.value.value0
    const totalAmount1 = tryTotalAmounts.value.value1

    collectFee.vault = event.address.toHexString()
    collectFee.sender = event.params.sender
    collectFee.createdAtTimestamp = event.block.timestamp
    collectFee.feeAmount0 = event.params.feeAmount0
    collectFee.feeAmount1 = event.params.feeAmount1
    collectFee.tick = currentTick
    collectFee.totalSupply = totalSupply

    const tryGlobalState = poolContract.try_globalState()
    if (!tryGlobalState.reverted) {
      const sqrtPriceX96 = tryGlobalState.value.value0
      collectFee.sqrtPrice = sqrtPriceX96
      collectFee.totalAmount0 = totalAmount0
      collectFee.totalAmount1 = totalAmount1

      // Calculate and store price
      let vault = IchiVault.load(event.address.toHexString())
      if (vault) {
        let price = sqrtPriceToPriceDecimal(sqrtPriceX96, tokenA.decimals.toI32(), tokenB.decimals.toI32())
        collectFee.lastPrice = price
        vault.lastPrice = price
        vault.lastPriceTimestamp = event.block.timestamp
        vault.totalAmount0 = totalAmount0
        vault.totalAmount1 = totalAmount1
        vault.totalSupply = totalSupply

        // Update fees with new fee amounts from rebalance
        updateVaultFeeMetrics(vault, event.params.feeAmount0, event.params.feeAmount1, event.block.timestamp)

        vault.save()
      }

      collectFee.save()
    }
  }
}

export function handleHysteresis(event: HysteresisEvent): void {
  const hysteresis = new VaultHysteresis(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  hysteresis.vault = event.address.toHexString()
  hysteresis.sender = event.params.sender
  hysteresis.hysteresis = event.params.hysteresis
  hysteresis.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  const ownershipTransferred = new VaultOwnershipTransferred(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  ownershipTransferred.vault = event.address.toHexString()
  ownershipTransferred.previousOwner = event.params.previousOwner
  ownershipTransferred.newOwner = event.params.newOwner
  ownershipTransferred.save()
}

export function handleRebalance(event: RebalanceEvent): void {
  const rebalance = new VaultRebalance(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

  const vaultContract = ICHIVault.bind(event.address)
  const tokenA = loadToken(vaultContract.token0())
  const tokenB = loadToken(vaultContract.token1())
  const tryPool = vaultContract.try_pool()
  const tryCurrentTick = vaultContract.try_currentTick()
  if (!tryPool.reverted && !tryCurrentTick.reverted) {
    const poolContract = AlgebraPool.bind(tryPool.value)
    const currentTick = tryCurrentTick.value

    const tryGlobalState = poolContract.try_globalState()
    if (!tryGlobalState.reverted) {
      const sqrtPriceX96 = tryGlobalState.value.value0
      rebalance.sqrtPrice = sqrtPriceX96
      rebalance.createdAtTimestamp = event.block.timestamp
      rebalance.vault = event.address.toHexString()
      rebalance.tick = event.params.tick
      rebalance.totalAmount0 = event.params.totalAmount0
      rebalance.totalAmount1 = event.params.totalAmount1
      rebalance.feeAmount0 = event.params.feeAmount0
      rebalance.feeAmount1 = event.params.feeAmount1
      rebalance.tick = currentTick
      rebalance.totalSupply = event.params.totalSupply

      // Calculate and store price
      let vault = IchiVault.load(event.address.toHexString())
      if (vault) {
        let price = sqrtPriceToPriceDecimal(sqrtPriceX96, tokenA.decimals.toI32(), tokenB.decimals.toI32())
        rebalance.lastPrice = price
        vault.lastPrice = price
        vault.lastPriceTimestamp = event.block.timestamp
        vault.totalAmount0 = event.params.totalAmount0
        vault.totalAmount1 = event.params.totalAmount1
        vault.totalSupply = event.params.totalSupply

        // Update fees with new fee amounts from rebalance
        updateVaultFeeMetrics(vault, event.params.feeAmount0, event.params.feeAmount1, event.block.timestamp)

        vault.save()
      }

      rebalance.save()
    }
  }
}

export function handleSetTwapPeriod(event: SetTwapPeriodEvent): void {
  const setTwapPeriod = new VaultSetTwapPeriod(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  setTwapPeriod.sender = event.params.sender
  setTwapPeriod.newTwapPeriod = event.params.newTwapPeriod
  setTwapPeriod.vault = event.address.toHexString()
  setTwapPeriod.save()
}

export function handleTransfer(event: TransferEvent): void {
  // - - - - - create and store VaultTransfer entity - - - - -

  const vaultContract = ICHIVault.bind(event.address)
  const tokenA = loadToken(vaultContract.token0())
  const tokenB = loadToken(vaultContract.token1())

  const tryPool = vaultContract.try_pool()
  const tryTotalSupply = vaultContract.try_totalSupply()
  const tryCurrentTick = vaultContract.try_currentTick()
  const tryTotalAmounts = vaultContract.try_getTotalAmounts()
  if (!tryPool.reverted && !tryTotalSupply.reverted && !tryCurrentTick.reverted && !tryTotalAmounts.reverted) {
    const poolContract = AlgebraPool.bind(tryPool.value)
    const currentTick = tryCurrentTick.value
    const totalSupply = tryTotalSupply.value
    const totalAmount0 = tryTotalAmounts.value.value0
    const totalAmount1 = tryTotalAmounts.value.value1

    const transfer = new VaultTransfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    transfer.vault = event.address.toHexString()
    transfer.from = event.params.from
    transfer.to = event.params.to
    transfer.value = event.params.value
    transfer.createdAtTimestamp = event.block.timestamp
    transfer.totalSupply = totalSupply
    transfer.totalAmount0 = totalAmount0
    transfer.totalAmount1 = totalAmount1
    transfer.tick = currentTick

    const tryGlobalState = poolContract.try_globalState()
    if (!tryGlobalState.reverted) {
      const sqrtPriceX96 = tryGlobalState.value.value0
      transfer.sqrtPrice = sqrtPriceX96

      // since the ICHIVault emitted the Transfer event
      const ichiVaultId = event.address.toHexString()

      let vault = IchiVault.load(ichiVaultId)
      if (vault == null) {
        vault = new IchiVault(ichiVaultId)
        vault.holdersCount = 0
        vault.save()
      }
      // Calculate and store price
      let price = sqrtPriceToPriceDecimal(sqrtPriceX96, tokenA.decimals.toI32(), tokenB.decimals.toI32())
      transfer.lastPrice = price
      vault.lastPrice = price
      vault.lastPriceTimestamp = event.block.timestamp
      // Update IchiVault totals
      vault.totalAmount0 = totalAmount0
      vault.totalAmount1 = totalAmount1
      vault.totalSupply = totalSupply
      vault.save()

      transfer.save()

      // - - - - - update user balances - - - - -

      const from = event.params.from
      const fromAccount = loadAccount(from)
      const to = event.params.to
      const toAccount = loadAccount(to)

      // share token amount being transfered
      const value = convertTokenToDecimal(event.params.value, BI_18)

      // we only care about updating the "from" balance if it is NOT address(0) and also not the ICHIVault
      if (from.toHexString() != ADDRESS_ZERO && from.toHexString() != ichiVaultId) {
        const fromUserVaultShare = createVaultShare(event.address, from)
        const wasHolder = !fromUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString('0'))
        fromUserVaultShare.vaultShareBalance = fromUserVaultShare.vaultShareBalance.minus(value)
        const isHolder = !fromUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString('0'))
        if (wasHolder && !isHolder) {
          vault.holdersCount = vault.holdersCount - 1
        }
        fromUserVaultShare.save()
      }

      // we only care about updating the "to" balance if it is NOT address(0) and also not the ICHIVault
      if (to.toHexString() != ADDRESS_ZERO && to.toHexString() != ichiVaultId) {
        const toUserVaultShare = createVaultShare(event.address, to)
        const wasHolder = !toUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString('0'))
        toUserVaultShare.vaultShareBalance = toUserVaultShare.vaultShareBalance.plus(value)
        const isHolder = !toUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString('0'))
        if (!wasHolder && isHolder) {
          vault.holdersCount = vault.holdersCount + 1
        }
        toUserVaultShare.save()
      }

      vault.save()
    }
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  const withdraw = new VaultWithdraw(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  withdraw.vault = event.address.toHexString()
  const vaultContract = ICHIVault.bind(event.address)
  const tokenA = loadToken(vaultContract.token0())
  const tokenB = loadToken(vaultContract.token1())

  const tryPool = vaultContract.try_pool()
  const tryTotalSupply = vaultContract.try_totalSupply()
  const tryCurrentTick = vaultContract.try_currentTick()
  const tryTotalAmounts = vaultContract.try_getTotalAmounts()
  if (!tryPool.reverted && !tryTotalSupply.reverted && !tryCurrentTick.reverted && !tryTotalAmounts.reverted) {
    const poolContract = AlgebraPool.bind(tryPool.value)
    const currentTick = tryCurrentTick.value
    const totalSupply = tryTotalSupply.value
    const totalAmount0 = tryTotalAmounts.value.value0
    const totalAmount1 = tryTotalAmounts.value.value1

    const amount0 = event.params.amount0
    const amount1 = event.params.amount1

    withdraw.sender = event.params.sender
    withdraw.to = event.params.to
    withdraw.shares = event.params.shares
    withdraw.tick = currentTick
    withdraw.createdAtTimestamp = event.block.timestamp
    withdraw.totalSupply = totalSupply

    const tryGlobalState = poolContract.try_globalState()
    if (!tryGlobalState.reverted) {
      const sqrtPriceX96 = tryGlobalState.value.value0
      withdraw.sqrtPrice = sqrtPriceX96
      withdraw.amount0 = amount0
      withdraw.amount1 = amount1
      withdraw.totalAmount0 = totalAmount0
      withdraw.totalAmount1 = totalAmount1
      withdraw.totalAmount0BeforeEvent = totalAmount0.plus(amount0)
      withdraw.totalAmount1BeforeEvent = totalAmount1.plus(amount1)

      // Calculate and store price
      let vault = IchiVault.load(event.address.toHexString())
      if (vault) {
        let price = sqrtPriceToPriceDecimal(sqrtPriceX96, tokenA.decimals.toI32(), tokenB.decimals.toI32())
        withdraw.lastPrice = price
        vault.lastPrice = price
        vault.lastPriceTimestamp = event.block.timestamp
        vault.totalAmount0 = totalAmount0
        vault.totalAmount1 = totalAmount1
        vault.totalSupply = totalSupply
        vault.save()
      }

      withdraw.save()
    }
  }
}
