import { Address } from '@graphprotocol/graph-ts'
import { VaultShare, IchiVault } from '../types/schema'
import { ZERO_BD } from './constants'

// otherwise returns an existing VaultShare
export function createVaultShare(vault: Address, user: Address): VaultShare {
  const id = vault
    .toHexString()
    .concat('-')
    .concat(user.toHexString())
  let vaultShare = VaultShare.load(id)
  if (vaultShare === null) {
    const ichiVault = IchiVault.load(vault.toHexString())

    if (ichiVault === null) {
      throw new Error('IchiVault must exist in subgraph db')
    }

    vaultShare = new VaultShare(id)
    vaultShare.vaultShareBalance = ZERO_BD
    vaultShare.vault = vault.toHexString()
    vaultShare.user = user.toHexString()
    vaultShare.save()
  }
  return vaultShare
}
