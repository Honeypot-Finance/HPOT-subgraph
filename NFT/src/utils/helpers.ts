import { Address, BigInt } from '@graphprotocol/graph-ts'
import { User, GlobalStats, NFTCollection } from '../types/schema'

export function getOrCreateUser(userAddress: Address): User {
  let user = User.load(userAddress.toHexString())

  if (user === null) {
    user = new User(userAddress.toHexString())
    user.totalOwned = BigInt.fromI32(0)
    user.save()
  }

  return user
}

export function getOrCreateNFTCollection(contractAddress: Address): NFTCollection {
  let collection = NFTCollection.load(contractAddress.toHexString())

  if (collection === null) {
    collection = new NFTCollection(contractAddress.toHexString())
    collection.address = contractAddress
    collection.totalMinted = BigInt.fromI32(0)
    collection.totalBurned = BigInt.fromI32(0)
    collection.totalHolders = BigInt.fromI32(0)
    collection.save()
  }

  return collection
}

export function getOrCreateGlobalStats(): GlobalStats {
  let globalStats = GlobalStats.load('global')

  if (globalStats === null) {
    globalStats = new GlobalStats('global')
    globalStats.totalMinted = BigInt.fromI32(0)
    globalStats.totalBurned = BigInt.fromI32(0)
    globalStats.totalHolders = BigInt.fromI32(0)
    globalStats.save()
  }

  return globalStats
}
