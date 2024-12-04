import { ERC20 } from "../types/Factory/ERC20"
import { PairCreated, Pot2PumpFactory } from "../types/Factory/Pot2PumpFactory"
import { Pot2Pump, Token } from "../types/schema"
import { Pot2Pump as Pot2PumpTemplate,
Token as TokenTemplate
} from "../types/templates"
import { BigInt } from '@graphprotocol/graph-ts'
import { fetchEndTime } from "../utils/pot2pump"
import { initializeToken } from "../utils/token"


export function handlePairCreated(event: PairCreated): void {
    let newPair = Pot2Pump.load(event.params.pair.toHexString())

    if (newPair == null) {
        newPair = new Pot2Pump(event.params.pair.toHexString())
        newPair.state = new BigInt(0)

        newPair.launchToken = event.params.launchedToken.toHexString()
        newPair.raisedToken = event.params.raisedToken.toHexString()

        newPair.createdAt = event.block.timestamp
        newPair.endTime = fetchEndTime(event.params.pair)
        newPair.DepositLaunchToken = event.params.param3
        newPair.DepositRaisedToken = new BigInt(0)
        newPair.totalRefundAmount = new BigInt(0)
        newPair.totalClaimLpAmount = new BigInt(0)
        newPair.participantsCount = new BigInt(0)

        newPair.save()
        Pot2PumpTemplate.create(event.params.pair)
    }


    // Update the if launch is meme token and register it to ERC20 listener
    let launchToken = Token.load(event.params.launchedToken.toHexString())
    if (launchToken == null) {
        launchToken = initializeToken(event.params.launchedToken)
        TokenTemplate.create(event.params.launchedToken)
    }

    launchToken.Pot2PumpAddress = event.params.pair.toHexString()
    launchToken.save()
}