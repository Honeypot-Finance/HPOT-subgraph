import {
  Participant,
  ParticipantTransactionHistory,
  Pot2Pump,
  DepositRaisedToken,
  Transaction,
  Refund,
  ClaimLp
} from '../types/schema'
import { Pot2Pump as Pot2PumpTemplate } from '../types/templates'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import {
  ClaimLP as TClaimLP,
  DepositRaisedToken as TDepositRaisedToken,
  Perform,
  Refund as TRefund
} from '../types/templates/Pot2Pump/Pot2PumpPair'
import { fetchState } from '../utils/pot2pump'
import { loadAccount } from '../utils/account'
import { ONE_BI, ZERO_BI } from '../utils/constants'
import { ADDRESS_ZERO } from '../utils/constants'

export function handleDepositRaisedToken(event: TDepositRaisedToken): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }

  //update participant info
  let participantId = pair.id + '-' + event.params.depositor.toHexString()

  let participant = Participant.load(participantId)

  if (participant == null) {
    participant = new Participant(participantId)
    participant.id = participantId
    participant.pot2Pump = pair.id
    participant.account = event.params.depositor.toHexString()
    participant.amount = ZERO_BI
    participant.totalRefundAmount = ZERO_BI
    participant.totalclaimLqAmount = ZERO_BI
    participant.canClaim = false
    participant.createdAt = event.block.timestamp

    pair.participantsCount = pair.participantsCount.plus(ONE_BI)

    let account = loadAccount(event.params.depositor.toHexString())
    if (account != null) {
      account.participateCount = account.participateCount.plus(ONE_BI)
      account.save()
    }
  }
  participant.amount = participant.amount.plus(event.params.depositAmount)

  // update all participants canClaim if raisedTokenReachingMinCap
  pair.DepositRaisedToken = pair.DepositRaisedToken.plus(event.params.depositAmount)
  if (pair.DepositRaisedToken >= pair.raisedTokenMinCap) {
    pair.raisedTokenReachingMinCap = true
    pair.state = new BigInt(0)
    pair.participants.entries.map<Participant>(entry => {
      let participantId = entry.key
      let participant = Participant.load(participantId)
      if (participant != null) {
        participant.canClaim = true
        participant.save()
      }
      return participant as Participant
    })
  }
  // save participant transaction history
  let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
  participantTransactionHistory.depositAmount = event.params.depositAmount
  participantTransactionHistory.refundAmount = ZERO_BI
  participantTransactionHistory.claimLqAmount = ZERO_BI
  participantTransactionHistory.createdAt = event.block.timestamp
  participantTransactionHistory.account = event.params.depositor.toHexString()
  participantTransactionHistory.actionType = 'DEPOSIT'
  participantTransactionHistory.participant = participant.id

  participantTransactionHistory.save()
  participant.save()
  pair.save()
}

export function handleRefund(event: TRefund): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }
  pair.totalRefundAmount = pair.totalRefundAmount.plus(event.params.refundAmount)

  //pair.DepositRaisedToken = pair.DepositRaisedToken.minus(event.params.refundAmount)
  pair.save()

  let participantId = pair.id + '-' + event.params.depositor.toHexString()

  //update participant info
  let participant = Participant.load(participantId)
  if (participant == null) {
    return
  }
  participant.totalRefundAmount = participant.totalRefundAmount.plus(event.params.refundAmount)
  participant.save()

  // save participant transaction history
  let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
  participantTransactionHistory.refundAmount = event.params.refundAmount
  participantTransactionHistory.depositAmount = new BigInt(0)
  participantTransactionHistory.claimLqAmount = new BigInt(0)
  participantTransactionHistory.createdAt = event.block.timestamp
  participantTransactionHistory.account = event.params.depositor.toHexString()
  participantTransactionHistory.actionType = 'REFUND'
  participantTransactionHistory.participant = participant.id

  participantTransactionHistory.save()
}

export function handleClaimLP(event: TClaimLP): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }

  let participantId = pair.id + '-' + event.params.claimer.toHexString()

  //update participant info
  let participant = Participant.load(participantId)
  if (participant == null) {
    return
  }
  participant.totalclaimLqAmount = new BigInt(1)
  participant.canClaim = false
  participant.save()

  // save participant transaction history
  let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
  participantTransactionHistory.createdAt = event.block.timestamp
  participantTransactionHistory.account = event.params.claimer.toHexString()
  participantTransactionHistory.actionType = 'CLAIM'
  participantTransactionHistory.claimLqAmount = new BigInt(1)
  participantTransactionHistory.refundAmount = new BigInt(0)
  participantTransactionHistory.depositAmount = new BigInt(0)
  participantTransactionHistory.participant = participant.id

  participantTransactionHistory.save()
}

export function handlePerform(event: Perform): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }
  pair.state = new BigInt(event.params.pairState)
  pair.save()
}
