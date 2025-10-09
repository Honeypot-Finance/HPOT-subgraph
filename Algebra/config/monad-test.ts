const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const config = {
  network: 'monad-testnet',
  factoryAddress: '0xad88d4abbe0d0672f00eb3b83e6518608d82e95d', // Berachain factory address
  nonfungiblePositionManagerAddress: '0x656d1e21c74a4abf6ddc94609dbc1f7e9d014e27', // Berachain NFT position manager
  pot2pumpFactoryAddress: '0x67457d3f5d9e9158bde427021c33a6085f35b971', // Berachain POT2PUMP factory
  ichiVaultFactoryAddress: '0x265de314f9c69498136dcf0a3e9c1a8609944533', // TODO: Add ICHI vault factory address
  startBlock: 0,

  // Pricing configuration
  wnativeAddress: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON
  stableNativePool: ADDRESS_ZERO, // Honey-WBERA Pool
  minimumNativeLocked: '0',
  whitelistTokens: [
    '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701'.toLowerCase(), // WMON
    '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'.toLowerCase() // USDC
  ],
  stableCoins: [
    '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'.toLowerCase() // USDC
  ]
} as const
