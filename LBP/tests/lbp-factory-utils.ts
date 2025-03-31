import { newMockEvent } from 'matchstick-as'
import { ethereum, Address } from '@graphprotocol/graph-ts'
import { PoolCreated as PoolCreatedEvent } from '../src/types/LBP_Factory/LiquidityBootstrapPoolFactory'

export function createPoolCreatedEvent(pool: Address): PoolCreatedEvent {
  let poolCreatedEvent = changetype<PoolCreatedEvent>(newMockEvent())
  poolCreatedEvent.parameters = new Array()

  poolCreatedEvent.parameters.push(new ethereum.EventParam('pool', ethereum.Value.fromAddress(pool)))

  return poolCreatedEvent
}
