import { ERC20 } from '../types/Factory/ERC20'
import { PairCreated, Pot2PumpFactory } from '../types/Factory/Pot2PumpFactory'
import { Pot2Pump, Token } from '../types/schema'
import { Pot2Pump as Pot2PumpTemplate, Token as TokenTemplate } from '../types/templates'
import { BigInt } from '@graphprotocol/graph-ts'
import { fetchCreator, fetchEndTime, fetchLaunchTokenAmount, fetchMinCap } from '../utils/pot2pump'
import { loadToken } from '../utils/token'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../utils/constants'
import { loadAccount } from '../utils/account'

export function handlePairCreated(event: PairCreated): void {
  let newPair = Pot2Pump.load(event.params.pair.toHexString())

  if (newPair == null) {
    newPair = new Pot2Pump(event.params.pair.toHexString())
    newPair.state = new BigInt(3)

    newPair.launchToken = event.params.launchedToken.toHexString()
    newPair.raisedToken = event.params.raisedToken.toHexString()

    newPair.createdAt = event.block.timestamp
    newPair.endTime = fetchEndTime(event.params.pair)
    newPair.DepositLaunchToken = fetchLaunchTokenAmount(event.params.pair)
    newPair.DepositRaisedToken = ZERO_BI
    newPair.totalRefundAmount = new BigInt(0)
    newPair.totalClaimLpAmount = new BigInt(0)
    newPair.participantsCount = ZERO_BI
    newPair.raisedTokenMinCap = fetchMinCap(event.params.pair)
    newPair.raisedTokenReachingMinCap = false
    newPair.LaunchTokenMarketCap = ZERO_BD
    newPair.LaunchTokenTVL = ZERO_BD
    newPair.creator = fetchCreator(event.params.pair).toHexString()

    //increase account creation count
    let account = loadAccount(fetchCreator(event.params.pair).toHexString())
    if (account != null) {
      account.pot2PumpLaunchCount = account.pot2PumpLaunchCount.plus(ONE_BI)
      account.save()
    }

    Pot2PumpTemplate.create(event.params.pair)
    newPair.save()
  }

  // Update the if launch is meme token and register it to ERC20 listener
  let launchToken = Token.load(event.params.launchedToken.toHexString())
  if (launchToken == null) {
    launchToken = loadToken(event.params.launchedToken)
    TokenTemplate.create(event.params.launchedToken)
  }

  launchToken.save()
}
