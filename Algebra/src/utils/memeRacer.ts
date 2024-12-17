import { BigInt, BigDecimal, log, Address } from '@graphprotocol/graph-ts'
import { MemeRacer, MemeRacerHourData, Token } from '../types/schema'
import { MEME_RACERS, ZERO_BD } from './constants'
import { loadToken } from './token'

export function getMemeRacer(tokenAddress: string): MemeRacer | null {
  log.info('MEME_RACERS: {}, tokenAddress: {}', [MEME_RACERS.join(', '), tokenAddress])
  if (!MEME_RACERS.includes(tokenAddress.toLowerCase())) return null

  let racer = MemeRacer.load(tokenAddress)
  if (racer === null) {
    racer = new MemeRacer(tokenAddress)
    racer.token = tokenAddress
    racer.currentScore = ZERO_BD
    racer.save()
  }
  log.info('racer found: {}', [racer.id])
  return racer
}

export function updateMemeRacerHourData(tokenAddress: string, timestamp: BigInt): void {
  let token = loadToken(Address.fromString(tokenAddress))
  log.info('racer token: {}', [token.symbol])
  let racer = getMemeRacer(token.id)
  if (!racer) return

  // Round timestamp to current hour
  let hourTimestamp = timestamp.div(BigInt.fromI32(3600)).times(BigInt.fromI32(3600))
  let hourID = tokenAddress + '-' + hourTimestamp.toString()

  log.info('hourID: {}', [hourID])

  let hourData = MemeRacerHourData.load(hourID)
  if (hourData === null) {
    hourData = new MemeRacerHourData(hourID)
    hourData.racer = racer.id
    hourData.timestamp = hourTimestamp
  }

  // Calculate current market cap as score
  let marketCap = token.totalSupply.toBigDecimal().times(token.derivedUSD)

  hourData.score = marketCap
  hourData.save()

  // Update current score
  racer.currentScore = marketCap
  racer.save()
}
