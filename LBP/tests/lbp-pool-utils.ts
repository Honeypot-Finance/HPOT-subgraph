import { newMockEvent } from 'matchstick-as'
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts'
import {
  Buy as BuyEvent,
  Sell as SellEvent,
  Close as CloseEvent,
  MaxRaiseReached as MaxRaiseReachedEvent
} from '../src/types/templates/LBP_Pool/LiquidityBootstrapPool'

export function createBuyEvent(
  caller: Address,
  recipient: Address,
  assets: BigInt,
  shares: BigInt,
  swapFee: BigInt,
  poolAddress: Address
): BuyEvent {
  let buyEvent = changetype<BuyEvent>(newMockEvent())
  buyEvent.address = poolAddress
  buyEvent.parameters = new Array()

  buyEvent.parameters.push(new ethereum.EventParam('caller', ethereum.Value.fromAddress(caller)))
  buyEvent.parameters.push(new ethereum.EventParam('recipient', ethereum.Value.fromAddress(recipient)))
  buyEvent.parameters.push(new ethereum.EventParam('assets', ethereum.Value.fromUnsignedBigInt(assets)))
  buyEvent.parameters.push(new ethereum.EventParam('shares', ethereum.Value.fromUnsignedBigInt(shares)))
  buyEvent.parameters.push(new ethereum.EventParam('swapFee', ethereum.Value.fromUnsignedBigInt(swapFee)))

  return buyEvent
}

export function createSellEvent(
  caller: Address,
  recipient: Address,
  shares: BigInt,
  assets: BigInt,
  swapFee: BigInt,
  poolAddress: Address
): SellEvent {
  let sellEvent = changetype<SellEvent>(newMockEvent())
  sellEvent.address = poolAddress
  sellEvent.parameters = new Array()

  sellEvent.parameters.push(new ethereum.EventParam('caller', ethereum.Value.fromAddress(caller)))
  sellEvent.parameters.push(new ethereum.EventParam('recipient', ethereum.Value.fromAddress(recipient)))
  sellEvent.parameters.push(new ethereum.EventParam('shares', ethereum.Value.fromUnsignedBigInt(shares)))
  sellEvent.parameters.push(new ethereum.EventParam('assets', ethereum.Value.fromUnsignedBigInt(assets)))
  sellEvent.parameters.push(new ethereum.EventParam('swapFee', ethereum.Value.fromUnsignedBigInt(swapFee)))

  return sellEvent
}

export function createCloseEvent(
  assets: BigInt,
  platformFees: BigInt,
  swapFeesAsset: BigInt,
  swapFeesShare: BigInt,
  poolAddress: Address
): CloseEvent {
  let closeEvent = changetype<CloseEvent>(newMockEvent())
  closeEvent.address = poolAddress
  closeEvent.parameters = new Array()

  closeEvent.parameters.push(new ethereum.EventParam('assets', ethereum.Value.fromUnsignedBigInt(assets)))
  closeEvent.parameters.push(new ethereum.EventParam('platformFees', ethereum.Value.fromUnsignedBigInt(platformFees)))
  closeEvent.parameters.push(new ethereum.EventParam('swapFeesAsset', ethereum.Value.fromUnsignedBigInt(swapFeesAsset)))
  closeEvent.parameters.push(new ethereum.EventParam('swapFeesShare', ethereum.Value.fromUnsignedBigInt(swapFeesShare)))

  return closeEvent
}
