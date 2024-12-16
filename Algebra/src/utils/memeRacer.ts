import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { MemeRacer, MemeRacerHourData, Token } from '../types/schema'
import { MEME_RACERS, ZERO_BD } from './constants'

export function getMemeRacer(tokenAddress: string): MemeRacer | null {
  if (!MEME_RACERS.includes(tokenAddress)) return null

  let racer = MemeRacer.load(tokenAddress)
  if (racer === null) {
    racer = new MemeRacer(tokenAddress)
    racer.token = tokenAddress
    racer.currentScore = ZERO_BD
    racer.save()
  }
  return racer
}

export function updateMemeRacerHourData(token: Token, timestamp: BigInt): void {
  let racer = getMemeRacer(token.id)
  if (!racer) return

  // Round timestamp to current hour
  let hourTimestamp = timestamp.div(BigInt.fromI32(3600)).times(BigInt.fromI32(3600))
  let hourID = token.id + '-' + hourTimestamp.toString()

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
