
import { Pot2Pump } from "../types/schema"
import { Pot2Pump as Pot2PumpTemplate } from "../types/templates"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Pot2PumpPair } from "../types/templates/Pot2Pump/Pot2PumpPair"

export const fetchEndTime = (address: Address): BigInt => {
    let pot2pump = Pot2PumpPair.bind(
        address
    )
    let endTime = pot2pump.try_endTime()

    return endTime.reverted ? BigInt.fromI32(0) : endTime.value
}