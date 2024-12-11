import {
  Affiliate as AffiliateEvent,
  Approval as ApprovalEvent,
  DeployICHIVault as DeployICHIVaultEvent,
  Deposit as DepositEvent,
  DepositMax as DepositMaxEvent,
  CollectFees as CollectFeesEvent,
  Hysteresis as HysteresisEvent,
  MaxTotalSupply as MaxTotalSupplyEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Rebalance as RebalanceEvent,
  SetTwapPeriod as SetTwapPeriodEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
  ICHIVault,
} from "./types/templates/Vault/ICHIVault";

import { BigDecimal } from "@graphprotocol/graph-ts";

import {
  VaultAffiliate,
  IchiVault,
  VaultApproval,
  DeployICHIVault,
  VaultDeposit,
  VaultDepositMax,
  VaultCollectFee,
  VaultHysteresis,
  MaxTotalSupply,
  VaultOwnershipTransferred,
  VaultRebalance,
  VaultSetTwapPeriod,
  VaultTransfer,
  VaultWithdraw,
} from "./types/schema";

import { AlgebraPool } from "./types/templates/Vault/AlgebraPool";

import {
  ADDRESS_ZERO,
  createUser,
  createVaultShare,
  BI_18,
  convertTokenToDecimal
} from "./helpers";

export function handleAffiliate(event: AffiliateEvent): void {
  const affiliate = new VaultAffiliate(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  affiliate.vault = event.address;
  affiliate.sender = event.params.sender;
  affiliate.affiliate = event.params.affiliate;
  affiliate.save();
}

export function handleApproval(event: ApprovalEvent): void {
  const approval = new VaultApproval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  approval.vault = event.address;
  approval.owner = event.params.owner;
  approval.spender = event.params.spender;
  approval.value = event.params.value;
  approval.save();
}

export function handleDeployICHIVault(event: DeployICHIVaultEvent): void {
  const deployIchiVault = new DeployICHIVault(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  deployIchiVault.vault = event.address.toHexString();
  deployIchiVault.sender = event.params.sender;
  deployIchiVault.pool = event.params.pool;
  deployIchiVault.allowToken0 = event.params.allowToken0;
  deployIchiVault.allowToken1 = event.params.allowToken1;
  deployIchiVault.owner = event.params.owner;
  deployIchiVault.twapPeriod = event.params.twapPeriod;
  deployIchiVault.save();
}

export function handleDeposit(event: DepositEvent): void {
  const deposit = new VaultDeposit(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  deposit.vault = event.address;
  const vaultContract = ICHIVault.bind(event.address);
  const poolAddress = vaultContract.pool();
  const poolContract = AlgebraPool.bind(poolAddress);
  const amount0 = event.params.amount0;
  const amount1 = event.params.amount1;
  const totalAmounts = vaultContract.getTotalAmounts();
  const totalAmount0 = totalAmounts.value0;
  const totalAmount1 = totalAmounts.value1;
  const totalSupply = vaultContract.totalSupply();
  const currentTick = vaultContract.currentTick();

  deposit.sender = event.params.sender;
  deposit.to = event.params.to;
  deposit.shares = event.params.shares;
  deposit.tick = currentTick;
  deposit.createdAtTimestamp = event.block.timestamp;
  deposit.totalSupply = totalSupply;

  deposit.sqrtPrice = poolContract.globalState().value0;
  deposit.amount0 = amount0;
  deposit.amount1 = amount1;
  deposit.totalAmount0 = totalAmount0;
  deposit.totalAmount1 = totalAmount1;
  deposit.totalAmount0BeforeEvent = totalAmount0.minus(amount0);
  deposit.totalAmount1BeforeEvent = totalAmount1.minus(amount1);

  deposit.save();
}

export function handleDepositMax(event: DepositMaxEvent): void {
  const depositMax = new VaultDepositMax(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  depositMax.vault = event.address;
  depositMax.sender = event.params.sender;
  depositMax.deposit0Max = event.params.deposit0Max;
  depositMax.deposit1Max = event.params.deposit1Max;
  depositMax.save();
}

export function handleCollectFees(event: CollectFeesEvent): void {
  let collectFee = new VaultCollectFee(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  const vaultContract = ICHIVault.bind(event.address);
  const poolContract = AlgebraPool.bind(vaultContract.pool());
  const totalAmounts = vaultContract.getTotalAmounts();
  const totalAmount0 = totalAmounts.value0;
  const totalAmount1 = totalAmounts.value1;
  const totalSupply = vaultContract.totalSupply();
  const currentTick = vaultContract.currentTick();

  collectFee.vault = event.address;
  collectFee.sender = event.params.sender;
  collectFee.createdAtTimestamp = event.block.timestamp;
  collectFee.feeAmount0 = event.params.feeAmount0;
  collectFee.feeAmount1 = event.params.feeAmount1;
  collectFee.tick = currentTick;
  collectFee.totalSupply = totalSupply;
  collectFee.sqrtPrice = poolContract.globalState().value0;
  collectFee.totalAmount0 = totalAmount0;
  collectFee.totalAmount1 = totalAmount1;
  collectFee.save();
}

export function handleHysteresis(event: HysteresisEvent): void {
  const hysteresis = new VaultHysteresis(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  hysteresis.vault = event.address;
  hysteresis.sender = event.params.sender;
  hysteresis.hysteresis = event.params.hysteresis;
  hysteresis.save();
}

export function handleMaxTotalSupply(event: MaxTotalSupplyEvent): void {
  const maxTotalSupply = new MaxTotalSupply(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  maxTotalSupply.vault = event.address;
  maxTotalSupply.sender = event.params.sender;
  maxTotalSupply.maxTotalSupply = event.params.maxTotalSupply;
  maxTotalSupply.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  const ownershipTransferred = new VaultOwnershipTransferred(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  ownershipTransferred.vault = event.address;
  ownershipTransferred.previousOwner = event.params.previousOwner;
  ownershipTransferred.newOwner = event.params.newOwner;
  ownershipTransferred.save();
}

export function handleRebalance(event: RebalanceEvent): void {
  const rebalance = new VaultRebalance(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  const vaultContract = ICHIVault.bind(event.address);
  const poolContract = AlgebraPool.bind(vaultContract.pool());
  const currentTick = vaultContract.currentTick();

  rebalance.createdAtTimestamp = event.block.timestamp;
  rebalance.vault = event.address;
  rebalance.tick = event.params.tick;
  rebalance.totalAmount0 = event.params.totalAmount0;
  rebalance.totalAmount1 = event.params.totalAmount1;
  rebalance.feeAmount0 = event.params.feeAmount0;
  rebalance.feeAmount1 = event.params.feeAmount1;
  rebalance.tick = currentTick;
  rebalance.sqrtPrice = poolContract.globalState().value0;
  rebalance.totalSupply = event.params.totalSupply;
  rebalance.save();
}

export function handleSetTwapPeriod(event: SetTwapPeriodEvent): void {
  const setTwapPeriod = new VaultSetTwapPeriod(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  setTwapPeriod.vault = event.address;
  setTwapPeriod.sender = event.params.sender;
  setTwapPeriod.newTwapPeriod = event.params.newTwapPeriod;
  setTwapPeriod.vault = event.address;
  setTwapPeriod.save();
}

export function handleTransfer(event: TransferEvent): void {

  // - - - - - create and store VaultTransfer entity - - - - -

  const vaultContract = ICHIVault.bind(event.address);
  const totalSupply = vaultContract.totalSupply();
  const totalAmounts = vaultContract.getTotalAmounts();
  const totalAmount0 = totalAmounts.value0;
  const totalAmount1 = totalAmounts.value1;
  const currentTick = vaultContract.currentTick();

  const poolContract = AlgebraPool.bind(vaultContract.pool());

  const transfer = new VaultTransfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  transfer.vault = event.address;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.value = event.params.value;
  transfer.createdAtTimestamp = event.block.timestamp;
  transfer.totalSupply = totalSupply;
  transfer.totalAmount0 = totalAmount0;
  transfer.totalAmount1 = totalAmount1;
  transfer.tick = currentTick;
  transfer.sqrtPrice = poolContract.globalState().value0;
  transfer.save();

  // - - - - - update user balances - - - - -

  const from = event.params.from;
  createUser(from);
  const to = event.params.to;
  createUser(to);

  // since the ICHIVault emitted the Transfer event
  const ichiVaultId = event.address.toHexString();

  // share token amount being transfered
  const value = convertTokenToDecimal(event.params.value, BI_18)
  let vault = IchiVault.load(ichiVaultId);
  if (vault == null) {
    vault = new IchiVault(ichiVaultId);
    vault.holdersCount = 0;
    vault.save();
  }

  // we only care about updating the "from" balance if it is NOT address(0) and also not the ICHIVault
  if (from.toHexString() != ADDRESS_ZERO && from.toHexString() != ichiVaultId) {
    const fromUserVaultShare = createVaultShare(event.address, from);
    const wasHolder = !fromUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString("0"));
    fromUserVaultShare.vaultShareBalance = fromUserVaultShare.vaultShareBalance.minus(value);
    const isHolder = !fromUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString("0"));
    if (wasHolder && !isHolder) {
      vault.holdersCount = vault.holdersCount - 1;
    }
    fromUserVaultShare.save();
  }

  // we only care about updating the "to" balance if it is NOT address(0) and also not the ICHIVault
  if (to.toHexString() != ADDRESS_ZERO && to.toHexString() != ichiVaultId) {
    const toUserVaultShare = createVaultShare(event.address, to);
    const wasHolder = !toUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString("0"));
    toUserVaultShare.vaultShareBalance = toUserVaultShare.vaultShareBalance.plus(value);
    const isHolder = !toUserVaultShare.vaultShareBalance.equals(BigDecimal.fromString("0"));
    if (!wasHolder && isHolder) {
      vault.holdersCount = vault.holdersCount + 1;
    }
    toUserVaultShare.save();
  }

  vault.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  const withdraw = new VaultWithdraw(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  withdraw.vault = event.address;
  const vaultContract = ICHIVault.bind(event.address);
  const poolContract = AlgebraPool.bind(vaultContract.pool());
  const amount0 = event.params.amount0;
  const amount1 = event.params.amount1;
  const totalAmounts = vaultContract.getTotalAmounts();
  const totalAmount0 = totalAmounts.value0;
  const totalAmount1 = totalAmounts.value1;
  const totalSupply = vaultContract.totalSupply();
  const currentTick = vaultContract.currentTick();

  withdraw.sender = event.params.sender;
  withdraw.to = event.params.to;
  withdraw.shares = event.params.shares;
  withdraw.tick = currentTick;
  withdraw.createdAtTimestamp = event.block.timestamp;
  withdraw.totalSupply = totalSupply;
  withdraw.sqrtPrice = poolContract.globalState().value0;
  withdraw.amount0 = amount0;
  withdraw.amount1 = amount1;
  withdraw.totalAmount0 = totalAmount0;
  withdraw.totalAmount1 = totalAmount1;
  withdraw.totalAmount0BeforeEvent = totalAmount0.plus(amount0);
  withdraw.totalAmount1BeforeEvent = totalAmount1.plus(amount1);

  withdraw.save();
}
