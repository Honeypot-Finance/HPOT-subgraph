import { Address, BigDecimal, BigInt, bigInt, store } from '@graphprotocol/graph-ts'
import { ADDRESS_ZERO, FACTORY_ADDRESS, HUNDRED_BD, ONE_BI, ZERO_BD, ZERO_BI } from './constants'
import { Account } from '../types/schema'

export const createAccount = (account: Address): Account => {
  const loadedAccount = Account.load(account.toHexString())
  if (loadedAccount) {
    return loadedAccount
  }

  const newAcc = new Account(account.toHexString())

  newAcc.id = account.toHexString()

  newAcc.save()

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
