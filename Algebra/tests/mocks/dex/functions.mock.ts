import { ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'
import { POT2PUMP_FACTORY_ADDRESS } from '../../../src/utils/constants'
import { Address } from '@graphprotocol/graph-ts'
import { POOL_ADDRESS, WBERA_ADDRESS } from '../../testConstants'
createMockedFunction(Address.fromString(POT2PUMP_FACTORY_ADDRESS), 'getPair', 'getPair(address):(address)')
  .withArgs([ethereum.Value.fromAddress(Address.fromString(WBERA_ADDRESS))])
  .returns([ethereum.Value.fromAddress(Address.fromString(POOL_ADDRESS))])
