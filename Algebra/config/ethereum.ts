export const config = {
  network: 'mainnet',
  factoryAddress: '0x...', // Replace with actual Ethereum factory address
  nonfungiblePositionManagerAddress: '0x...', // Replace with actual Ethereum NFT position manager
  pot2pumpFactoryAddress: '0x...', // Replace with actual Ethereum POT2PUMP factory address
  ichiVaultFactoryAddress: '0x...', // Replace with actual Ethereum ICHI vault factory address
  startBlock: 0,
  
  // Pricing configuration
  wnativeAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  stableNativePool: '0x0000000000000000000000000000000000000000', // TODO: Add main USDC-WETH pool
  minimumNativeLocked: '0',
  whitelistTokens: [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase(), // WETH
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(), // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(), // USDT
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(), // DAI
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase()  // WBTC
  ],
  stableCoins: [
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(), // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(), // USDT
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase()  // DAI
  ]
} as const
