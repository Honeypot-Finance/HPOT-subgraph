import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { NFTStaking } from '../types/NFTStaking/NFTStaking'
import { StakingContract, User, DailyStat } from '../types/schema'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const SECONDS_PER_DAY = BigInt.fromI32(86400)

export function getOrCreateStakingContract(contractAddress: Address): StakingContract {
  let contract = StakingContract.load(contractAddress.toHexString())

  if (contract === null) {
    contract = new StakingContract(contractAddress.toHexString())

    // Fetch contract data
    const stakingContract = NFTStaking.bind(contractAddress)
    const nftResult = stakingContract.try_nft()
    const rewardsResult = stakingContract.try_rewards()
    const rateResult = stakingContract.try_rewardRatePerSecond()
    const bonusResult = stakingContract.try_burnBonusBps()

    contract.nft = nftResult.reverted ? Address.fromString(ZERO_ADDRESS) : nftResult.value
    contract.rewardsToken = rewardsResult.reverted ? Address.fromString(ZERO_ADDRESS) : rewardsResult.value
    contract.rewardRatePerSecond = rateResult.reverted ? BigInt.fromI32(0) : rateResult.value
    contract.burnBonusBps = bonusResult.reverted ? BigInt.fromI32(0) : bonusResult.value
    contract.totalStaked = BigInt.fromI32(0)
    contract.totalBurned = BigInt.fromI32(0)
    contract.totalRewardsClaimed = BigDecimal.zero()
    contract.totalBurnRewardsClaimed = BigDecimal.zero()
    contract.epochCount = BigInt.fromI32(0)
    contract.save()
  }

  return contract
}

export function getOrCreateUser(userAddress: Address): User {
  let user = User.load(userAddress.toHexString())

  if (user === null) {
    user = new User(userAddress.toHexString())
    user.totalStaked = BigInt.fromI32(0)
    user.totalBurned = BigInt.fromI32(0)
    user.totalRewardsClaimed = BigDecimal.zero()
    user.totalBurnRewardsClaimed = BigDecimal.zero()
    user.totalOwned = BigInt.fromI32(0)
    user.save()
  }

  return user
}

export function getOrCreateDailyStat(contractAddress: Address, timestamp: BigInt): DailyStat {
  const dayId = timestamp.div(SECONDS_PER_DAY)
  const dailyStatId = contractAddress.toHexString() + '-' + dayId.toString()

  let dailyStat = DailyStat.load(dailyStatId)

  if (dailyStat === null) {
    dailyStat = new DailyStat(dailyStatId)
    dailyStat.dayId = dayId
    dailyStat.date = dayId.times(SECONDS_PER_DAY)
    dailyStat.contract = contractAddress
    dailyStat.totalStaked = BigInt.fromI32(0)
    dailyStat.totalBurned = BigInt.fromI32(0)
    dailyStat.newStakes = BigInt.fromI32(0)
    dailyStat.newUnstakes = BigInt.fromI32(0)
    dailyStat.newBurns = BigInt.fromI32(0)
    dailyStat.rewardsClaimed = BigDecimal.zero()
    dailyStat.burnRewardsClaimed = BigDecimal.zero()
    dailyStat.save()
  }

  return dailyStat
}

export function toDecimal(value: BigInt, decimals: i32 = 18): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(decimals as u8)
    .toBigDecimal()

  return value.toBigDecimal().div(precision)
}
