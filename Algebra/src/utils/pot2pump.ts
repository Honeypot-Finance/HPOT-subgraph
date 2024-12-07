
import { Pot2Pump } from "../types/schema"
import { Pot2Pump as Pot2PumpTemplate } from "../types/templates"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Pot2PumpPair } from "../types/templates/Pot2Pump/Pot2PumpPair"
import { ADDRESS_ZERO } from "./constants"

export const fetchEndTime = (address: Address): BigInt => {
    let pot2pump = Pot2PumpPair.bind(
        address
    )
    let endTime = pot2pump.try_endTime()

    return endTime.reverted ? BigInt.fromI32(0) : endTime.value
}

export const fetchLaunchTokenAmount = (address: Address): BigInt => {
    let pot2pump = Pot2PumpPair.bind(
        address
    )
    let launchTokenAmount = pot2pump.try_depositedLaunchedToken()

    return launchTokenAmount.reverted ? BigInt.fromI32(0) : launchTokenAmount.value
}

export const fetchState = (address: Address): BigInt => {
    let pot2pump = Pot2PumpPair.bind(
        address
    )

    let state = pot2pump.try_PairState()

    return state.reverted ? BigInt.fromI32(3) : BigInt.fromI32(state.value)
}

export const fetchMinCap = (address: Address): BigInt => {
    let pot2pump = Pot2PumpPair.bind(
        address
    )

    let minCap = pot2pump.try_raisedTokenMinCap()

    return minCap.reverted ? BigInt.fromI32(0) : minCap.value
}

export const fetchCreator = (address: Address): Address => {
    let pot2pump = Pot2PumpPair.bind(
        address
    )

    let creator = pot2pump.try_tokenDeployer()

    return creator.reverted ? Address.fromString(ADDRESS_ZERO) : creator.value
}