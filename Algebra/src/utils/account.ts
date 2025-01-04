import { Address, BigDecimal, BigInt, bigInt, store } from '@graphprotocol/graph-ts'
import { ADDRESS_ZERO, FACTORY_ADDRESS, HUNDRED_BD, ONE_BI, ZERO_BD, ZERO_BI } from './constants'
import { Account, Factory } from '../types/schema'

export const createAccount = (account: Address): Account => {
  const factory = Factory.load(FACTORY_ADDRESS)!
  const loadedAccount = Account.load(account.toHexString())
  if (loadedAccount) {
    return loadedAccount
  }

  const newAcc = new Account(account.toHexString())

  newAcc.id = account.toHexString()
  newAcc.memeTokenHoldingCount = ZERO_BI
  newAcc.pot2PumpLaunchCount = ZERO_BI
  newAcc.platformTxCount = ZERO_BI
  newAcc.participateCount = ZERO_BI
  newAcc.swapCount = ZERO_BI
  newAcc.holdingPoolCount = ZERO_BI
  newAcc.totalSpendUSD = ZERO_BD

  newAcc.save()
  factory.accountCount = factory.accountCount.plus(ONE_BI)
  factory.save()

  return newAcc
}

export const loadAccount = (account: Address): Account | null => {
  if (account.toHexString() === ADDRESS_ZERO) {
    return null
  }
  const loadedAccount = Account.load(account.toHexString())
  if (loadedAccount) {
    return loadedAccount
  } else {
    return createAccount(account)
  }
}
