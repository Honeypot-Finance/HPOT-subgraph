# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a multi-chain subgraph collection for the HPOT ecosystem built using The Graph Protocol. The repository contains 7 subgraphs that index DeFi data across Berachain, Ethereum, and BSC chains.

## Key Subgraphs

- **Algebra**: Core DEX subgraph for Algebra-based AMM pools and ICHI vaults
- **AlgebraFarming**: Farming and staking rewards tracking
- **BGTMarket**: BGT (Berachain Gas Token) marketplace
- **LBP**: Liquidity Bootstrap Pool functionality
- **WasabeeIDO**: Initial DEX Offering platform
- **blocklytics**: Block data analytics
- **limits**: Limit order functionality

## Development Commands

### Common Commands (run from each subgraph directory)

```bash
# Install dependencies
yarn install

# Generate TypeScript types from GraphQL schema
yarn codegen

# Build the subgraph
yarn build

# Run tests using matchstick-as framework
yarn test

# Deploy to specific chain (example: Berachain)
CHAIN=berachain VERSION=1.0.0 yarn deploy:chain
```

### Multi-chain Deployment

Each subgraph uses a template-based configuration system:
1. Edit chain config in `config/{chainname}.ts`
2. Template at `subgraph.template.yaml` generates `subgraph.yaml`
3. Deploy script uses Goldsky for hosting

## Architecture

### Directory Structure per Subgraph
- `schema.graphql`: GraphQL schema defining entities
- `subgraph.template.yaml`: Multi-chain deployment template
- `config/`: Chain-specific configurations (berachain.ts, ethereum.ts, bsc.ts)
- `src/mappings/`: Event handlers for smart contract events
- `src/utils/`: Shared utility functions
- `abis/`: Smart contract ABIs
- `tests/`: Matchstick test files

### Key Patterns

**Multi-chain Configuration**: Each subgraph has a config/index.ts that exports chain-specific configurations. The deployment script uses these to generate the final subgraph.yaml.

**Event Mapping**: All smart contract event handlers are in src/mappings/. Each handler updates the subgraph's entities based on blockchain events.

**Price Tracking**: The Algebra subgraph implements USD pricing through whitelisted tokens and maintains price history.

**Position Management**: NFT-based liquidity positions are tracked with detailed metadata including fees, liquidity amounts, and tick ranges.

## Technology Stack

- **Language**: AssemblyScript/TypeScript for mappings
- **Testing**: Matchstick framework
- **Deployment**: Goldsky platform
- **Chains**: Berachain (primary), Ethereum, BSC

## Important Notes

- Always run `yarn codegen` after modifying schema.graphql
- Test changes locally with `yarn test` before deployment
- Chain configurations must match deployed contract addresses
- Subgraph versions should be incremented for each deployment
- The Pot2Pump feature in Algebra tracks meme token creation and bonding curves