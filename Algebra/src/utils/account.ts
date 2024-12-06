import { bigInt } from "@graphprotocol/graph-ts"
import { Account } from "../types/schema"
import { ZERO_BD, ZERO_BI } from "./constants"

export const initAccount = (account: string): Account =>{
    const loadedAccount = Account.load(account)
    if (loadedAccount !== null) {
        return loadedAccount
    }

    const newAcc = new Account(account)

    newAcc.id = account
    newAcc.memeTokenHoldingCount = ZERO_BI
    newAcc.pot2PumpLaunchCount = ZERO_BI
    newAcc.participateCount = ZERO_BI
    newAcc.swapCount = ZERO_BI
    newAcc.holdingPoolCount = ZERO_BI
    newAcc.totalEarningUSDDay = ZERO_BD
    newAcc.totalEarningPercentageDay = ZERO_BD
    newAcc.totalEarningUSDWeek = ZERO_BD
    newAcc.totalEarningPercentageWeek = ZERO_BD
    newAcc.totalEarningUSDMonth = ZERO_BD
    newAcc.totalEarningPercentageMonth = ZERO_BD
    newAcc.totalEarningUSDYear = ZERO_BD
    newAcc.totalEarningPercentageYear = ZERO_BD
    newAcc.accountBalanceUSD = ZERO_BD
    newAcc.accountBalanceUSDDay = ZERO_BD
    newAcc.accountBalanceUSDWeek = ZERO_BD
    newAcc.accountBalanceUSDMonth = ZERO_BD
    newAcc.accountBalanceUSDYear = ZERO_BD


    newAcc.save()
    return newAcc
}