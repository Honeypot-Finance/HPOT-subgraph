// import {
//     newMockEvent,
//   } from "matchstick-as/assembly/index"
// import { ClaimLP, DepositRaisedToken, Refund  } from "../../src/types/templates/Pot2Pump/Pot2PumpPair"
// import { Address, BigInt, ethereum} from "@graphprotocol/graph-ts"
// import { Pot2Pump } from "../../src/types/schema";

//   export function createDepositRaisedTokenEvent(
//     depositor: string,
//     depositAmount: BigInt,
//   ): DepositRaisedToken {
//     let mockEvent = newMockEvent()
//     let event = new DepositRaisedToken(
//       mockEvent.address,
//       mockEvent.logIndex,
//       mockEvent.transactionLogIndex,
//       mockEvent.logType,
//       mockEvent.block,
//       mockEvent.transaction,
//       mockEvent.parameters,
//       mockEvent.receipt,
//     )
//     event.parameters = new Array()
//     event.parameters.push(
//         new ethereum.EventParam("depositor", ethereum.Value.fromAddress(Address.fromString(depositor)))
//       )
//       event.parameters.push(
//         new ethereum.EventParam(
//           "depositAmount",
//           ethereum.Value.fromSignedBigInt(depositAmount)
//         )
//       )

//     return event
//   }

//   export function createRefundEvent(
//     depositor: string,
//     refundAmount: BigInt,
//   ): Refund {
//     let mockEvent = newMockEvent()
//     let event = new Refund(
//       mockEvent.address,
//       mockEvent.logIndex,
//       mockEvent.transactionLogIndex,
//       mockEvent.logType,
//       mockEvent.block,
//       mockEvent.transaction,
//       mockEvent.parameters,
//       mockEvent.receipt,
//     )
//     event.parameters = new Array()
//     event.parameters.push(
//         new ethereum.EventParam("depositor", ethereum.Value.fromAddress(Address.fromString(depositor)))
//       )
//       event.parameters.push(
//         new ethereum.EventParam(
//           "refundAmount",
//           ethereum.Value.fromSignedBigInt(refundAmount)
//         )
//       )

//     return event
//   }

//   export function createClaimLPEvent(
//     claimer: string,
//   ): ClaimLP {
//     let mockEvent = newMockEvent()
//     let event = new ClaimLP(
//       mockEvent.address,
//       mockEvent.logIndex,
//       mockEvent.transactionLogIndex,
//       mockEvent.logType,
//       mockEvent.block,
//       mockEvent.transaction,
//       mockEvent.parameters,
//       mockEvent.receipt,
//     )
//     event.parameters = new Array()
//     event.parameters.push(
//         new ethereum.EventParam("claimer", ethereum.Value.fromAddress(Address.fromString(claimer)))
//       )
//       event.parameters.push(
//         new ethereum.EventParam(
//           "",
//           ethereum.Value.fromSignedBigInt(new BigInt(0))
//         )
//       )

//     return event
//   }

//   export function mockPot2Pump(pairAddress: string): void {
//     let newPair = new Pot2Pump(Address.fromString(pairAddress).toHexString())
//     newPair.state = new BigInt(0)

//     newPair.launchToken = pairAddress;
//     newPair.raisedToken = pairAddress;

//     newPair.createdAt = new BigInt(0);

//     newPair.endTime = new BigInt(0);
//     newPair.DepositLaunchToken = new BigInt(0)
//     newPair.DepositRaisedToken = new BigInt(0)
//     newPair.totalRefundAmount = new BigInt(0)
//     newPair.totalClaimLpAmount = new BigInt(0)
//     newPair.participantsCount = new BigInt(0)

//     newPair.save()
//   }
