

- Rewards: ERC-20 minted by `NFTStaking` via MINTER_ROLE.
- Staking: Users deposit ERC-721 into `NFTStaking`.
- Claim: Accrues at `rewardRatePerSecond * delta * multiplier(elapsed)` with multiplier = `1 + floor(elapsed/30d)`. Parameter changes are epoch-based and only affect time after the change (non-retroactive).
- Burn: Burns NFT for additional bonus (`burnBonusBps`) on accrued rewards. Bonus uses epoch-based parameters over the accrual window (non-retroactive).
- Security: ReentrancyGuard, safe transfers, owner-managed parameters.

Runbook
- Build: `forge build`
- Test: `forge test -vv`
- Deploy (stub): `forge script script/Deploy.s.sol ...`
