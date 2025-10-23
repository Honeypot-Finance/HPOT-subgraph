# NFT Tracking Subgraph

This subgraph tracks NFT ownership and transfers for the HPOT ecosystem.

## Overview

This is a dedicated NFT tracking subgraph that monitors:
- NFT ownership changes
- Transfer events
- Minting and burning statistics
- Per-collection and global NFT metrics

## Multi-NFT Collection Support

This subgraph supports tracking multiple NFT collections by using a unique `nftName` identifier:

### Configuration (config/berachain.ts)
```typescript
export const config = {
  network: "berachain-mainnet",
  nftName: "hpot-nft", // Unique identifier for this NFT collection
  nftContractAddress: "0xC3c30Fba6387cff83474E684380930dFC64554EF",
  startBlock: 803087,
} as const;
```

### Tracking Multiple NFTs
To track different NFT collections, update the `nftName` in your config file and deploy:

```bash
# Deploy with current config (nftName: "honeygenesis")
CHAIN=berachain VERSION=1.0.2 yarn deploy:chain
# Creates subgraph: honeygenesis-berachain/1.0.2

# To deploy another NFT collection:
# 1. Update config/berachain.ts with new nftName and contract address
# 2. Deploy again
CHAIN=berachain VERSION=1.0.0 yarn deploy:chain
```

The deployment script automatically reads `nftName` from the config and creates the deployment: `{nftName}-{chain}/{version}`

## Entities

### NFTCollection
Tracks per-collection statistics:
- `address`: Contract address
- `totalMinted`: Total NFTs minted in this collection
- `totalBurned`: Total NFTs burned in this collection
- `totalHolders`: Total unique holders for this collection

### User
Tracks individual NFT holders:
- `totalOwned`: Total NFTs currently in wallet (across all collections)

### NFT
Tracks individual NFT tokens:
- `contract`: NFT contract address
- `owner`: Current owner (User entity)
- `ownerAddress`: Current owner address
- `transfers`: All transfer events for this NFT

### NFTTransfer
Records all transfer events:
- `contract`: NFT contract address
- From/to addresses
- Token ID
- Timestamp and block information

### GlobalStats
Singleton entity tracking global metrics across all tracked collections:
- `totalMinted`: Total NFTs minted
- `totalBurned`: Total NFTs burned
- `totalHolders`: Total unique holders

## Deployment

The deployment script automatically handles codegen, build, and deployment in one command:

```bash
# Install dependencies (first time only)
yarn install

# Deploy (reads nftName from config automatically)
CHAIN=berachain VERSION=1.0.2 yarn deploy:chain
```

The script will:
1. Generate subgraph.yaml from template
2. Run codegen to generate types
3. Build the subgraph
4. Deploy to Goldsky as `{nftName}-{chain}/{version}`

For the current config (nftName: "honeygenesis"), this creates: `honeygenesis-berachain/1.0.2`

## Architecture

This subgraph is separate from the NFT_Stake subgraph to provide a clean separation of concerns:
- **NFT**: Tracks all NFT transfers and ownership
- **NFT_Stake**: Tracks only staking operations

This architecture ensures that NFT ownership is always correctly tracked regardless of staking operations.

## Example Queries

### Query a specific NFT collection
```graphql
{
  nftCollection(id: "0xC3c30Fba6387cff83474E684380930dFC64554EF") {
    address
    totalMinted
    totalBurned
    totalHolders
  }
}
```

### Query user's NFTs
```graphql
{
  user(id: "0x...") {
    totalOwned
    nfts {
      id
      tokenId
      contract
    }
  }
}
```
