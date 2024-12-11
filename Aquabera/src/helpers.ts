import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'

import { IchiVault, User, VaultShare } from './types/schema'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const ZERO_BD = BigDecimal.fromString('0')
export const ONE_BD = BigDecimal.fromString('1')
export const BI_18 = BigInt.fromI32(18)

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

// TODO: these functions should really be named getVaultShare as it creates and returns VaultShare if it doesn't exist
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
      throw new Error("IchiVault must exist in subgraph db");
    }

    vaultShare = new VaultShare(id)
    vaultShare.vaultShareBalance = ZERO_BD
    vaultShare.vault = vault.toHexString()
    vaultShare.user = user.toHexString()
    vaultShare.save()
  }
  return vaultShare
}

export function createUser(address: Address): void {
  let user = User.load(address.toHexString())
  if (user === null) {
    user = new User(address.toHexString())
    user.save()
  }
}
