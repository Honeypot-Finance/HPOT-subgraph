/* eslint-disable prefer-const */
import { ERC20 } from '../types/Factory/ERC20'
import { ERC20SymbolBytes } from '../types/Factory/ERC20SymbolBytes'
import { ERC20NameBytes } from '../types/Factory/ERC20NameBytes'
import { StaticTokenDefinition } from './staticTokenDefinition'
import { BigInt, Address, store, log } from '@graphprotocol/graph-ts'
import { isNullEthValue } from '.'
import { Pot2PumpFactory } from '../types/Factory/Pot2PumpFactory'
import { ONE_BI, POT2PUMP_FACTORY_ADDRESS, ZERO_BD, ZERO_BI } from './constants'
import { HoldingToken, Token } from '../types/schema'

export function fetchTokenPot2PumpAddress(tokenAddress: Address): Address {
  const pot2PumpContract = Pot2PumpFactory.bind(Address.fromString(POT2PUMP_FACTORY_ADDRESS));
  const pairAddress = pot2PumpContract.try_getPair(tokenAddress);

  if (pairAddress.reverted) {
    return Address.zero();
  }
  return pairAddress.value;
}

export function fetchTokenBalance(tokenAddress: Address, userAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let balanceValue = BigInt.fromString("0")
  let balanceResult = contract.try_balanceOf(userAddress)
  if (!balanceResult.reverted) {
    balanceValue = balanceResult.value
  }
  return balanceValue as BigInt
}


export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      } else {
        // try with the static definition
        let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
        if(staticTokenDefinition != null) {
          symbolValue = staticTokenDefinition.symbol
        }
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      } else {
        // try with the static definition
        let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
        if(staticTokenDefinition != null) {
          nameValue = staticTokenDefinition.name
        }
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = BigInt.fromString("1")
  let totalSupplyResult = contract.try_totalSupply() 
  if (!totalSupplyResult.reverted) {
    let totalSupply = contract.totalSupply()
    totalSupplyValue = totalSupply
  }
  return totalSupplyValue as BigInt
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = BigInt.fromString("1")
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = BigInt.fromI32(decimalResult.value) 
  } else {
    // try with the static definition
    let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
    if(staticTokenDefinition != null) {
      return staticTokenDefinition.decimals
    }
  }

  return decimalValue
}

export function initializeToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString())
  if (token == null) {
    token = new Token(tokenAddress.toHexString())
    token.name = fetchTokenName(tokenAddress)
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.totalSupply = fetchTokenTotalSupply(tokenAddress)
    token.decimals = fetchTokenDecimals(tokenAddress)

    // bail if we couldn't figure out the decimals
    if (token.decimals === null) {
      log.error('Token {} has no decimals', [tokenAddress.toHexString()])
    }

    token.derivedMatic = ZERO_BD
    token.volume = ZERO_BD
    token.volumeUSD = ZERO_BD
    token.feesUSD = ZERO_BD
    token.untrackedVolumeUSD = ZERO_BD
    token.totalValueLocked = ZERO_BD
    token.totalValueLockedUSD = ZERO_BD
    token.totalValueLockedUSDUntracked = ZERO_BD
    token.txCount = ZERO_BI
    token.poolCount = ZERO_BI
    token.whitelistPools = []
    token.holderCount = BigInt.fromI32(0)
    token.marketCap = ZERO_BD
    //token.pot2Pump = fetchTokenPot2PumpAddress(tokenAddress)

    token.save()
  }

  return token
}

