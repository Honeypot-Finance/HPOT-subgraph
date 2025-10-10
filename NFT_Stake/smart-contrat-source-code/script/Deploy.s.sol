// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// Note: This is a stub. Requires forge-std if you want to run it.
// import {Script} from "forge-std/Script.sol";
import {NFTStaking} from "../src/NFTStaking.sol";
import {RewardsToken} from "../src/RewardsToken.sol";
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

/* is Script */ contract Deploy {
    function run(
        address nft,
        uint256 ratePerSecond,
        uint256 burnBonusBps,
        string memory name,
        string memory symbol
    ) external returns (NFTStaking staking, RewardsToken rToken) {
        address deployer = msg.sender;
        staking = new NFTStaking();
        rToken = new RewardsToken(name, symbol, deployer);
        staking.initialize(
            IERC721(nft),
            rToken,
            ratePerSecond,
            burnBonusBps,
            deployer
        );
    }
}
