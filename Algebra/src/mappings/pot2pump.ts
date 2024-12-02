import { Participant, Pot2Pump } from "../types/schema"
import { Pot2Pump as Pot2PumpTemplate } from "../types/templates"
import { BigInt } from "@graphprotocol/graph-ts"
import { ClaimLP, DepositRaisedToken, Perform, Refund } from "../types/templates/Pot2Pump/Pot2PumpPair"

// type Participant @entity {
//     id: ID!
//     pot2Pump: Pot2Pump!
//     account: Account!
//     amount: BigInt!
//     createdAt: BigInt!
// }

export function handleDepositRaisedToken(event: DepositRaisedToken): void {
    let pair = Pot2Pump.load(event.address.toHexString())
    if (pair == null) {
        return
    }

    pair.DepositRaisedToken = pair.DepositRaisedToken.plus(event.params.depositAmount)
    pair.save()

    //update participant info
    let participant = Participant.load(event.transaction.hash.toHexString())
    if (participant == null) {
        participant = new Participant(event.transaction.hash.toHexString())
        participant.id = pair.id + "-" + event.transaction.hash.toHexString()
        participant.pot2Pump = pair.id
        participant.account = event.params.depositor.toHexString()
        participant.amount = new BigInt(0)
        participant.createdAt = event.block.timestamp

        pair.participantsCount = pair.participantsCount.plus(new BigInt(1))
    }

    participant.amount = participant.amount.plus(event.params.depositAmount)
    participant.save()
}

export function handleRefund(event: Refund): void {
    let pair = Pot2Pump.load(event.address.toHexString())    
    if (pair == null) {
        return
    }
    //pair.DepositRaisedToken = pair.DepositRaisedToken.minus(event.params.refundAmount)
    pair.save()
}

export function handleClaimLP(event: ClaimLP): void {
    let pair = Pot2Pump.load(event.address.toHexString())    
    if (pair == null) {
        return
    }
    //pair.DepositRaisedToken = pair.DepositRaisedToken.minus(event.params.param1)
    pair.save()
}

export function handlePerform(event: Perform): void {
    let pair = Pot2Pump.load(event.address.toHexString())   
     if (pair == null) {
        return
    }
    pair.state = new BigInt(event.params.pairState)
    pair.save()
}

    