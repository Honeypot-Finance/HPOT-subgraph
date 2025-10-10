# NFT Tracker - Quick Usage Guide

## Quick Deployment Guide

### Step 1: Update NFT Contract Address

Edit the config file for your target chain and replace the placeholder address:

**For Berachain:**
```bash
# Edit config/berachain.ts
# Change nftContractAddress from '0x0000...' to your actual NFT contract address
```

**For Ethereum:**
```bash
# Edit config/ethereum.ts
```

**For BSC:**
```bash
# Edit config/bsc.ts
```

### Step 2: Install Dependencies

```bash
cd NFT_tracker
yarn install
```

### Step 3: Deploy

Deploy to your chosen chain:

```bash
# For Berachain
CHAIN=berachain VERSION=1.0.0 yarn deploy:chain

# For Ethereum
CHAIN=ethereum VERSION=1.0.0 yarn deploy:chain

# For BSC
CHAIN=bsc VERSION=1.0.0 yarn deploy:chain
```

This single command will:
1. Generate `subgraph.yaml` with your chain-specific configuration
2. Generate TypeScript types from the GraphQL schema
3. Build the subgraph
4. Deploy to Goldsky

## Manual Deployment (if preferred)

If you want more control over the deployment process:

```bash
# 1. Generate subgraph.yaml
ts-node --project scripts/tsconfig.json scripts/deploy.ts berachain

# 2. Generate types
yarn codegen

# 3. Build
yarn build

# 4. Deploy to Goldsky
goldsky subgraph deploy nft-tracker-berachain/1.0.0 --path ./
```

## Configuration Examples

### Example 1: Track BAYC on Ethereum

Edit `config/ethereum.ts`:
```typescript
export const config = {
  network: 'mainnet',
  nftContractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
  startBlock: 12287507, // BAYC deployment block
} as const
```

Deploy:
```bash
CHAIN=ethereum VERSION=1.0.0 yarn deploy:chain
```

### Example 2: Track Custom NFT on Berachain

Edit `config/berachain.ts`:
```typescript
export const config = {
  network: 'berachain-mainnet',
  nftContractAddress: '0x1234567890123456789012345678901234567890', // Your NFT
  startBlock: 1000000, // Your deployment block
} as const
```

Deploy:
```bash
CHAIN=berachain VERSION=1.0.0 yarn deploy:chain
```

## Querying the Subgraph

Once deployed, you can query your subgraph using GraphQL:

### Get all holders
```graphql
{
  nftHolders(first: 10) {
    address
    balance
  }
}
```

### Get specific holder's NFTs
```graphql
{
  nftHolders(where: { address: "0x..." }) {
    tokens {
      tokenId
      tokenURI
    }
  }
}
```

### Get recent transfers
```graphql
{
  nftTransfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    from {
      address
    }
    to {
      address
    }
    token {
      tokenId
    }
    timestamp
  }
}
```

## Troubleshooting

**Problem:** "Please specify a chain"
**Solution:** Make sure to include `CHAIN=` before the command
```bash
CHAIN=berachain VERSION=1.0.0 yarn deploy:chain
```

**Problem:** NFT contract address is still `0x0000...`
**Solution:** Edit the appropriate config file and update `nftContractAddress`

**Problem:** Deployment fails with "Unsupported chain"
**Solution:** Use one of: `berachain`, `ethereum`, or `bsc`

**Problem:** Need to track multiple NFT contracts
**Solution:** You'll need to deploy a separate subgraph for each NFT contract, or modify the subgraph to use multiple data sources in `subgraph.template.yaml`

## Adding Support for Multiple NFT Contracts

If you want to track multiple NFT collections in a single subgraph, you can modify `subgraph.template.yaml` to include multiple data sources:

```yaml
dataSources:
  - kind: ethereum/contract
    name: NFTContract1
    network: ${NETWORK}
    source:
      address: '${NFT_CONTRACT_ADDRESS_1}'
      abi: ERC721
      startBlock: ${START_BLOCK_1}
    mapping:
      # ... same mapping config

  - kind: ethereum/contract
    name: NFTContract2
    network: ${NETWORK}
    source:
      address: '${NFT_CONTRACT_ADDRESS_2}'
      abi: ERC721
      startBlock: ${START_BLOCK_2}
    mapping:
      # ... same mapping config
```

Then update your config files and deployment script accordingly.
