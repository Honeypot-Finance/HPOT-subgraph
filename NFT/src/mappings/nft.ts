import { BigInt } from '@graphprotocol/graph-ts'
import { Transfer as TransferEvent } from '../types/NFTContract/ERC721'
import { NFT, NFTTransfer, User, GlobalStats, NFTCollection } from '../types/schema'
import { getOrCreateUser, getOrCreateGlobalStats, getOrCreateNFTCollection } from '../utils/helpers'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: TransferEvent): void {
  const contractAddress = event.address
  const tokenId = event.params.tokenId
  const fromAddress = event.params.from
  const toAddress = event.params.to

  const isMint = fromAddress.toHexString() == ZERO_ADDRESS
  const isBurn = toAddress.toHexString() == ZERO_ADDRESS

  // Get global stats and collection stats
  const globalStats = getOrCreateGlobalStats()
  const collection = getOrCreateNFTCollection(contractAddress)

  // Load or create NFT
  const nftId = contractAddress.toHexString() + '-' + tokenId.toString()
  let nft = NFT.load(nftId)

  if (nft === null && isMint) {
    // Minting a new NFT
    nft = new NFT(nftId)
    nft.contract = contractAddress
    nft.tokenId = tokenId

    globalStats.totalMinted = globalStats.totalMinted.plus(BigInt.fromI32(1))
    collection.totalMinted = collection.totalMinted.plus(BigInt.fromI32(1))
  }

  // Handle ownership changes
  if (nft !== null && !isBurn) {
    // Update from user's owned count (decrease)
    if (!isMint) {
      const previousOwner = getOrCreateUser(fromAddress)
      if (previousOwner.totalOwned.gt(BigInt.fromI32(0))) {
        previousOwner.totalOwned = previousOwner.totalOwned.minus(BigInt.fromI32(1))
      }
      previousOwner.save()
    }

    // Update to user's owned count (increase)
    const newOwner = getOrCreateUser(toAddress)
    newOwner.totalOwned = newOwner.totalOwned.plus(BigInt.fromI32(1))
    newOwner.save()

    // Update NFT owner
    nft.owner = newOwner.id
    nft.ownerAddress = toAddress
    nft.save()
  } else if (nft !== null && isBurn) {
    // Burning - decrease from user's owned count
    const burner = getOrCreateUser(fromAddress)
    if (burner.totalOwned.gt(BigInt.fromI32(0))) {
      burner.totalOwned = burner.totalOwned.minus(BigInt.fromI32(1))
    }
    burner.save()

    globalStats.totalBurned = globalStats.totalBurned.plus(BigInt.fromI32(1))
    collection.totalBurned = collection.totalBurned.plus(BigInt.fromI32(1))
  }

  globalStats.save()
  collection.save()

  // Create transfer entity
  const transferId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const transfer = new NFTTransfer(transferId)
  transfer.nft = nftId
  transfer.contract = contractAddress
  transfer.tokenId = tokenId
  transfer.from = fromAddress
  transfer.to = toAddress
  transfer.transactionHash = event.transaction.hash
  transfer.timestamp = event.block.timestamp
  transfer.blockNumber = event.block.number
  transfer.logIndex = event.logIndex
  transfer.save()
}
