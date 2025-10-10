import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  Staked as StakedEvent,
  Unstaked as UnstakedEvent,
  RewardClaimed as RewardClaimedEvent,
  Burned as BurnedEvent,
  BurnRewardClaimed as BurnRewardClaimedEvent,
  ParametersUpdated as ParametersUpdatedEvent
} from '../types/NFTStaking/NFTStaking'
import {
  StakingContract,
  Stake,
  User,
  StakeEvent,
  RewardClaim,
  ParameterEpoch,
  DailyStat,
  NFT
} from '../types/schema'
import { getOrCreateStakingContract, getOrCreateUser, getOrCreateDailyStat, toDecimal } from '../utils/helpers'

export function handleStaked(event: StakedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user

  // Get or create staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.plus(BigInt.fromI32(1))
  contract.save()

  // Get or create user
  const user = getOrCreateUser(userAddress)
  user.totalStaked = user.totalStaked.plus(BigInt.fromI32(1))
  // When staking, decrease owned count (NFT moves from wallet to staking contract)
  if (user.totalOwned.gt(BigInt.fromI32(0))) {
    user.totalOwned = user.totalOwned.minus(BigInt.fromI32(1))
  }
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
  stake.totalRewardsClaimed = BigDecimal.zero()
  stake.totalBurnRewardsClaimed = BigDecimal.zero()
  stake.status = 'STAKED'
  stake.save()

  // Update NFT entity to mark as staked
  const nftId = contract.nft.toHexString() + '-' + tokenId.toString()
  let nft = NFT.load(nftId)
  if (nft !== null) {
    nft.isStaked = true
    nft.save()
  }

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

export function handleUnstaked(event: UnstakedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user

  // Update staking contract
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(1))
  contract.save()

  // Update user
  const user = getOrCreateUser(userAddress)
  user.totalStaked = user.totalStaked.minus(BigInt.fromI32(1))
  // When unstaking, increase owned count (NFT returns to wallet)
  user.totalOwned = user.totalOwned.plus(BigInt.fromI32(1))
  user.save()

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.status = 'UNSTAKED'
    stake.save()
  }

  // Update NFT entity to mark as not staked
  const nftId = contract.nft.toHexString() + '-' + tokenId.toString()
  let nft = NFT.load(nftId)
  if (nft !== null) {
    nft.isStaked = false
    nft.save()
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

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const userAddress = event.params.user
  const amount = event.params.amount

  // Update contract stats
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalRewardsClaimed = contract.totalRewardsClaimed.plus(toDecimal(amount))
  contract.save()

  // Update user stats
  const user = getOrCreateUser(userAddress)
  user.totalRewardsClaimed = user.totalRewardsClaimed.plus(toDecimal(amount))
  user.save()

  // Update stake
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const stake = Stake.load(stakeId)
  if (stake !== null) {
    stake.totalRewardsClaimed = stake.totalRewardsClaimed.plus(toDecimal(amount))
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

  // Update contract stats
  const contract = getOrCreateStakingContract(contractAddress)
  contract.totalBurned = contract.totalBurned.plus(BigInt.fromI32(1))
  // If it was previously staked, decrease staked count
  const stakeId = contractAddress.toHexString() + '-' + tokenId.toString()
  const existingStake = Stake.load(stakeId)
  if (existingStake !== null && existingStake.status == 'STAKED') {
    contract.totalStaked = contract.totalStaked.minus(BigInt.fromI32(1))
  }
  contract.save()

  // Update user stats
  const user = getOrCreateUser(userAddress)
  user.totalBurned = user.totalBurned.plus(BigInt.fromI32(1))
  if (existingStake !== null && existingStake.status == 'STAKED') {
    user.totalStaked = user.totalStaked.minus(BigInt.fromI32(1))
    // If burning a staked NFT, decrease owned count
    if (user.totalOwned.gt(BigInt.fromI32(0))) {
      user.totalOwned = user.totalOwned.minus(BigInt.fromI32(1))
    }
  } else {
    // If burning directly (not staked), decrease owned count
    if (user.totalOwned.gt(BigInt.fromI32(0))) {
      user.totalOwned = user.totalOwned.minus(BigInt.fromI32(1))
    }
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
    stake.totalRewardsClaimed = BigDecimal.zero()
    stake.totalBurnRewardsClaimed = BigDecimal.zero()
  }
  stake.burned = true
  stake.burnedAt = event.block.timestamp
  stake.lastBurnClaimAt = BigInt.fromI32(0)
  stake.status = 'BURNED'
  stake.save()

  // Update NFT entity to mark as burned and not staked
  const nftId = contract.nft.toHexString() + '-' + tokenId.toString()
  let nft = NFT.load(nftId)
  if (nft !== null) {
    nft.isStaked = false
    nft.isBurned = true
    nft.save()
  }

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
