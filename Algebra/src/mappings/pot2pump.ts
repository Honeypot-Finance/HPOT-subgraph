import {
  Participant,
  ParticipantTransactionHistory,
  Pot2Pump,
  DepositRaisedToken,
  Transaction,
  Refund,
  ClaimLp,
  Factory
} from '../types/schema'
import { Pot2Pump as Pot2PumpTemplate } from '../types/templates'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  ClaimLP as TClaimLP,
  DepositRaisedToken as TDepositRaisedToken,
  Perform,
  Refund as TRefund
} from '../types/templates/Pot2Pump/Pot2PumpPair'
import { fetchState } from '../utils/pot2pump'
import { loadAccount } from '../utils/account'
import { ONE_BI, TransactionType, TransactionTypeToString, ZERO_BI } from '../utils/constants'
import { ADDRESS_ZERO } from '../utils/constants'
import { loadToken } from '../utils/token'
import { loadFactory } from './factory'

export function handleDepositRaisedToken(event: TDepositRaisedToken): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }

  const factory = loadFactory()
  const account = loadAccount(event.params.depositor)
  const raiseToken = loadToken(Address.fromString(pair.raisedToken))
  const launchToken = loadToken(Address.fromString(pair.launchToken))
  const deployer = loadAccount(Address.fromString(pair.creator))

  // update pot2Pump depositRaisedToken info
  const newRaisedTokenAmount = pair.DepositRaisedToken.plus(event.params.depositAmount)
  pair.DepositRaisedToken = newRaisedTokenAmount
  pair.depositRaisedTokenPercentageToMinCap = newRaisedTokenAmount
    .toBigDecimal()
    .div(pair.raisedTokenMinCap.toBigDecimal())

  const transaction = createTransaction(
    event.transaction.hash.toHexString(),
    event.block.number,
    event.block.timestamp,
    event.transaction.gasLimit,
    event.transaction.gasPrice,
    event.params.depositor.toHexString(),
    TransactionTypeToString(TransactionType.DEPOSIT)
  )

  let depositRaisedToken = new DepositRaisedToken(
    event.transaction.hash.toHexString() + '#' + event.logIndex.toString()
  )
  depositRaisedToken.transaction = transaction.id
  depositRaisedToken.timestamp = event.block.timestamp
  depositRaisedToken.amount = event.params.depositAmount
  depositRaisedToken.logIndex = event.logIndex
  depositRaisedToken.origin = event.transaction.from
  depositRaisedToken.poolAddress = Address.fromString(pair.id)

  depositRaisedToken.save()

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
    participant.claimed = false
    participant.refunded = false
    participant.createdAt = event.block.timestamp

    pair.participantsCount = pair.participantsCount.plus(ONE_BI)

    if (account != null) {
      account.participateCount = account.participateCount.plus(ONE_BI)
      account.platformTxCount = account.platformTxCount.plus(ONE_BI)
    }
  }

  participant.amount = participant.amount.plus(event.params.depositAmount)

  if (pair.DepositRaisedToken >= pair.raisedTokenMinCap) {
    pair.raisedTokenReachingMinCap = true
    pair.state = new BigInt(0)
    const initPriceUSD = pair.DepositRaisedToken.toBigDecimal()
      .div(pair.DepositLaunchToken.toBigDecimal())
      .div(BigDecimal.fromString('2'))
      .times(raiseToken.derivedUSD)
    launchToken.derivedUSD = initPriceUSD
    launchToken.initialUSD = initPriceUSD
    pair.launchTokenInitialPrice = initPriceUSD
  }

  // save participant transaction history
  let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
  participantTransactionHistory.pot2Pump = pair.id
  participantTransactionHistory.depositAmount = event.params.depositAmount
  participantTransactionHistory.refundAmount = ZERO_BI
  participantTransactionHistory.claimLqAmount = ZERO_BI
  participantTransactionHistory.createdAt = event.block.timestamp
  participantTransactionHistory.account = event.params.depositor.toHexString()
  participantTransactionHistory.actionType = TransactionTypeToString(TransactionType.DEPOSIT)
  participantTransactionHistory.participant = participant.id

  participantTransactionHistory.save()
  participant.save()
  pair.save()
  launchToken.save()
  raiseToken.save()
  if (account != null) {
    account.save()
  }
  factory.save()
}

export function handleRefund(event: TRefund): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }

  pair.totalRefundAmount = pair.totalRefundAmount.plus(event.params.refundAmount)

  //pair.DepositRaisedToken = pair.DepositRaisedToken.minus(event.params.refundAmount)
  pair.save()

  const pot2Pump = Pot2Pump.load(event.address.toHexString())!
  const raiseToken = loadToken(Address.fromString(pot2Pump.raisedToken))
  const launchToken = loadToken(Address.fromString(pot2Pump.launchToken))
  const account = loadAccount(event.params.depositor)

  const transaction = createTransaction(
    event.transaction.hash.toHexString(),
    event.block.number,
    event.block.timestamp,
    event.transaction.gasLimit,
    event.transaction.gasPrice,
    event.params.depositor.toHexString(),
    'REFUND'
  )
  let refund = new Refund(event.transaction.hash.toHexString() + '#' + event.logIndex.toString())
  refund.transaction = transaction.id
  refund.timestamp = event.block.timestamp
  refund.amount = event.params.refundAmount
  refund.logIndex = event.logIndex
  refund.origin = event.transaction.from
  refund.poolAddress = Address.fromString(pair.id)

  let participantId = pair.id + '-' + event.params.depositor.toHexString()

  //update participant info
  let participant = Participant.load(participantId)
  if (participant == null) {
    return
  }
  participant.totalRefundAmount = participant.totalRefundAmount.plus(event.params.refundAmount)
  participant.refunded = true
  participant.save()

  // save participant transaction history
  let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
  participantTransactionHistory.pot2Pump = pair.id
  participantTransactionHistory.refundAmount = event.params.refundAmount
  participantTransactionHistory.depositAmount = new BigInt(0)
  participantTransactionHistory.claimLqAmount = new BigInt(0)
  participantTransactionHistory.createdAt = event.block.timestamp
  participantTransactionHistory.account = event.params.depositor.toHexString()
  participantTransactionHistory.actionType = TransactionTypeToString(TransactionType.REFUND)
  participantTransactionHistory.participant = participant.id

  if (account != null) {
    account.platformTxCount = account.platformTxCount.plus(ONE_BI)
    account.save()
  }

  participantTransactionHistory.save()
}

export function handleClaimLP(event: TClaimLP): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }

  const pot2Pump = Pot2Pump.load(event.address.toHexString())!
  const raiseToken = loadToken(Address.fromString(pot2Pump.raisedToken))
  const launchToken = loadToken(Address.fromString(pot2Pump.launchToken))
  const account = loadAccount(event.params.claimer)

  const transaction = createTransaction(
    event.transaction.hash.toHexString(),
    event.block.number,
    event.block.timestamp,
    event.transaction.gasLimit,
    event.transaction.gasPrice,
    event.params.claimer.toHexString(),
    'CLAIM_LP'
  )
  const claimLp = new ClaimLp(event.transaction.hash.toHexString() + '#' + event.logIndex.toString())
  claimLp.amount = event.params.param1
  claimLp.transaction = transaction.id
  claimLp.timestamp = event.block.timestamp
  claimLp.origin = event.transaction.from
  claimLp.logIndex = event.logIndex
  claimLp.poolAddress = Address.fromString(pair.id)

  let participantId = pair.id + '-' + event.params.claimer.toHexString()

  //update participant info
  let participant = Participant.load(participantId)
  if (participant == null) {
    return
  }
  participant.totalclaimLqAmount = new BigInt(1)
  participant.claimed = true
  participant.save()

  // save participant transaction history
  let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
  participantTransactionHistory.pot2Pump = pair.id
  participantTransactionHistory.createdAt = event.block.timestamp
  participantTransactionHistory.account = event.params.claimer.toHexString()
  participantTransactionHistory.actionType = TransactionTypeToString(TransactionType.CLAIM_LP)
  participantTransactionHistory.claimLqAmount = new BigInt(1)
  participantTransactionHistory.refundAmount = new BigInt(0)
  participantTransactionHistory.depositAmount = new BigInt(0)
  participantTransactionHistory.participant = participant.id

  if (account != null) {
    account.platformTxCount = account.platformTxCount.plus(ONE_BI)
  }

  participantTransactionHistory.save()
  if (account != null) {
    account.save()
  }
}

export function handlePerform(event: Perform): void {
  let pair = Pot2Pump.load(event.address.toHexString())
  if (pair == null) {
    return
  }
  pair.state = new BigInt(event.params.pairState)
  pair.save()
}

export function createTransaction(
  hash: string,
  blockNumber: BigInt,
  timestamp: BigInt,
  gasLimit: BigInt,
  gasPrice: BigInt,
  account: string,
  type: string
): Transaction {
  let transaction = new Transaction(hash)
  transaction.blockNumber = blockNumber
  transaction.timestamp = timestamp
  transaction.gasLimit = gasLimit
  transaction.gasPrice = gasPrice
  transaction.account = account
  transaction.type = type

  transaction.save()

  return transaction
}
