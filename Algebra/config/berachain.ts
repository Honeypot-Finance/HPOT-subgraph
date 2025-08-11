export const config = {
  network: 'berachain-mainnet',
  factoryAddress: '0x7d53327D78EFD0b463bd8d7dc938C52402323b95', // Berachain factory address
  nonfungiblePositionManagerAddress: '0xBB203aADbE36C125028a54584f5d48C1764317D0', // Berachain NFT position manager
  pot2pumpFactoryAddress: '0xC38eF79A6cA9b3EfBe20F3dD3b99B3e25d09F52B', // Berachain POT2PUMP factory
  ichiVaultFactoryAddress: '0x1bf5e51eCacdfEA65ae9276fd228bB8719ffcA7E', // TODO: Add ICHI vault factory address
  startBlock: 0,
  
  // Pricing configuration
  wnativeAddress: '0x6969696969696969696969696969696969696969', // WBERA
  stableNativePool: '0xB6B6E240291A4d433A94279C1A68F85e2BF24857', // Honey-WBERA Pool
  minimumNativeLocked: '0',
  whitelistTokens: [
    '0x6969696969696969696969696969696969696969'.toLowerCase(), // WBERA
    '0x9b37d542114070518a44e200fdcd8e4be737297f'.toLowerCase(), // Hpot
    '0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce'.toLowerCase(), // Honey
    '0x549943e04f40284185054145c6E4e9568C1D3241'.toLowerCase(), // USDC
    '0x656b95E550C07a9ffe548bd4085c72418Ceb1dba'.toLowerCase(), // BGT
    '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'.toLowerCase(), // WBTC
    '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590'.toLowerCase()  // WETH
  ],
  stableCoins: [
    '0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce'.toLowerCase(), // Honey
    '0x549943e04f40284185054145c6E4e9568C1D3241'.toLowerCase()  // USDC
  ]
} as const
