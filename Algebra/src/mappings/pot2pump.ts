import { Participant, ParticipantTransactionHistory, Pot2Pump } from '../types/schema';
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
    let participantId = pair.id + "-" + event.params.depositor.toHexString(); 

    let participant = Participant.load(participantId); 

    if (participant == null) {
        participant = new Participant(participantId)
        participant.id = participantId
        participant.pot2Pump = pair.id
        participant.account = event.params.depositor.toHexString()
        participant.amount = new BigInt(0)
        participant.totalRefundAmount = new BigInt(0)
        participant.totalclaimLqAmount = new BigInt(0)
        participant.createdAt = event.block.timestamp

        pair.participantsCount = pair.participantsCount.plus(new BigInt(1))
    }

    participant.amount = participant.amount.plus(event.params.depositAmount)
    participant.save()

    // save participant transaction history
    let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
    participantTransactionHistory.depositAmount  = event.params.depositAmount; 
    participantTransactionHistory.refundAmount  =  new BigInt(0);
    participantTransactionHistory.claimLqAmount  =  new BigInt(0);
    participantTransactionHistory.createdAt = event.block.timestamp; 
    participantTransactionHistory.account = event.params.depositor.toHexString();
    participantTransactionHistory.actionType = "DEPOSIT"; 
    participantTransactionHistory.participant = participant.id; 

    participantTransactionHistory.save(); 
}

export function handleRefund(event: Refund): void {
    let pair = Pot2Pump.load(event.address.toHexString())    
    if (pair == null) {
        return
    }
    pair.totalRefundAmount = pair.totalRefundAmount.plus(event.params.refundAmount)

    //pair.DepositRaisedToken = pair.DepositRaisedToken.minus(event.params.refundAmount)
    pair.save()
    
    let participantId = pair.id + "-" + event.params.depositor.toHexString(); 

     //update participant info
     let participant = Participant.load(participantId); 
     if (participant == null) {
        return; 
     } 
     participant.totalRefundAmount = participant.totalRefundAmount.plus(event.params.refundAmount); 
     participant.save()
    

    // save participant transaction history
    let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
    participantTransactionHistory.refundAmount  = event.params.refundAmount; 
    participantTransactionHistory.depositAmount  = new BigInt(0);
    participantTransactionHistory.claimLqAmount  =  new BigInt(0);
    participantTransactionHistory.createdAt = event.block.timestamp; 
    participantTransactionHistory.account = event.params.depositor.toHexString();
    participantTransactionHistory.actionType = "REFUND"; 
    participantTransactionHistory.participant = participant.id; 

    participantTransactionHistory.save(); 
}

export function handleClaimLP(event: ClaimLP): void {
    let pair = Pot2Pump.load(event.address.toHexString())   
    if (pair == null) {
        return
    }
 
        let participantId = pair.id + "-" + event.params.claimer.toHexString(); 
    
         //update participant info
         let participant = Participant.load(participantId); 
         if (participant == null) {
            return; 
         } 
         participant.totalclaimLqAmount = new BigInt(1); 
         participant.save()
        
    
        // save participant transaction history
        let participantTransactionHistory = new ParticipantTransactionHistory(event.transaction.hash.toHexString())
        participantTransactionHistory.createdAt = event.block.timestamp; 
        participantTransactionHistory.account = event.params.claimer.toHexString();
        participantTransactionHistory.actionType = "CLAIM"; 
        participantTransactionHistory.claimLqAmount=  new BigInt(1); 
        participantTransactionHistory.refundAmount  = new BigInt(0);
        participantTransactionHistory.depositAmount  = new BigInt(0);
        participantTransactionHistory.participant = participant.id; 
    
        participantTransactionHistory.save();
}

export function handlePerform(event: Perform): void {
    let pair = Pot2Pump.load(event.address.toHexString())   
     if (pair == null) {
        return
    }
    pair.state = new BigInt(event.params.pairState)
    pair.save()
}

    