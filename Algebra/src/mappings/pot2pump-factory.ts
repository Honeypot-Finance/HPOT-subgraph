import { ERC20 } from '../types/Factory/ERC20'
import { PairCreated, Pot2PumpFactory } from '../types/Factory/Pot2PumpFactory'
import { Participant, Pot2Pump, Token } from '../types/schema'
import { Pot2Pump as Pot2PumpTemplate, Token as TokenTemplate } from '../types/templates'
import { BigInt } from '@graphprotocol/graph-ts'
import { fetchCreator, fetchEndTime, fetchLaunchTokenAmount, fetchMinCap } from '../utils/pot2pump'
import { loadToken } from '../utils/token'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../utils/constants'
import { loadAccount } from '../utils/account'

export function handlePairCreated(event: PairCreated): void {
  let newPair = Pot2Pump.load(event.params.pair.toHexString())
  let creatorAccount = loadAccount(fetchCreator(event.params.pair))
  let raisedToken = loadToken(event.params.raisedToken)
  let launchToken = loadToken(event.params.launchedToken)

  // Update the if launch is meme token and register it to ERC20 listener
  TokenTemplate.create(event.params.launchedToken)

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
    newPair.LaunchTokenMCAPUSD = ZERO_BD
    newPair.LaunchTokenTVLUSD = ZERO_BD
    newPair.launchTokenInitialPrice = ZERO_BD
    newPair.buyCount = ZERO_BI
    newPair.sellCount = ZERO_BI
    newPair.depositRaisedTokenPercentageToMinCap = ZERO_BD
    newPair.creator = fetchCreator(event.params.pair).toHexString()
    //increase account creation count
    if (creatorAccount != null) {
      creatorAccount.pot2PumpLaunchCount = creatorAccount.pot2PumpLaunchCount.plus(ONE_BI)
      creatorAccount.platformTxCount = creatorAccount.platformTxCount.plus(ONE_BI)
      creatorAccount.save()
    }

    //update deployer participant info
    if (creatorAccount != null) {
      let deployerParticipantId = newPair.id + '-' + creatorAccount.id
      let deployerParticipant = Participant.load(deployerParticipantId)
      if (deployerParticipant == null) {
        deployerParticipant = new Participant(deployerParticipantId)
        deployerParticipant.id = deployerParticipantId
        deployerParticipant.pot2Pump = newPair.id
        deployerParticipant.account = creatorAccount.id
        deployerParticipant.amount = ZERO_BI
        deployerParticipant.totalRefundAmount = ZERO_BI
        deployerParticipant.totalclaimLqAmount = ZERO_BI
        deployerParticipant.claimed = false
        deployerParticipant.refunded = true
        deployerParticipant.createdAt = event.block.timestamp

        newPair.participantsCount = newPair.participantsCount.plus(ONE_BI)

        creatorAccount.participateCount = creatorAccount.participateCount.plus(ONE_BI)
        creatorAccount.platformTxCount = creatorAccount.platformTxCount.plus(ONE_BI)

        deployerParticipant.save()
      }
    }

    Pot2PumpTemplate.create(event.params.pair)
  }

  newPair.searchString =
    newPair.id.toLowerCase() + ' ' + launchToken.symbol.toLowerCase() + ' ' + newPair.raisedToken.toLowerCase()

  launchToken.save()
  newPair.save()
}
