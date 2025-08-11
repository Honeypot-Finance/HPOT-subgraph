export const config = {
  network: 'bsc',
  factoryAddress: '0xE8B1932CecF2d3fB85033135D72c728893c80D86',
  nonfungiblePositionManagerAddress: '0x559066e029787e27153BC99Dcf9E540111F346f4', // TODO: Add BSC NFT position manager
  pot2pumpFactoryAddress: '0xB192af2225791c439CB2024290158d3202DbcD95', // BSC POT2PUMP factory
  ichiVaultFactoryAddress: '0x4fdD224DD6A7CcBdeAA7ae1be3257EC10456d042', // TODO: Add ICHI vault factory address
  startBlock: 56151190,

  // Pricing configuration
  wnativeAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  stableNativePool: '0x568e7d3811a78a5edbdb07df869f3ab0d793a786', // TODO: Add main stable-WBNB pool
  minimumNativeLocked: '0',
  whitelistTokens: [
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'.toLowerCase(), // WBNB
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'.toLowerCase() // USDC
  ],
  stableCoins: [
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'.toLowerCase() // USDC
  ]
} as const
