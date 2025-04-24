# LBP Subgraph

## Build

Before build you need to make a few changes:

- Update network, startBlock and addresses in subgraph.yaml
- Update configuration in `config/` directory for your target chain

After that you need to run:

```bash
$ yarn
$ yarn codegen
$ yarn build
```

## Deploy

For deploy you need to run:

```bash
# First, make sure you're logged in to Goldsky
goldsky login

# Deploy with custom version and chain
CHAIN=berachain VERSION=1.0.0 yarn deploy:chain
# or
CHAIN=ethereum VERSION=1.0.0 yarn deploy:chain

# You can use any version number format, for example:
CHAIN=berachain VERSION=2.1.0-beta yarn deploy:chain
CHAIN=ethereum VERSION=mainnet-v1 yarn deploy:chain
```

The deployment will:

1. Generate the appropriate subgraph.yaml based on your chain configuration
2. Deploy to Goldsky with your specified version and chain name

## Configuration

Chain-specific configurations are stored in the `config/` directory:

- `config/berachain.ts` - Configuration for Berachain
- `config/ethereum.ts` - Configuration for Ethereum

To add a new chain:

1. Create a new configuration file in `config/` (e.g., `polygon.ts`)
2. Deploy using the new chain name with your desired version:
   ```bash
   CHAIN=polygon VERSION=1.0.0 yarn deploy:chain
   ```

## Test

```bash
yarn test
```
