import fs from 'fs'
import path from 'path'
import { configs } from '../config'

const subgraphTemplatePath = path.join(__dirname, '../subgraph.template.yaml')
const subgraphOutputPath = path.join(__dirname, '../subgraph.yaml')
const constantsTemplatePath = path.join(__dirname, '../src/utils/constants.template.ts')
const constantsOutputPath = path.join(__dirname, '../src/utils/constants.ts')

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

// Generate subgraph.yaml
let subgraphTemplate = fs.readFileSync(subgraphTemplatePath, 'utf8')
subgraphTemplate = subgraphTemplate
  .replace(/\${NETWORK}/g, chainConfig.network)
  .replace(/\${FACTORY_ADDRESS}/g, chainConfig.factoryAddress)
  .replace(/\${NONFUNGIBLE_POSITION_MANAGER_ADDRESS}/g, chainConfig.nonfungiblePositionManagerAddress)
  .replace(/\${POT2PUMP_FACTORY_ADDRESS}/g, chainConfig.pot2pumpFactoryAddress)
  .replace(/\${ICHI_VAULT_FACTORY_ADDRESS}/g, chainConfig.ichiVaultFactoryAddress)
  .replace(/\${START_BLOCK}/g, chainConfig.startBlock.toString())

fs.writeFileSync(subgraphOutputPath, subgraphTemplate)
console.log(`Generated subgraph.yaml for ${chain}`)

// Generate constants.ts
let constantsTemplate = fs.readFileSync(constantsTemplatePath, 'utf8')
constantsTemplate = constantsTemplate
  .replace(/\${FACTORY_ADDRESS}/g, chainConfig.factoryAddress)
  .replace(/\${NONFUNGIBLE_POSITION_MANAGER_ADDRESS}/g, chainConfig.nonfungiblePositionManagerAddress)
  .replace(/\${POT2PUMP_FACTORY_ADDRESS}/g, chainConfig.pot2pumpFactoryAddress)
  .replace(/\${ICHI_VAULT_FACTORY_ADDRESS}/g, chainConfig.ichiVaultFactoryAddress)

fs.writeFileSync(constantsOutputPath, constantsTemplate)
console.log(`Generated constants.ts for ${chain}`)
