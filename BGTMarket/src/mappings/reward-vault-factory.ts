import { VaultCreated as VaultCreatedEvent } from '../types/reward-vault-factory/RewardVaultFactory'
import { RewardVault, Token } from '../types/schema'
import { ERC20 } from '../types/reward-vault-factory/ERC20'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleVaultCreatedRewardVaultFactory(event: VaultCreatedEvent): void {
  // Create Token entity for the staking token if it doesn't exist
  let stakingToken = Token.load(event.params.stakingToken.toHexString())
  if (!stakingToken) {
    stakingToken = new Token(event.params.stakingToken.toHexString())

    // Load token contract to get metadata
    let tokenContract = ERC20.bind(event.params.stakingToken)

    // Get token metadata
    let tokenSymbol = tokenContract.try_symbol()
    let tokenName = tokenContract.try_name()
    let tokenDecimals = tokenContract.try_decimals()
    let tokenTotalSupply = tokenContract.try_totalSupply()

    stakingToken.symbol = tokenSymbol.reverted ? '' : tokenSymbol.value
    stakingToken.name = tokenName.reverted ? '' : tokenName.value
    stakingToken.decimals = tokenDecimals.reverted ? BigInt.fromI32(18) : BigInt.fromI32(tokenDecimals.value)
    stakingToken.totalSupply = tokenTotalSupply.reverted ? BigInt.fromI32(0) : tokenTotalSupply.value

    stakingToken.save()
  }

  // Create RewardVault entity
  let vault = new RewardVault(event.params.vault.toHexString())
  vault.vaultAddress = event.params.vault.toHexString()
  vault.stakingToken = stakingToken.id
  vault.save()
}
