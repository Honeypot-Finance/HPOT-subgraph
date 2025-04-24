import fs from 'fs'
import path from 'path'
import { configs } from '../config'

const templatePath = path.join(__dirname, '../subgraph.template.yaml')
const outputPath = path.join(__dirname, '../subgraph.yaml')

// Get the chain from command line arguments
const chain = process.argv[2] as keyof typeof configs
if (!chain) {
  console.error('Please specify a chain (e.g., berachain-mainnet, mainnet)')
  process.exit(1)
}

// Get the appropriate config based on the chain
const chainConfig = configs[chain]

if (!chainConfig) {
  console.error(`Unsupported chain: ${chain}`)
  process.exit(1)
}

// Read the template
let template = fs.readFileSync(templatePath, 'utf8')

// Replace all placeholders with config values
template = template
  .replace(/\${NETWORK}/g, chainConfig.network)
  .replace(/\${MARKET_ADDRESS}/g, chainConfig.marketAddress)
  .replace(/\${START_BLOCK}/g, chainConfig.startBlock.toString())

// Write the final subgraph.yaml
fs.writeFileSync(outputPath, template)
console.log(`Generated subgraph.yaml for ${chain}`)
