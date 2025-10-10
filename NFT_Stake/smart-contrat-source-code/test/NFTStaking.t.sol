// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/src/Test.sol";
import {NFTStaking} from "../src/NFTStaking.sol";
import {RewardsToken} from "../src/RewardsToken.sol";
import {MockNFT} from "../src/mocks/MockNFT.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract NFTStakingTest is Test {
    address internal alice = address(0xA11CE);
    address internal owner = address(this);

    MockNFT internal nft;
    RewardsToken internal rwd;
    NFTStaking internal staking;

    uint256 internal rate = 1e18 / uint256(1 days); // 1 token per day
    uint256 internal burnBps = 2_000; // +20%

    function setUp() public {
        nft = new MockNFT();
        rwd = new RewardsToken("Rewards", "RWD", owner);

        // Deploy implementation
        NFTStaking implementation = new NFTStaking();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            NFTStaking.initialize.selector,
            nft,
            rwd,
            rate,
            burnBps,
            owner
        );

        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        staking = NFTStaking(address(proxy));

        rwd.grantRole(rwd.MINTER_ROLE(), address(staking));

        // mint NFT to alice
        vm.prank(alice);
        uint256 id = nft.mint(alice);
        assertEq(id, 1);
        // approve staking contract
        vm.prank(alice);
        nft.setApprovalForAll(address(staking), true);
    }

    function testStakeAndClaimAfter31Days() public {
        vm.startPrank(alice);
        staking.stake(1);
        vm.warp(block.timestamp + 31 days);
        uint256 balBefore = rwd.balanceOf(alice);
        uint256 claimed = staking.claim(1);
        uint256 balAfter = rwd.balanceOf(alice);
        assertEq(balAfter - balBefore, claimed);

        // expected: rate * delta * multiplier; multiplier = 1 + floor(elapsed/30 days)
        uint256 delta = 31 days;
        uint256 elapsed = 31 days;
        uint256 m = 1e18 + (elapsed / 30 days) * 1e18; // = 2e18
        uint256 expected = (rate * delta * m) / 1e18;
        assertEq(claimed, expected);
        vm.stopPrank();
    }

    function testUnstakeReturnsNFT() public {
        vm.startPrank(alice);
        staking.stake(1);
        vm.warp(block.timestamp + 2 days);
        staking.unstake(1);
        assertEq(nft.ownerOf(1), alice);
        vm.stopPrank();
    }

    function testBurnThenAccrueBonusAndClaim() public {
        vm.startPrank(alice);
        staking.stake(1);
        vm.warp(block.timestamp + 45 days);

        uint256 balBefore = rwd.balanceOf(alice);
        staking.burn(1);
        // burn() claims all pending staking rewards first
        uint256 stakingRewards = rwd.balanceOf(alice) - balBefore;
        assertTrue(stakingRewards > 0); // should have earned rewards for 45 days

        // after 12 days, preview should equal base+bonus accrual since burn
        vm.warp(block.timestamp + 12 days);
        uint256 sinceBurn = 12 days;
        uint256 mBurn = 1e18 + (sinceBurn / 30 days) * 1e18; // still 1e18
        uint256 expectedBonus = (rate * sinceBurn * mBurn * (10_000 + burnBps)) /
            (1e18 * 10_000);
        uint256 due = staking.previewPayout(1);
        assertEq(due, expectedBonus);

        // claim burn bonus via aggregated claim()
        uint256 balBeforeBonusClaim = rwd.balanceOf(alice);
        uint256 claimed = staking.claim(1);
        uint256 balAfter = rwd.balanceOf(alice);
        assertEq(claimed, expectedBonus);
        assertEq(balAfter - balBeforeBonusClaim, expectedBonus);
        vm.stopPrank();
    }

    function testRevertsIfNotOwnerActions() public {
        vm.startPrank(alice);
        staking.stake(1);
        vm.stopPrank();

        vm.expectRevert();
        staking.claim(1);

        vm.expectRevert();
        staking.unstake(1);

        vm.expectRevert();
        staking.burn(1);
    }

    function testEpochingPreventsRetroactiveIncrease() public {
        vm.startPrank(alice);
        staking.stake(1);
        vm.stopPrank();

        // After 10 days, increase rate 2x
        vm.warp(block.timestamp + 10 days);
        staking.setParameters(rate * 2, burnBps);

        // After another 10 days, claim
        vm.startPrank(alice);
        vm.warp(block.timestamp + 10 days);
        uint256 claimed = staking.claim(1);
        vm.stopPrank();

        // Multiplier at 20 days is still 1e18
        uint256 m = 1e18; // floor(20/30)=0
        uint256 expectedBase = rate * 10 days + (rate * 2) * 10 days;
        uint256 expected = (expectedBase * m) / 1e18;
        assertEq(claimed, expected);
    }

    function testEpochingPreventsRetroactiveDecrease() public {
        vm.startPrank(alice);
        staking.stake(1);
        vm.stopPrank();

        // After 10 days, decrease rate 2x -> 0.5x
        vm.warp(block.timestamp + 10 days);
        staking.setParameters(rate / 2, burnBps);

        // After another 10 days, claim
        vm.startPrank(alice);
        vm.warp(block.timestamp + 10 days);
        uint256 claimed = staking.claim(1);
        vm.stopPrank();

        // Multiplier at 20 days is still 1e18
        uint256 m = 1e18; // floor(20/30)=0
        uint256 expectedBase = rate * 10 days + (rate / 2) * 10 days;
        uint256 expected = (expectedBase * m) / 1e18;
        assertEq(claimed, expected);
    }

    function testBurnBonusPiecewiseAcrossParamChange() public {
        // Stake and accrue some time, then burn
        vm.startPrank(alice);
        staking.stake(1);
        vm.warp(block.timestamp + 7 days);
        // Claim all normal rewards and start burn accrual
        staking.burn(1);

        // After 5 days of burn, change both rate and bps
        vm.warp(block.timestamp + 5 days);
        uint256 newRate = rate * 2;
        uint256 newBps = burnBps / 2; // reduce bonus
        vm.stopPrank();
        staking.setParameters(newRate, newBps);

        // After another 5 days, claim burn bonus
        vm.startPrank(alice);
        vm.warp(block.timestamp + 5 days);
        uint256 claimed = staking.claim(1);
        vm.stopPrank();

        // Expected: piecewise base + extra bonus, then apply multiplier with total burn duration = 10 days
        uint256 seg1 = rate * (5 days) + (rate * (5 days) * burnBps) / 10_000;
        uint256 seg2 = newRate * (5 days) + (newRate * (5 days) * newBps) / 10_000;
        uint256 baseWithBps = seg1 + seg2;
        uint256 mBurn = 1e18; // floor(10/30)=0
        uint256 expected = (baseWithBps * mBurn) / 1e18;
        assertEq(claimed, expected);
    }

    function testBurnRewardsExceedStakeForEqualDuration() public {
        // Use snapshot/revert to run two scenarios from identical start time and state
        uint256 snap = vm.snapshot();
        uint256 D = 31 days; // ensures multiplier step aligns in both modes

        // Scenario A: Stake-only for D days
        vm.startPrank(alice);
        staking.stake(1);
        vm.warp(block.timestamp + D);
        uint256 stakeClaim = staking.claim(1);
        vm.stopPrank();

        // Revert to snapshot, then run Scenario B starting at identical timestamp
        vm.revertTo(snap);
        vm.startPrank(alice);
        // Direct burn without staking first
        staking.burn(1);
        vm.warp(block.timestamp + D);
        uint256 burnClaim = staking.claim(1);
        vm.stopPrank();

        // Burn rewards should strictly exceed stake rewards for same duration
        assertGt(burnClaim, stakeClaim);
    }
}
