import fs from 'fs'
import path from 'path'
import { configs } from '../config'

const subgraphTemplatePath = path.join(__dirname, '../subgraph.template.yaml')
const subgraphOutputPath = path.join(__dirname, '../subgraph.yaml')

// Get the chain from command line arguments
const chain = process.argv[2] as keyof typeof configs
if (!chain) {
  console.error('Please specify a chain (e.g., berachain, ethereum, bsc)')
  process.exit(1)
}

// Get the appropriate config based on the chain
const chainConfig = configs[chain]

if (!chainConfig) {
  console.error(`Unsupported chain: ${chain}`)
  console.error(`Available chains: ${Object.keys(configs).join(', ')}`)
  process.exit(1)
}

// Generate subgraph.yaml
let subgraphTemplate = fs.readFileSync(subgraphTemplatePath, 'utf8')
subgraphTemplate = subgraphTemplate
  .replace(/\${NETWORK}/g, chainConfig.network)
  .replace(/\${STAKING_CONTRACT_ADDRESS}/g, chainConfig.stakingContractAddress)
  .replace(/\${NFT_CONTRACT_ADDRESS}/g, chainConfig.nftContractAddress)
  .replace(/\${START_BLOCK}/g, chainConfig.startBlock.toString())

fs.writeFileSync(subgraphOutputPath, subgraphTemplate)
console.log(`Generated subgraph.yaml for ${chain}`)
console.log(`Network: ${chainConfig.network}`)
console.log(`Staking Contract Address: ${chainConfig.stakingContractAddress}`)
console.log(`NFT Contract Address: ${chainConfig.nftContractAddress}`)
console.log(`Start Block: ${chainConfig.startBlock}`)
