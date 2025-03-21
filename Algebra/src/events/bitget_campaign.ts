import { Address, BigDecimal, ethereum, BigInt } from '@graphprotocol/graph-ts'
import { BitgetCampaign, BitgetCampaignEventPool, BitgetCampaignParticipant } from '../types/schema'
import { ONE_BI, ZERO_BI } from '../utils/constants'

const START_TIME = BigInt.fromI32(1742457600)
const END_TIME = BigInt.fromI32(1743580800)
const FINISH_AMOUNT_USD = BigDecimal.fromString('10')

const EVENT_POOLS = [
  '0xa61d8220f35947cce2f6bfc0405dbfca167336da', // XI / HONEY
  '0xb228eefe1c9fecd615a242fd3ea99a4e129e5a78', // BERACHAIN / WBERA
  '0xe86c89a85e9d1b2d514477fee05d61603681f53a', // Q5 / WBERA
  '0xc1014c1b2b131f87d4dd6ddfd9e3b0ab68fcd631' // WBERA / HENLO
]

export const updateEventData = (user: Address, pool: Address, amountUSD: BigDecimal, event: ethereum.Event): void => {
  //check if event is active
  if (event.block.timestamp < START_TIME || event.block.timestamp > END_TIME) {
    return
  }
  //check if pool is in the event pools
  if (!EVENT_POOLS.includes(pool.toHexString())) {
    return
  }

  let campaign = loadEvent()
  let eventPool = loadEventPool(pool.toHexString(), campaign.id)
  let eventParticipant = loadEventParticipant(user.toHexString(), pool.toHexString(), campaign.id)

  campaign.totalVolumeUSD = campaign.totalVolumeUSD.plus(amountUSD)
  campaign.totalFinishedUserCount = campaign.totalFinishedUserCount.plus(ONE_BI)

  eventPool.totalVolumeUSD = eventPool.totalVolumeUSD.plus(amountUSD)
  eventPool.totalFinishedUserCount = eventPool.totalFinishedUserCount.plus(ONE_BI)

  eventParticipant.amountUSD = eventParticipant.amountUSD.plus(amountUSD)

  //check if user is finished
  if (!eventParticipant.finished && eventParticipant.amountUSD >= FINISH_AMOUNT_USD) {
    eventParticipant.finished = true
    campaign.totalFinishedUserCount = campaign.totalFinishedUserCount.plus(ONE_BI)
    eventPool.totalFinishedUserCount = eventPool.totalFinishedUserCount.plus(ONE_BI)
  }

  campaign.save()
  eventPool.save()
  eventParticipant.save()
}

function loadEvent(): BitgetCampaign {
  let campaign = BitgetCampaign.load('bitget-campaign')
  if (!campaign) {
    campaign = new BitgetCampaign('bitget-campaign')
    campaign.totalVolumeUSD = BigDecimal.zero()
    campaign.totalFinishedUserCount = BigInt.zero()
    campaign.save()
  }
  return campaign
}

function loadEventPool(pool: string, campaignId: string): BitgetCampaignEventPool {
  let eventPool = BitgetCampaignEventPool.load(pool)
  if (!eventPool) {
    eventPool = new BitgetCampaignEventPool(pool)
    eventPool.pool = pool
    eventPool.totalVolumeUSD = BigDecimal.zero()
    eventPool.totalFinishedUserCount = ZERO_BI
    eventPool.campaign = campaignId
    eventPool.save()
  }
  return eventPool
}

function loadEventParticipant(user: string, pool: string, campaignId: string): BitgetCampaignParticipant {
  let id = user.concat('-').concat(pool)
  let eventParticipant = BitgetCampaignParticipant.load(id)
  if (!eventParticipant) {
    eventParticipant = new BitgetCampaignParticipant(id)
    eventParticipant.user = user
    eventParticipant.pool = pool
    eventParticipant.campaign = campaignId
    eventParticipant.amountUSD = BigDecimal.zero()
    eventParticipant.finished = false
    eventParticipant.save()
  }
  return eventParticipant
}
