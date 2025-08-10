import { ICHIVaultCreated } from './../types/ICHIVaultFactory/ICHIVaultFactory'
import { IchiVault, Pool } from '../types/schema'
import { ICHIVault as Vault } from '../types/templates'
import { fetchAlgebraPoolAddress } from '../utils/aquabera'
import { ZERO_BD, ZERO_BI } from '../utils/constants'
import { loadToken } from '../utils/token'
import { loadAccount } from '../utils/account'

export function handleICHIVaultCreated(event: ICHIVaultCreated): void {
  const ichiVault = new IchiVault(event.params.ichiVault.toHexString())
  const tokenA = loadToken(event.params.tokenA)
  const tokenB = loadToken(event.params.tokenB)
  const senderAccount = loadAccount(event.params.sender)
  const fromAccount = loadAccount(event.transaction.from)
  ichiVault.sender = event.params.sender
  ichiVault.tokenA = event.params.tokenA
  ichiVault.allowTokenA = event.params.allowTokenA
  ichiVault.tokenB = event.params.tokenB
  ichiVault.allowTokenB = event.params.allowTokenB
  ichiVault.count = event.params.count
  ichiVault.createdAtTimestamp = event.block.timestamp
  ichiVault.holdersCount = 0
  ichiVault.totalAmount0 = ZERO_BI
  ichiVault.totalAmount1 = ZERO_BI
  ichiVault.totalSupply = ZERO_BI
  ichiVault.lastPrice = ZERO_BD
  ichiVault.lastPriceTimestamp = ZERO_BI
  ichiVault.lastFeeUpdate = event.block.timestamp
  ichiVault.feePerSecond0_1d = ZERO_BI
  ichiVault.feePerSecond1_1d = ZERO_BI
  ichiVault.feePerSecond0_3d = ZERO_BI
  ichiVault.feePerSecond1_3d = ZERO_BI
  ichiVault.feePerSecond0_7d = ZERO_BI
  ichiVault.feePerSecond1_7d = ZERO_BI
  ichiVault.feePerSecond0_30d = ZERO_BI
  ichiVault.feePerSecond1_30d = ZERO_BI
  ichiVault.feeApr_1d = ZERO_BD
  ichiVault.feeApr_3d = ZERO_BD
  ichiVault.feeApr_7d = ZERO_BD
  ichiVault.feeApr_30d = ZERO_BD
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
