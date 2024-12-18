import { BigInt, BigDecimal, log, Address } from '@graphprotocol/graph-ts'
import { MemeRacer, MemeRacerHourData, Token } from '../types/schema'
import { MEME_RACERS, ZERO_BD, MEME_RACE_START_TIME } from './constants'
import { loadToken } from './token'

export function getMemeRacer(token: Token): MemeRacer | null {
  if (!MEME_RACERS.includes(token.id.toLowerCase())) return null

  let racer = MemeRacer.load(token.id)
  if (racer === null) {
    racer = new MemeRacer(token.id)
    racer.token = token.id
    racer.currentScore = ZERO_BD
    racer.totalSupply = token.totalSupply
    racer.save()
  }
  log.info('racer found: {}', [racer.id])
  return racer
}

export function updateMemeRacerHourData(token: Token, timestamp: BigInt, force: boolean = false): void {
  if (timestamp < MEME_RACE_START_TIME && !force) return
  log.info('updateMemeRacerHourData: {} with token: {}', [timestamp.toString(), token.id])
  let racer = getMemeRacer(token)
  if (!racer) return

  // Round timestamp to current hour
  let hourTimestamp = timestamp.div(BigInt.fromI32(3600)).times(BigInt.fromI32(3600))
  let hourID = token.id + '-' + hourTimestamp.toString()

  let hourData = MemeRacerHourData.load(hourID)
  if (hourData === null) {
    hourData = new MemeRacerHourData(hourID)
    hourData.racer = racer.id
    hourData.timestamp = hourTimestamp
    hourData.usdAtThisHour = token.derivedUSD
  }

  // Calculate current market cap as score
  let marketCap = racer.totalSupply.toBigDecimal().times(token.derivedUSD)
  log.info('Calculate current market cap as score: token.totalSupply:{}, token.derivedUSD:{}, marketCap: {}', [
    token.totalSupply.toString(),
    token.derivedUSD.toString(),
    marketCap.toString()
  ])

  hourData.score = marketCap
  hourData.save()

  // Update current score
  racer.currentScore = marketCap
  racer.save()
}
