import {
    assert,
    describe,
    test,
    clearStore,
    afterAll, 
  } from "matchstick-as/assembly/index"
import { handleClaimLP, handleDepositRaisedToken, handleRefund } from '../../src/mappings/pot2pump';
import { Address, BigInt } from "@graphprotocol/graph-ts"
import {   Participant, ParticipantTransactionHistory,} from "../../src/types/schema";
import { createClaimLPEvent, createDepositRaisedTokenEvent, createRefundEvent, mockPot2Pump } from "../mocks/pot2Pump.mock";

describe("Describe entity assertions", () => {
    afterAll(() => {
      clearStore()
    })

    test("Deposit raised token event should right", () => {
      let depoisitor = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"; 
      let depositAmount = new BigInt(100);

      let depoistEvent = createDepositRaisedTokenEvent(depoisitor, depositAmount); 
      mockPot2Pump(depoistEvent.address.toHexString());

      handleDepositRaisedToken(depoistEvent)
      
      let participantId = depoistEvent.address.toHexString() + "-" + Address.fromString(depoisitor).toHexString();

      let participantRecord = Participant.load(participantId)!; 
      
       assert.entityCount("Participant", 1)

       assert.entityCount("ParticipantTransactionHistory", 1)

      assert.bigIntEquals(participantRecord.amount,depositAmount); 

      let participantTransactionHistoryRecord = ParticipantTransactionHistory.load(depoistEvent.transaction.hash.toHexString())!; 
      
      assert.stringEquals(participantTransactionHistoryRecord.actionType, "DEPOSIT"); 
    })


    test("Refund token should right", () => {
      let depoisitor = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"; 
      let refundAmount = new BigInt(100);

      let refundEvent = createRefundEvent(depoisitor, refundAmount); 
      mockPot2Pump(refundEvent.address.toHexString());

      handleRefund(refundEvent)
      
      let participantId = refundEvent.address.toHexString() + "-" + Address.fromString(depoisitor).toHexString();

      let participantRecord = Participant.load(participantId)!; 
      
       assert.entityCount("Participant", 1)

       assert.entityCount("ParticipantTransactionHistory", 1)

      assert.bigIntEquals(participantRecord.totalRefundAmount,refundAmount); 

      let participantTransactionHistoryRecord = ParticipantTransactionHistory.load(refundEvent.transaction.hash.toHexString())!; 
      
      assert.stringEquals(participantTransactionHistoryRecord.actionType, "REFUND"); 
    })

    test("ClaimLp token should right", () => {
      let claimer = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"; 

      let claimEvent = createClaimLPEvent(claimer); 
      mockPot2Pump(claimEvent.address.toHexString());

      handleClaimLP(claimEvent)
      
      let participantId = claimEvent.address.toHexString() + "-" + Address.fromString(claimer).toHexString();

      let participantRecord = Participant.load(participantId)!; 
      
       assert.entityCount("Participant", 1)

       assert.entityCount("ParticipantTransactionHistory", 1)

      assert.bigIntEquals(participantRecord.totalRefundAmount,new BigInt(1)); 

      let participantTransactionHistoryRecord = ParticipantTransactionHistory.load(claimEvent.transaction.hash.toHexString())!; 
      
      assert.stringEquals(participantTransactionHistoryRecord.actionType, "CLAIM"); 
    })
  })
