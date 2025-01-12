import { ICHIVaultCreated } from './../types/ICHIVaultFactory/ICHIVaultFactory'
import { IchiVault, Pool } from '../types/schema'
import { Vault } from '../types/templates'
import { fetchAlgebraPoolAddress } from '../utils/aquabera'
import { ZERO_BD, ZERO_BI } from '../utils/constants'
import { loadToken } from '../utils/token'

export function handleICHIVaultCreated(event: ICHIVaultCreated): void {
  const ichiVault = new IchiVault(event.params.ichiVault.toHexString())
  const tokenA = loadToken(event.params.tokenA)
  const tokenB = loadToken(event.params.tokenB)
  ichiVault.sender = event.params.sender
  ichiVault.tokenA = event.params.tokenA
  ichiVault.allowTokenA = event.params.allowTokenA
  ichiVault.tokenB = event.params.tokenB
  ichiVault.allowTokenB = event.params.allowTokenB
  ichiVault.count = event.params.count
  ichiVault.createdAtTimestamp = event.block.timestamp
  ichiVault.holdersCount = 0
  ichiVault.pool = fetchAlgebraPoolAddress(event.params.ichiVault).toHexString()
  ichiVault.totalShares = ZERO_BD
  ichiVault.searchString = event.params.ichiVault
    .toHexString()
    .concat(tokenA.id)
    .concat(tokenB.id)
    .concat(tokenA.symbol)
    .concat(tokenB.symbol)
  ichiVault.save()
  Vault.create(event.params.ichiVault)
}
