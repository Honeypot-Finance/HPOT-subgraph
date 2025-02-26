import { assert, describe, test, clearStore, afterAll, beforeEach, beforeAll } from 'matchstick-as/assembly/index'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { handleSwap } from '../../src/mappings/core'
import { Participant, ParticipantTransactionHistory, Swap } from '../../src/types/schema'
import { Token } from '../../src/types/schema'
import { createMockTokenEntity } from '../mocks/dex/entities.mock'
const WBERA_ADDRESS = '0x6969696969696969696969696969696969696969'
const HPOT_ADDRESS = '0x9b37d542114070518a44e200fdcd8e4be737297f'
import { log } from 'matchstick-as/assembly/index'
import { convertTokenToDecimal } from '../../src/utils'
import { ZERO_BD } from '../../src/utils/constants'

describe('Function assertions', () => {
  afterAll(() => {
    clearStore()
  })

  beforeAll(() => {
    createMockTokenEntity(WBERA_ADDRESS)
    createMockTokenEntity(HPOT_ADDRESS)
  })

  test('Swap should have right untrackedUSD amount', () => {
    const token0 = Token.load(WBERA_ADDRESS)!
    token0.derivedUSD = BigDecimal.fromString('6.75')
    const token1 = Token.load(HPOT_ADDRESS)!
    token1.derivedUSD = BigDecimal.fromString('0.000357')
    const amount1 = BigInt.fromString('-4242877432357606522693451')
    const amount0 = BigInt.fromString('206424733072053309455')

    const amount0BD: BigDecimal = convertTokenToDecimal(amount0, token0.decimals)
    const amount1BD: BigDecimal = convertTokenToDecimal(amount1, token1.decimals)

    let amount0Abs = amount0BD.lt(ZERO_BD) ? amount0BD.times(BigDecimal.fromString('-1')) : amount0BD
    let amount1Abs = amount1BD.lt(ZERO_BD) ? amount1BD.times(BigDecimal.fromString('-1')) : amount1BD

    let amount0USD = amount0Abs.times(token0.derivedUSD)
    let amount1USD = amount1Abs.times(token1.derivedUSD)

    let amountTotalUSDUntracked = amount0USD.plus(amount1USD).div(BigDecimal.fromString('2'))

    if (token0) {
      log.info('token0: {}', [token0.symbol])
    }
    if (token1) {
      log.info('token1: {}', [token1.symbol])
    }
    log.info('amount0BD: {}', [amount0BD.toString()])
    log.info('amount1BD: {}', [amount1BD.toString()])
    log.info('amount0Abs: {}', [amount0Abs.toString()])
    log.info('amount1Abs: {}', [amount1Abs.toString()])
    log.info('amount0USD: {}', [amount0USD.toString()])
    log.info('amount1USD: {}', [amount1USD.toString()])
    log.info('amountTotalUSDUntracked: {}', [amountTotalUSDUntracked.toString()])
  })
})
