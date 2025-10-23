import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { configs } from '../config'

const subgraphTemplatePath = path.join(__dirname, '../subgraph.template.yaml')
const subgraphOutputPath = path.join(__dirname, '../subgraph.yaml')

// Get the chain and version from command line arguments
const chain = process.argv[2] as keyof typeof configs
const version = process.argv[3]

if (!chain) {
  console.error('Please specify a chain (e.g., berachain, ethereum, bsc)')
  console.error('Usage: CHAIN=berachain VERSION=1.0.0 yarn deploy:chain')
  process.exit(1)
}

if (!version) {
  console.error('Please specify a version')
  console.error('Usage: CHAIN=berachain VERSION=1.0.0 yarn deploy:chain')
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
console.log('📝 Generating subgraph.yaml...')
let subgraphTemplate = fs.readFileSync(subgraphTemplatePath, 'utf8')
subgraphTemplate = subgraphTemplate
  .replace(/\${NETWORK}/g, chainConfig.network)
  .replace(/\${NFT_CONTRACT_ADDRESS}/g, chainConfig.nftContractAddress)
  .replace(/\${START_BLOCK}/g, chainConfig.startBlock.toString())

fs.writeFileSync(subgraphOutputPath, subgraphTemplate)
console.log(`✅ Generated subgraph.yaml for ${chain}`)
console.log(`   NFT Name: ${chainConfig.nftName}`)
console.log(`   Network: ${chainConfig.network}`)
console.log(`   NFT Contract Address: ${chainConfig.nftContractAddress}`)
console.log(`   Start Block: ${chainConfig.startBlock}`)

// Run codegen
console.log('\n🔧 Running codegen...')
execSync('yarn codegen', { stdio: 'inherit' })

// Run build
console.log('\n🔨 Building subgraph...')
execSync('yarn build', { stdio: 'inherit' })

// Deploy
const deploymentName = `${chainConfig.nftName}-${chain}/${version}`
console.log(`\n🚀 Deploying to Goldsky: ${deploymentName}`)
execSync(`goldsky subgraph deploy ${deploymentName} --path ./`, { stdio: 'inherit' })

console.log(`\n✅ Successfully deployed ${deploymentName}!`)
