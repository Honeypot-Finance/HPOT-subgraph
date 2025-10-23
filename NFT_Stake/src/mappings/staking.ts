import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  Staked as StakedEvent,
  StakedFor as StakedForEvent,
  Unstaked as UnstakedEvent,
  UnstakedFor as UnstakedForEvent,
  RewardClaimed as RewardClaimedEvent,
  Burned as BurnedEvent,
  BurnRewardClaimed as BurnRewardClaimedEvent,
  ParametersUpdated as ParametersUpdatedEvent,
  BatchStaked as BatchStakedEvent,
  BatchClaimed as BatchClaimedEvent,
  BatchUnstaked as BatchUnstakedEvent,
  BatchBurned as BatchBurnedEvent,
  PayoutRecipientSet as PayoutRecipientSetEvent
} from '../types/NFTStaking/NFTStaking'
import {
  StakingContract,
  Stake,
  User,
  StakeEvent,
  RewardClaim,
  ParameterEpoch,
  DailyStat,
  BatchOperation,
  PayoutRecipientUpdate
} from '../types/schema'
import { getOrCreateStakingContract, getOrCreateUser, getOrCreateDailyStat, getOrCreateGlobalStats, toDecimal } from '../utils/helpers'

export function handleStaked(event: StakedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStaked = globalStats.totalStaked.plus(BigInt.fromI32(1))
  globalStats.save()

  // Get or create staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.plus(BigInt.fromI32(1))
  contract.save()

  // Get or create user
  const user = getOrCreateUser(userAddress)
  user.totalStaked = user.totalStaked.plus(BigInt.fromI32(1))
  user.save()

  // Create stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  let stake = new Stake(stakeId)
  stake.contract = contract.id
  stake.tokenId = tokenId
  stake.owner = user.id
  stake.ownerAddress = userAddress
  stake.stakedAt = event.block.timestamp
  stake.lastClaimAt = event.block.timestamp
  stake.burned = false
  stake.burnedAt = null
  stake.lastBurnClaimAt = null
  stake.totalStakingRewardsClaimed = BigDecimal.zero()
  stake.totalBurnRewardsClaimed = BigDecimal.zero()
  stake.status = 'STAKED'
  stake.save()

  // Create stake event
  const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const stakeEventEntity = new StakeEvent(stakeEventId)
  stakeEventEntity.stake = stake.id
  stakeEventEntity.type = 'STAKE'
  stakeEventEntity.user = user.id
  stakeEventEntity.userAddress = userAddress
  stakeEventEntity.tokenId = tokenId
  stakeEventEntity.transactionHash = event.transaction.hash
  stakeEventEntity.timestamp = event.block.timestamp
  stakeEventEntity.blockNumber = event.block.number
  stakeEventEntity.logIndex = event.logIndex
  stakeEventEntity.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newStakes = dailyStat.newStakes.plus(BigInt.fromI32(1))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleStakedFor(event: StakedForEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const ownerAddress = event.params.owner
  const operatorAddress = event.params.operator

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStaked = globalStats.totalStaked.plus(BigInt.fromI32(1))
  globalStats.save()

  // Get or create staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.plus(BigInt.fromI32(1))
  contract.save()

  // Get or create user (owner of the NFT)
  const user = getOrCreateUser(ownerAddress)
  user.totalStaked = user.totalStaked.plus(BigInt.fromI32(1))
  user.save()

  // Create stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  let stake = new Stake(stakeId)
  stake.contract = contract.id
  stake.tokenId = tokenId
  stake.owner = user.id
  stake.ownerAddress = ownerAddress
  stake.stakedAt = event.block.timestamp
  stake.lastClaimAt = event.block.timestamp
  stake.burned = false
  stake.burnedAt = null
  stake.lastBurnClaimAt = null
  stake.totalStakingRewardsClaimed = BigDecimal.zero()
  stake.totalBurnRewardsClaimed = BigDecimal.zero()
  stake.status = 'STAKED'
  stake.save()

  // Create stake event (using owner as the user for the event)
  const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const stakeEventEntity = new StakeEvent(stakeEventId)
  stakeEventEntity.stake = stake.id
  stakeEventEntity.type = 'STAKE'
  stakeEventEntity.user = user.id
  stakeEventEntity.userAddress = ownerAddress
  stakeEventEntity.tokenId = tokenId
  stakeEventEntity.transactionHash = event.transaction.hash
  stakeEventEntity.timestamp = event.block.timestamp
  stakeEventEntity.blockNumber = event.block.number
  stakeEventEntity.logIndex = event.logIndex
  stakeEventEntity.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newStakes = dailyStat.newStakes.plus(BigInt.fromI32(1))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleUnstaked(event: UnstakedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStaked = globalStats.totalStaked.minus(BigInt.fromI32(1))
  globalStats.save()

  // Update staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(1))
  contract.save()

  // Update user
  const user = getOrCreateUser(userAddress)
  user.totalStaked = user.totalStaked.minus(BigInt.fromI32(1))
  user.save()

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.status = 'UNSTAKED'
    stake.save()
  }

  // Create stake event
  const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const stakeEventEntity = new StakeEvent(stakeEventId)
  stakeEventEntity.stake = stakeId
  stakeEventEntity.type = 'UNSTAKE'
  stakeEventEntity.user = user.id
  stakeEventEntity.userAddress = userAddress
  stakeEventEntity.tokenId = tokenId
  stakeEventEntity.transactionHash = event.transaction.hash
  stakeEventEntity.timestamp = event.block.timestamp
  stakeEventEntity.blockNumber = event.block.number
  stakeEventEntity.logIndex = event.logIndex
  stakeEventEntity.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newUnstakes = dailyStat.newUnstakes.plus(BigInt.fromI32(1))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleUnstakedFor(event: UnstakedForEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const ownerAddress = event.params.owner
  const operatorAddress = event.params.operator

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStaked = globalStats.totalStaked.minus(BigInt.fromI32(1))
  globalStats.save()

  // Update staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(1))
  contract.save()

  // Update user (owner of the NFT)
  const user = getOrCreateUser(ownerAddress)
  user.totalStaked = user.totalStaked.minus(BigInt.fromI32(1))
  user.save()

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.status = 'UNSTAKED'
    stake.save()
  }

  // Create stake event (using owner as the user for the event)
  const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const stakeEventEntity = new StakeEvent(stakeEventId)
  stakeEventEntity.stake = stakeId
  stakeEventEntity.type = 'UNSTAKE'
  stakeEventEntity.user = user.id
  stakeEventEntity.userAddress = ownerAddress
  stakeEventEntity.tokenId = tokenId
  stakeEventEntity.transactionHash = event.transaction.hash
  stakeEventEntity.timestamp = event.block.timestamp
  stakeEventEntity.blockNumber = event.block.number
  stakeEventEntity.logIndex = event.logIndex
  stakeEventEntity.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newUnstakes = dailyStat.newUnstakes.plus(BigInt.fromI32(1))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user
  const amount = event.params.amount

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStakingRewardsClaimed = globalStats.totalStakingRewardsClaimed.plus(toDecimal(amount))
  globalStats.totalAllRewardsClaimed = globalStats.totalAllRewardsClaimed.plus(toDecimal(amount))
  globalStats.save()

  // Update contract stats
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStakingRewardsClaimed = contract.totalStakingRewardsClaimed.plus(toDecimal(amount))
  contract.save()

  // Update user stats
  const user = getOrCreateUser(userAddress)
  user.totalStakingRewardsClaimed = user.totalStakingRewardsClaimed.plus(toDecimal(amount))
  user.save()

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.totalStakingRewardsClaimed = stake.totalStakingRewardsClaimed.plus(toDecimal(amount))
    stake.lastClaimAt = event.block.timestamp
    stake.save()
  }

  // Create reward claim
  const claimId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const claim = new RewardClaim(claimId)
  claim.stake = stakeId
  claim.user = user.id
  claim.userAddress = userAddress
  claim.tokenId = tokenId
  claim.amount = toDecimal(amount)
  claim.isBurnReward = false
  claim.transactionHash = event.transaction.hash
  claim.timestamp = event.block.timestamp
  claim.blockNumber = event.block.number
  claim.logIndex = event.logIndex
  claim.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.rewardsClaimed = dailyStat.rewardsClaimed.plus(toDecimal(amount))
  dailyStat.save()
}

export function handleBurned(event: BurnedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user

  // Check if NFT was previously staked
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const existingStake = Stake.load(stakeId)
  const wasStaked = existingStake !== null && existingStake.status == 'STAKED'

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalBurned = globalStats.totalBurned.plus(BigInt.fromI32(1))
  if (wasStaked) {
    globalStats.totalStaked = globalStats.totalStaked.minus(BigInt.fromI32(1))
  }
  globalStats.save()

  // Update contract stats
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalBurned = contract.totalBurned.plus(BigInt.fromI32(1))
  if (wasStaked) {
    contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(1))
  }
  contract.save()

  // Update user stats
  const user = getOrCreateUser(userAddress)
  user.totalBurned = user.totalBurned.plus(BigInt.fromI32(1))
  if (wasStaked) {
    user.totalStaked = user.totalStaked.minus(BigInt.fromI32(1))
  }
  user.save()

  // Update or create stake
  let stake = Stake.load(stakeId)
  if (stake === null) {
    // Burning directly without staking
    stake = new Stake(stakeId)
    stake.contract = contract.id
    stake.tokenId = tokenId
    stake.owner = user.id
    stake.ownerAddress = userAddress
    stake.stakedAt = BigInt.fromI32(0)
    stake.lastClaimAt = BigInt.fromI32(0)
    stake.totalStakingRewardsClaimed = BigDecimal.zero()
    stake.totalBurnRewardsClaimed = BigDecimal.zero()
  }
  stake.burned = true
  stake.burnedAt = event.block.timestamp
  stake.lastBurnClaimAt = BigInt.fromI32(0)
  stake.status = 'BURNED'
  stake.save()

  // Create stake event
  const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const stakeEventEntity = new StakeEvent(stakeEventId)
  stakeEventEntity.stake = stake.id
  stakeEventEntity.type = 'BURN'
  stakeEventEntity.user = user.id
  stakeEventEntity.userAddress = userAddress
  stakeEventEntity.tokenId = tokenId
  stakeEventEntity.transactionHash = event.transaction.hash
  stakeEventEntity.timestamp = event.block.timestamp
  stakeEventEntity.blockNumber = event.block.number
  stakeEventEntity.logIndex = event.logIndex
  stakeEventEntity.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newBurns = dailyStat.newBurns.plus(BigInt.fromI32(1))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleBurnRewardClaimed(event: BurnRewardClaimedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user
  const amount = event.params.amount

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalBurnRewardsClaimed = globalStats.totalBurnRewardsClaimed.plus(toDecimal(amount))
  globalStats.totalAllRewardsClaimed = globalStats.totalAllRewardsClaimed.plus(toDecimal(amount))
  globalStats.save()

  // Update contract stats
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalBurnRewardsClaimed = contract.totalBurnRewardsClaimed.plus(toDecimal(amount))
  contract.save()

  // Update user stats
  const user = getOrCreateUser(userAddress)
  user.totalBurnRewardsClaimed = user.totalBurnRewardsClaimed.plus(toDecimal(amount))
  user.save()

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.totalBurnRewardsClaimed = stake.totalBurnRewardsClaimed.plus(toDecimal(amount))
    stake.lastBurnClaimAt = event.block.timestamp
    stake.save()
  }

  // Create reward claim
  const claimId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const claim = new RewardClaim(claimId)
  claim.stake = stakeId
  claim.user = user.id
  claim.userAddress = userAddress
  claim.tokenId = tokenId
  claim.amount = toDecimal(amount)
  claim.isBurnReward = true
  claim.transactionHash = event.transaction.hash
  claim.timestamp = event.block.timestamp
  claim.blockNumber = event.block.number
  claim.logIndex = event.logIndex
  claim.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.burnRewardsClaimed = dailyStat.burnRewardsClaimed.plus(toDecimal(amount))
  dailyStat.save()
}

export function handleParametersUpdated(event: ParametersUpdatedEvent): void {
  const contractAddress = event.address
  const rewardRatePerSecond = event.params.rewardRatePerSecond
  const burnBonusBps = event.params.burnBonusBps

  // Update contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.rewardRatePerSecond = rewardRatePerSecond
  contract.burnBonusBps = burnBonusBps

  // Create parameter epoch
  const epochIndex = contract.epochCount
  const epochId = contractAddress.toHexString() + '-' + epochIndex.toString()
  const epoch = new ParameterEpoch(epochId)
  epoch.contract = contract.id
  epoch.startTime = event.block.timestamp
  epoch.rewardRatePerSecond = rewardRatePerSecond
  epoch.burnBonusBps = burnBonusBps
  epoch.epochIndex = epochIndex
  epoch.save()

  contract.epochCount = contract.epochCount.plus(BigInt.fromI32(1))
  contract.save()
}

export function handleBatchStaked(event: BatchStakedEvent): void {
  const contractAddress = event.address
  const tokenIds = event.params.tokenIds
  const userAddress = event.params.user
  const recipient = event.params.recipient

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStaked = globalStats.totalStaked.plus(BigInt.fromI32(tokenIds.length))
  globalStats.save()

  // Get or create staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.plus(BigInt.fromI32(tokenIds.length))
  contract.save()

  // Get or create user
  const user = getOrCreateUser(userAddress)
  user.totalStaked = user.totalStaked.plus(BigInt.fromI32(tokenIds.length))
  user.save()

  // Create stakes for each token
  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i]
    const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
    let stake = new Stake(stakeId)
    stake.contract = contract.id
    stake.tokenId = tokenId
    stake.owner = user.id
    stake.ownerAddress = userAddress
    stake.payoutRecipient = recipient
    stake.stakedAt = event.block.timestamp
    stake.lastClaimAt = event.block.timestamp
    stake.burned = false
    stake.burnedAt = null
    stake.lastBurnClaimAt = null
    stake.totalStakingRewardsClaimed = BigDecimal.zero()
    stake.totalBurnRewardsClaimed = BigDecimal.zero()
    stake.status = 'STAKED'
    stake.save()

    // Create stake event
    const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + '-' + i.toString()
    const stakeEventEntity = new StakeEvent(stakeEventId)
    stakeEventEntity.stake = stake.id
    stakeEventEntity.type = 'STAKE'
    stakeEventEntity.user = user.id
    stakeEventEntity.userAddress = userAddress
    stakeEventEntity.tokenId = tokenId
    stakeEventEntity.transactionHash = event.transaction.hash
    stakeEventEntity.timestamp = event.block.timestamp
    stakeEventEntity.blockNumber = event.block.number
    stakeEventEntity.logIndex = event.logIndex
    stakeEventEntity.save()
  }

  // Create batch operation record
  const batchOpId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const batchOp = new BatchOperation(batchOpId)
  batchOp.type = 'BATCH_STAKE'
  batchOp.user = user.id
  batchOp.userAddress = userAddress
  batchOp.tokenIds = tokenIds
  batchOp.recipient = recipient
  batchOp.transactionHash = event.transaction.hash
  batchOp.timestamp = event.block.timestamp
  batchOp.blockNumber = event.block.number
  batchOp.logIndex = event.logIndex
  batchOp.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newStakes = dailyStat.newStakes.plus(BigInt.fromI32(tokenIds.length))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleBatchClaimed(event: BatchClaimedEvent): void {
  const contractAddress = event.address
  const tokenIds = event.params.tokenIds
  const userAddress = event.params.user

  // Get user
  const user = getOrCreateUser(userAddress)

  // Note: The BatchClaimed event doesn't emit individual amounts,
  // so we rely on individual RewardClaimed/BurnRewardClaimed events
  // for tracking actual amounts. This handler just records the batch operation.

  // Create batch operation record
  const batchOpId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const batchOp = new BatchOperation(batchOpId)
  batchOp.type = 'BATCH_CLAIM'
  batchOp.user = user.id
  batchOp.userAddress = userAddress
  batchOp.tokenIds = tokenIds
  batchOp.recipient = null
  batchOp.transactionHash = event.transaction.hash
  batchOp.timestamp = event.block.timestamp
  batchOp.blockNumber = event.block.number
  batchOp.logIndex = event.logIndex
  batchOp.save()
}

export function handleBatchUnstaked(event: BatchUnstakedEvent): void {
  const contractAddress = event.address
  const tokenIds = event.params.tokenIds
  const userAddress = event.params.user
  const tokenReceiver = event.params.tokenReceiver

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalStaked = globalStats.totalStaked.minus(BigInt.fromI32(tokenIds.length))
  globalStats.save()

  // Update staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(tokenIds.length))
  contract.save()

  // Update user
  const user = getOrCreateUser(userAddress)
  user.totalStaked = user.totalStaked.minus(BigInt.fromI32(tokenIds.length))
  user.save()

  // Update stakes
  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i]
    const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
    const stake = Stake.load(stakeId)
    if (stake !== null) {
      stake.status = 'UNSTAKED'
      stake.save()
    }

    // Create stake event
    const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + '-' + i.toString()
    const stakeEventEntity = new StakeEvent(stakeEventId)
    stakeEventEntity.stake = stakeId
    stakeEventEntity.type = 'UNSTAKE'
    stakeEventEntity.user = user.id
    stakeEventEntity.userAddress = userAddress
    stakeEventEntity.tokenId = tokenId
    stakeEventEntity.transactionHash = event.transaction.hash
    stakeEventEntity.timestamp = event.block.timestamp
    stakeEventEntity.blockNumber = event.block.number
    stakeEventEntity.logIndex = event.logIndex
    stakeEventEntity.save()
  }

  // Create batch operation record
  const batchOpId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const batchOp = new BatchOperation(batchOpId)
  batchOp.type = 'BATCH_UNSTAKE'
  batchOp.user = user.id
  batchOp.userAddress = userAddress
  batchOp.tokenIds = tokenIds
  batchOp.recipient = tokenReceiver
  batchOp.transactionHash = event.transaction.hash
  batchOp.timestamp = event.block.timestamp
  batchOp.blockNumber = event.block.number
  batchOp.logIndex = event.logIndex
  batchOp.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newUnstakes = dailyStat.newUnstakes.plus(BigInt.fromI32(tokenIds.length))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handleBatchBurned(event: BatchBurnedEvent): void {
  const contractAddress = event.address
  const tokenIds = event.params.tokenIds
  const userAddress = event.params.user
  const recipient = event.params.recipient

  // Update global stats
  const globalStats = getOrCreateGlobalStats()
  globalStats.totalBurned = globalStats.totalBurned.plus(BigInt.fromI32(tokenIds.length))
  globalStats.save()

  // Update contract stats
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalBurned = contract.totalBurned.plus(BigInt.fromI32(tokenIds.length))
  contract.save()

  // Update user stats
  const user = getOrCreateUser(userAddress)
  user.totalBurned = user.totalBurned.plus(BigInt.fromI32(tokenIds.length))
  user.save()

  // Process each burned token
  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i]
    const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
    let stake = Stake.load(stakeId)
    const wasStaked = stake !== null && stake.status == 'STAKED'

    // If was staked, decrement staked counts
    if (wasStaked) {
      globalStats.totalStaked = globalStats.totalStaked.minus(BigInt.fromI32(1))
      contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(1))
      user.totalStaked = user.totalStaked.minus(BigInt.fromI32(1))
    }

    // Update or create stake
    if (stake === null) {
      // Burning directly without staking
      stake = new Stake(stakeId)
      stake.contract = contract.id
      stake.tokenId = tokenId
      stake.owner = user.id
      stake.ownerAddress = userAddress
      stake.stakedAt = BigInt.fromI32(0)
      stake.lastClaimAt = BigInt.fromI32(0)
      stake.totalStakingRewardsClaimed = BigDecimal.zero()
      stake.totalBurnRewardsClaimed = BigDecimal.zero()
    }
    stake.burned = true
    stake.burnedAt = event.block.timestamp
    stake.lastBurnClaimAt = BigInt.fromI32(0)
    stake.payoutRecipient = recipient
    stake.status = 'BURNED'
    stake.save()

    // Create stake event
    const stakeEventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + '-' + i.toString()
    const stakeEventEntity = new StakeEvent(stakeEventId)
    stakeEventEntity.stake = stake.id
    stakeEventEntity.type = 'BURN'
    stakeEventEntity.user = user.id
    stakeEventEntity.userAddress = userAddress
    stakeEventEntity.tokenId = tokenId
    stakeEventEntity.transactionHash = event.transaction.hash
    stakeEventEntity.timestamp = event.block.timestamp
    stakeEventEntity.blockNumber = event.block.number
    stakeEventEntity.logIndex = event.logIndex
    stakeEventEntity.save()
  }

  // Save updated stats
  globalStats.save()
  contract.save()
  user.save()

  // Create batch operation record
  const batchOpId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const batchOp = new BatchOperation(batchOpId)
  batchOp.type = 'BATCH_BURN'
  batchOp.user = user.id
  batchOp.userAddress = userAddress
  batchOp.tokenIds = tokenIds
  batchOp.recipient = recipient
  batchOp.transactionHash = event.transaction.hash
  batchOp.timestamp = event.block.timestamp
  batchOp.blockNumber = event.block.number
  batchOp.logIndex = event.logIndex
  batchOp.save()

  // Update daily stats
  const dailyStat = getOrCreateDailyStat(contractAddress, event.block.timestamp)
  dailyStat.newBurns = dailyStat.newBurns.plus(BigInt.fromI32(tokenIds.length))
  dailyStat.totalStaked = contract.totalStaked
  dailyStat.totalBurned = contract.totalBurned
  dailyStat.save()
}

export function handlePayoutRecipientSet(event: PayoutRecipientSetEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const owner = event.params.owner
  const recipient = event.params.recipient

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.payoutRecipient = recipient
    stake.save()
  }

  // Create payout recipient update record
  const updateId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const update = new PayoutRecipientUpdate(updateId)
  update.stake = stakeId
  update.tokenId = tokenId
  update.owner = owner
  update.recipient = recipient
  update.transactionHash = event.transaction.hash
  update.timestamp = event.block.timestamp
  update.blockNumber = event.block.number
  update.logIndex = event.logIndex
  update.save()
}
