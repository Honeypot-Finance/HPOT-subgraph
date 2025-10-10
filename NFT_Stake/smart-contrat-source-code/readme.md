# NFT Staking Protocol

This repository implements an NFT staking protocol where users can stake ERC-721 NFTs to earn ERC-20 reward tokens. Stakers accrue rewards over time, with a multiplier for longer staking durations. Users may also burn their staked NFTs for an additional bonus.

## Features

- **NFT Staking:** Stake ERC-721 NFTs in [`NFTStaking`](src/NFTStaking.sol) to earn rewards.
- **Reward Token:** ERC-20 token ([`RewardsToken`](src/RewardsToken.sol)) minted by the staking contract.
- **Claiming Rewards:** Rewards accrue as $rewardRatePerSecond \times \Delta t \times multiplier(elapsed)$, with $multiplier = 1 + \lfloor elapsed / 30\,days \rfloor$.
- **Burn Bonus:** Burn staked NFTs for an extra bonus ($burnBonusBps$ basis points).
- **Security:** Uses OpenZeppelin’s `ReentrancyGuard`, safe transfers, and owner-managed parameters.
- **Upgradeable Parameters:** Owner can update reward rate and burn bonus.

## Repository Structure

- [`src/NFTStaking.sol`](src/NFTStaking.sol): Main staking contract.
- [`src/RewardsToken.sol`](src/RewardsToken.sol): ERC-20 rewards token contract.
- [`src/mocks/MockNFT.sol`](src/mocks/MockNFT.sol): Mock ERC-721 NFT for testing.
- [`script/Deploy.s.sol`](script/Deploy.s.sol): Deployment script (stub).
- [`test/NFTStaking.t.sol`](test/NFTStaking.t.sol): Foundry unit tests.
- [`docs/staking-protocol.md`](docs/staking-protocol.md): Protocol summary and runbook.

## Usage

### Build

```sh
forge build
```

### Test

```sh
forge test -vv
```

### Deploy

```sh
forge script script/Deploy.s.sol ...
```

## Protocol Summary

See [`docs/staking-protocol.md`](docs/staking-protocol.md) for details.

## TODO

- Add rarity mapping to calculate rewards based on NFT rarity.
- Consider contract upgradability.