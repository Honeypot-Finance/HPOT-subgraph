# NFT Tracker Subgraph

This subgraph tracks NFT ownership and transfers for ERC721 contracts across multiple blockchain networks.

## Features

- Track all NFT transfers (mints, transfers, burns)
- Monitor NFT ownership by address
- Track holder balances per NFT collection
- Record complete transfer history
- Support for multiple chains (Berachain, Ethereum, BSC)

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure NFT Contract

Before deploying, you need to configure the NFT contract address for your target chain:

**Option A: Edit configuration file directly**

Edit the appropriate config file for your chain:
- Berachain: `config/berachain.ts`
- Ethereum: `config/ethereum.ts`
- BSC: `config/bsc.ts`

Replace the placeholder address with your NFT contract address:

```typescript
export const config = {
  network: 'berachain-mainnet',
  nftContractAddress: '0xYourNFTContractAddress', // Replace this
  startBlock: 0, // Optionally set start block for faster indexing
} as const
```

**Option B: Use the deployment script**

The deployment script will generate the `subgraph.yaml` based on your configuration.

### 3. Generate Subgraph Configuration

Run the deployment script with your chosen chain and contract address:

```bash
# For Berachain
CHAIN=berachain yarn deploy:chain

# For Ethereum
CHAIN=ethereum yarn deploy:chain

# For BSC
CHAIN=bsc yarn deploy:chain
```

This command will:
1. Generate `subgraph.yaml` from the template
2. Run code generation (`yarn codegen`)
3. Build the subgraph (`yarn build`)
4. Deploy to Goldsky

### 4. Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Generate types from GraphQL schema
yarn codegen

# Build the subgraph
yarn build

# Deploy using Goldsky
goldsky subgraph deploy nft-tracker-<chain>/<version> --path ./
```

## Configuration

### Chain Configurations

Each chain has its own configuration file in `config/`:

- `berachain.ts` - Berachain mainnet
- `ethereum.ts` - Ethereum mainnet
- `bsc.ts` - Binance Smart Chain

### Adding a New Chain

1. Create a new config file in `config/` (e.g., `config/polygon.ts`)
2. Add the configuration:

```typescript
export const config = {
  network: 'matic', // Network name for The Graph
  nftContractAddress: '0xYourNFTContractAddress',
  startBlock: 0,
} as const
```

3. Update `config/index.ts`:

```typescript
import { config as polygon } from './polygon'

export const configs = {
  berachain,
  ethereum,
  bsc,
  polygon // Add new chain
} as const
```

4. Deploy:

```bash
CHAIN=polygon VERSION=1.0.0 yarn deploy:chain
```

## GraphQL Schema

### Entities

**NFTContract**
- Tracks NFT collection metadata
- Total supply and holder count
- Transfer statistics

**NFTToken**
- Individual NFT token data
- Current owner
- Token URI
- Mint timestamp and block

**NFTHolder**
- Holder address and balance
- List of owned tokens
- Transfer history

**NFTTransfer**
- Complete transfer record
- From/To addresses
- Transaction hash and timestamp
- Block number

### Example Queries

**Get all NFTs owned by an address:**

```graphql
{
  nftHolders(where: { address: "0x..." }) {
    address
    balance
    tokens {
      tokenId
      tokenURI
      contract {
        name
        symbol
      }
    }
  }
}
```

**Get transfer history for a token:**

```graphql
{
  nftToken(id: "0xcontract-123") {
    tokenId
    owner {
      address
    }
    transfers(orderBy: timestamp, orderDirection: desc) {
      from {
        address
      }
      to {
        address
      }
      timestamp
      transactionHash
    }
  }
}
```

**Get NFT collection stats:**

```graphql
{
  nftContract(id: "0xcontract") {
    name
    symbol
    totalSupply
    holderCount
    transferCount
  }
}
```

## Development

### Running Tests

```bash
yarn test
```

### Code Generation

After modifying `schema.graphql`:

```bash
yarn codegen
```

## Directory Structure

```
NFT_tracker/
├── abis/                  # Contract ABIs
│   └── ERC721.json
├── config/                # Chain configurations
│   ├── berachain.ts
│   ├── ethereum.ts
│   ├── bsc.ts
│   └── index.ts
├── scripts/               # Deployment scripts
│   ├── deploy.ts
│   └── tsconfig.json
├── src/
│   ├── mappings/          # Event handlers
│   │   └── nft.ts
│   ├── utils/             # Helper functions
│   │   └── helpers.ts
│   └── types/             # Generated types (after codegen)
├── tests/                 # Test files
├── schema.graphql         # GraphQL schema
├── subgraph.template.yaml # Template for multi-chain deployment
├── package.json
└── tsconfig.json
```

## Environment Variables

When deploying, you can use environment variables:

```bash
# Set the chain (required)
export CHAIN=berachain

# Set the version (optional, used in deployment name)
export VERSION=1.0.0

# Deploy
yarn deploy:chain
```

## Troubleshooting

**Error: "Please specify a chain"**
- Make sure to set the `CHAIN` environment variable
- Example: `CHAIN=berachain yarn deploy:chain`

**Error: "Unsupported chain"**
- Check that your chain name matches one in `config/index.ts`
- Available chains: berachain, ethereum, bsc

**NFT Contract Address is 0x0000...**
- You need to update the contract address in your chain config file
- See "Configure NFT Contract" section above

## License

GPL-3.0-or-later
