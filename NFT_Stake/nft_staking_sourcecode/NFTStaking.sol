// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuardUpgradeable} from "openzeppelin-contracts-upgradeable/contracts/utils/ReentrancyGuardUpgradeable.sol";
import {OwnableUpgradeable} from "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
import {RewardsToken} from "./RewardsToken.sol";

interface IERC721Burnable {
    function burn(uint256 tokenId) external;
}

contract NFTStaking is
    Initializable,
    IERC721Receiver,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    struct StakeData {
        address owner;
        uint64 stakedAt;
        uint64 lastClaimAt;
        bool burned;
        uint64 burnedAt; // timestamp when burn() was called
        uint64 lastBurnClaimAt; // timestamp of last burn reward claim
    }

    event Staked(address indexed user, uint256 indexed tokenId);
    event Unstaked(address indexed user, uint256 indexed tokenId);
    event RewardClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );
    event Burned(address indexed user, uint256 indexed tokenId);
    event BurnRewardClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );
    event ParametersUpdated(uint256 rewardRatePerSecond, uint256 burnBonusBps);
    event StakedFor(
        address indexed owner,
        address indexed operator,
        uint256 indexed tokenId
    );
    event UnstakedFor(
        address indexed owner,
        address indexed operator,
        uint256 indexed tokenId
    );
    event BatchStaked(
        address indexed user,
        uint256[] indexed tokenIds,
        address indexed recipient
    );
    event BatchClaimed(address indexed user, uint256[] indexed tokenIds);
    event BatchUnstaked(address indexed user, uint256[] indexed tokenIds, address indexed tokenReceiver);
    event PayoutRecipientSet(uint256 indexed tokenId, address indexed owner, address indexed recipient);
    
    // Parameter epochs to prevent retroactive mispricing
    struct ParamEpoch {
        uint64 start; // inclusive start timestamp
        uint256 rewardRatePerSecond;
        uint256 burnBonusBps;
    }

    IERC721 public nft;
    RewardsToken public rewards;

    // Rewards per second in token wei
    uint256 public rewardRatePerSecond;
    // Additional bonus for burned NFTs (in basis points, 10000 = 100%)
    uint256 public burnBonusBps; // e.g., 2000 = +20%

    // tokenId => stake data
    mapping(uint256 => StakeData) public stakes;

    uint256 private constant ONE = 1e18;
    uint256 private constant MAX_BPS = 10_000;
    uint256 private constant THIRTY_DAYS = 30 days;
    uint256 private constant MAX_MULTIPLIER = 3 * ONE; // 3x max multiplier

    // History of parameter epochs, sorted by `start` ascending
    ParamEpoch[] internal _paramEpochs;

    // Optional payout override for a given tokenId; defaults to stake owner when unset
    mapping(uint256 => address) public payoutRecipient;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IERC721 _nft,
        RewardsToken _rewards,
        uint256 _ratePerSecond,
        uint256 _burnBonusBps,
        address initialOwner
    ) public reinitializer(2) {
        require(address(_nft) != address(0), "ZERO_NFT");
        require(address(_rewards) != address(0), "ZERO_REWARDS");
        require(_burnBonusBps <= MAX_BPS, "BPS_EXCEEDS_MAX");
        require(_ratePerSecond > 0, "ZERO_RATE");

        __ReentrancyGuard_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        nft = _nft;
        rewards = _rewards;
        rewardRatePerSecond = _ratePerSecond;
        burnBonusBps = _burnBonusBps;

        // Initialize first epoch at deployment time
        // _paramEpochs.push(
        //     ParamEpoch({
        //         start: uint64(block.timestamp),
        //         rewardRatePerSecond: _ratePerSecond,
        //         burnBonusBps: _burnBonusBps
        //     })
        // );

        emit ParametersUpdated(_ratePerSecond, _burnBonusBps);
    }

    // Multiplier calculation: 1 + (duration / 30 days), capped at MAX_MULTIPLIER
    function _multiplier(uint256 duration) internal pure returns (uint256) {
        uint256 multiplier = ONE + (duration / THIRTY_DAYS) * ONE;
        return multiplier > MAX_MULTIPLIER ? MAX_MULTIPLIER : multiplier;
    }

    // Preview pending rewards for a token
    function previewPayout(uint256 tokenId) external view returns (uint256) {
        StakeData memory s = stakes[tokenId];
        if (s.owner == address(0)) return 0;
        (uint256 amt, ) = _pendingAmount(s, block.timestamp);
        return amt;
    }

    // Shared computation for pending amount at `nowTs` from current stake state.
    // Returns (amount, isBurnMode)
    function _pendingAmount(
        StakeData memory s,
        uint256 nowTs
    ) internal view returns (uint256 amount, bool isBurn) {
        if (s.burned) {
            isBurn = true;
            if (s.burnedAt == 0) return (0, true);
            uint256 lastBurnClaim = s.lastBurnClaimAt == 0
                ? s.burnedAt
                : s.lastBurnClaimAt;
            if (nowTs <= lastBurnClaim) return (0, true);

            // Multiplier based on total time since burn (preserves accumulated duration)
            uint256 totalBurnDuration = nowTs - uint256(s.burnedAt);
            uint256 mBurn = _multiplier(totalBurnDuration);

            // Piecewise across parameter epochs: sum(rate * delta * (MAX_BPS + bps)) / MAX_BPS
            // i.e., base emissions plus bonus, not just the bonus fraction
            uint256 baseWithBps = _accrueBaseWithBps(lastBurnClaim, nowTs);
            // baseWithBps is now rate*seconds scaled by (MAX_BPS + burn bps)/MAX_BPS, so only divide by ONE here
            amount = (baseWithBps * mBurn) / ONE;
            return (amount, true);
        }

        // Normal staking
        if (nowTs <= s.lastClaimAt) return (0, false);
        uint256 elapsed = nowTs - uint256(s.stakedAt);
        uint256 m = _multiplier(elapsed);
        uint256 base = _accrueBase(s.lastClaimAt, nowTs);
        amount = (base * m) / ONE;
        return (amount, false);
    }

    // Update parameters (only owner)
    function setParameters(
        uint256 _ratePerSecond,
        uint256 _burnBonusBps
    ) external onlyOwner {
        require(_burnBonusBps <= MAX_BPS, "BPS_EXCEEDS_MAX");
        require(_ratePerSecond > 0, "ZERO_RATE");

        rewardRatePerSecond = _ratePerSecond;
        burnBonusBps = _burnBonusBps;

        // Start a new epoch at current timestamp
        _paramEpochs.push(
            ParamEpoch({
                start: uint64(block.timestamp),
                rewardRatePerSecond: _ratePerSecond,
                burnBonusBps: _burnBonusBps
            })
        );

        emit ParametersUpdated(_ratePerSecond, _burnBonusBps);
    }

    // Sum rate * seconds across epochs overlapping [startTs, endTs)
    function _accrueBase(
        uint256 startTs,
        uint256 endTs
    ) internal view returns (uint256 sum) {
        if (endTs <= startTs) return 0;
        uint256 len = _paramEpochs.length;
        if (len == 0) {
            // Fallback to current values (should not happen post-initialize)
            return rewardRatePerSecond * (endTs - startTs);
        }
        for (uint256 i = 0; i < len; i++) {
            ParamEpoch memory e = _paramEpochs[i];
            uint256 epochStart = uint256(e.start);
            uint256 epochEnd = i + 1 < len
                ? uint256(_paramEpochs[i + 1].start)
                : type(uint256).max;
            if (epochStart >= endTs) break; // epochs are ordered by start
            if (epochEnd <= startTs) continue;
            uint256 segStart = startTs > epochStart ? startTs : epochStart;
            uint256 segEnd = endTs < epochEnd ? endTs : epochEnd;
            uint256 delta = segEnd - segStart;
            sum += e.rewardRatePerSecond * delta;
        }
    }

    // Sum rate * seconds * bps across epochs overlapping [startTs, endTs)
    function _accrueBaseWithBps(
        uint256 startTs,
        uint256 endTs
    ) internal view returns (uint256 sum) {
        if (endTs <= startTs) return 0;
        uint256 len = _paramEpochs.length;
        if (len == 0) {
            // divide early to avoid huge intermediate products; include base + bonus
            return
                (rewardRatePerSecond *
                    (endTs - startTs) *
                    (MAX_BPS + burnBonusBps)) / MAX_BPS;
        }
        for (uint256 i = 0; i < len; i++) {
            ParamEpoch memory e = _paramEpochs[i];
            uint256 epochStart = uint256(e.start);
            uint256 epochEnd = i + 1 < len
                ? uint256(_paramEpochs[i + 1].start)
                : type(uint256).max;
            if (epochStart >= endTs) break;
            if (epochEnd <= startTs) continue;
            uint256 segStart = startTs > epochStart ? startTs : epochStart;
            uint256 segEnd = endTs < epochEnd ? endTs : epochEnd;
            uint256 delta = segEnd - segStart;
            // divide by MAX_BPS per-segment to reduce chance of overflow; include base + bonus
            sum +=
                (e.rewardRatePerSecond * delta * (MAX_BPS + e.burnBonusBps)) /
                MAX_BPS;
        }
    }

    // Allow the current NFT holder to set or clear a reward recipient override while idle
    function setPayoutRecipient(uint256 tokenId, address recipient) external {
        _setPayoutRecipient(tokenId, recipient);
    }

    // Internal function to set payout recipient
    function _setPayoutRecipient(uint256 tokenId, address recipient) internal {
        StakeData memory s = stakes[tokenId];
        require(s.owner == msg.sender, "NOT_OWNER");
        payoutRecipient[tokenId] = recipient;
        emit PayoutRecipientSet(tokenId, msg.sender, recipient);
            
    }

    // Stake an NFT
    function stake(uint256 tokenId) external nonReentrant {
        require(stakes[tokenId].owner == address(0), "ALREADY_STAKED");

        // Transfer NFT from user to contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        stakes[tokenId] = StakeData({
            owner: msg.sender,
            stakedAt: uint64(block.timestamp),
            lastClaimAt: uint64(block.timestamp),
            burned: false,
            burnedAt: 0,
            lastBurnClaimAt: 0
        });

        emit Staked(msg.sender, tokenId);
    }

    function batchStake(
        uint256[] calldata tokenIds,
        address recipient
    ) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        require(tokenIds.length <= 100, "TOO_MANY_TOKENS");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(stakes[tokenIds[i]].owner == address(0), "ALREADY_STAKED");
            _stake(tokenIds[i]);
            _setPayoutRecipient(tokenIds[i], recipient);
        }

        emit BatchStaked(msg.sender, tokenIds, recipient);
    }

    function _stake(uint256 tokenId) internal {
        // Transfer NFT from user to contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        stakes[tokenId] = StakeData({
            owner: msg.sender,
            stakedAt: uint64(block.timestamp),
            lastClaimAt: uint64(block.timestamp),
            burned: false,
            burnedAt: 0,
            lastBurnClaimAt: 0
        });
    }

    // Public claim function with reentrancy guard
    function claim(uint256 tokenId) public nonReentrant returns (uint256) {
        return _claim(tokenId);
    }

    // Batch claim function
    function batchClaim(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _claim(tokenIds[i]);
        }
        emit BatchClaimed(msg.sender, tokenIds);
    }

    // Internal claim function without reentrancy guard (for internal calls)
    function _claim(uint256 tokenId) internal returns (uint256 amount) {
        StakeData storage sStore = stakes[tokenId];

        address payout = payoutRecipient[tokenId] != address(0) ? payoutRecipient[tokenId] : sStore.owner;

        require(sStore.owner == msg.sender || payout == msg.sender, "NOT_OWNER");
        // Allow claim for either staked or burn-only positions
        require(sStore.stakedAt != 0 || sStore.burned, "NOT_STAKED");

        // Compute pending using shared view logic
        StakeData memory s = sStore;
        uint256 nowTs = block.timestamp;
        (uint256 pending, bool isBurn) = _pendingAmount(s, nowTs);
        if (pending == 0) return 0;

        if (isBurn) {
            // Additional safety check for invalid state when claiming
            require(sStore.burnedAt != 0, "INVALID_BURN_STATE");
            sStore.lastBurnClaimAt = uint64(nowTs);
            // Always mint to recorded owner to avoid future permissionless claim misdirection
            rewards.mint(payout, pending);
            emit BurnRewardClaimed(sStore.owner, tokenId, pending);
        } else {
            sStore.lastClaimAt = uint64(nowTs);
            rewards.mint(payout, pending);
            emit RewardClaimed(sStore.owner, tokenId, pending);
        }
        return pending;
    }


    // Unstake NFT and claim final rewards
    function unstake(uint256 tokenId) external nonReentrant {
        StakeData memory s = stakes[tokenId];
        require(s.owner == msg.sender, "NOT_OWNER");
        require(!s.burned, "ALREADY_BURNED");
        require(s.stakedAt != 0, "NOT_STAKED");

        // Claim any pending rewards before unstaking
        _claim(tokenId);

        // Clear stake data
        delete stakes[tokenId];

        // clear payout recipient
        delete payoutRecipient[tokenId];

        // Transfer NFT back to owner
        nft.safeTransferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId);
    }

    // Internal function to unstake an NFT
    function _unstake(uint256 tokenId, address tokenReceiver) internal {
        StakeData memory s = stakes[tokenId];
        require(s.owner == msg.sender, "NOT_OWNER");
        require(!s.burned, "ALREADY_BURNED");
        require(s.stakedAt != 0, "NOT_STAKED");
        // Claim any pending rewards before unstaking
        _claim(tokenId);
        // Clear stake data
        delete stakes[tokenId];
        // clear payout recipient
        delete payoutRecipient[tokenId];
        // Transfer NFT back to owner
        nft.safeTransferFrom(address(this), tokenReceiver, tokenId);
    }

    // Batch unstake function
    function batchUnstake(uint256[] calldata tokenIds, address tokenReceiver) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _unstake(tokenIds[i], tokenReceiver);
        }

        emit BatchUnstaked(msg.sender, tokenIds, tokenReceiver);
    }

    // Burn NFT and start earning burn bonus
    function burn(uint256 tokenId) external nonReentrant {
        StakeData storage s = stakes[tokenId];
        if (s.owner == address(0)) {
            // Not previously staked: user can enter burn mode directly
            require(nft.ownerOf(tokenId) == msg.sender, "NOT_NFT_OWNER");
            // Burn from wallet (contract must be owner/operator for token)
            // IERC721Burnable(address(nft)).burn(tokenId);
            nft.safeTransferFrom(msg.sender, address(0xdead), tokenId);
            // Initialize burn-only position
            stakes[tokenId] = StakeData({
                owner: msg.sender,
                stakedAt: 0,
                lastClaimAt: 0,
                burned: true,
                burnedAt: uint64(block.timestamp),
                lastBurnClaimAt: 0
            });
            emit Burned(msg.sender, tokenId);
            return;
        }

        require(s.owner == msg.sender, "NOT_OWNER");
        require(!s.burned, "ALREADY_BURNED");

        // IMPORTANT: Claim all pending normal rewards before burning
        _claim(tokenId);

        // Burn the NFT held in custody by this contract
        // IERC721Burnable(address(nft)).burn(tokenId);
        nft.safeTransferFrom(address(this), address(0xdead), tokenId);

        // Mark as burned and set burn timestamp
        s.burned = true;
        s.burnedAt = uint64(block.timestamp);
        s.lastBurnClaimAt = 0; // Reset burn claim tracking

        emit Burned(msg.sender, tokenId);
    }

    function batchBurn(uint256[] calldata tokenIds, address recipient) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        require(tokenIds.length <= 100, "TOO_MANY_TOKENS");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _burn(tokenIds[i], recipient);
        }

        emit BatchBurned(msg.sender, tokenIds, recipient);
    }

    function _burn(uint256 tokenId, address recipient) internal {
        StakeData storage s = stakes[tokenId];
        if (s.owner == address(0)) {
            // Not previously staked: user can enter burn mode directly
            require(nft.ownerOf(tokenId) == msg.sender, "NOT_NFT_OWNER");
            // Burn from wallet (contract must be owner/operator for token)
            // IERC721Burnable(address(nft)).burn(tokenId);
            nft.safeTransferFrom(msg.sender, address(0xdead), tokenId);
            // Initialize burn-only position
            stakes[tokenId] = StakeData({
                owner: msg.sender,
                stakedAt: 0,
                lastClaimAt: 0,
                burned: true,
                burnedAt: uint64(block.timestamp),
                lastBurnClaimAt: 0
            });
            _setPayoutRecipient(tokenId, recipient);
            return;
        }

        require(s.owner == msg.sender, "NOT_OWNER");
        require(!s.burned, "ALREADY_BURNED");

        // IMPORTANT: Claim all pending normal rewards before burning
        _claim(tokenId);

        // Burn the NFT held in custody by this contract
        // IERC721Burnable(address(nft)).burn(tokenId);
        nft.safeTransferFrom(address(this), address(0xdead), tokenId);

        // Mark as burned and set burn timestamp
        s.burned = true;
        s.burnedAt = uint64(block.timestamp);
        s.lastBurnClaimAt = 0; // Reset burn claim tracking

        _setPayoutRecipient(tokenId, recipient);
    }
    

    // Stake an NFT on behalf of another user (requires approval)
    // @deprecated
    function stakeFor(address owner, uint256 tokenId) external nonReentrant {
        require(stakes[tokenId].owner == address(0), "ALREADY_STAKED");

        // Check if caller is authorized to operate this NFT
        require(
            nft.ownerOf(tokenId) == owner &&
                (nft.getApproved(tokenId) == msg.sender ||
                    nft.isApprovedForAll(owner, msg.sender)),
            "NOT_AUTHORIZED"
        );

        // Transfer NFT from owner to contract
        nft.safeTransferFrom(owner, address(this), tokenId);

        stakes[tokenId] = StakeData({
            owner: owner, // Record the real owner, not the operator
            stakedAt: uint64(block.timestamp),
            lastClaimAt: uint64(block.timestamp),
            burned: false,
            burnedAt: 0,
            lastBurnClaimAt: 0
        });

        emit StakedFor(owner, msg.sender, tokenId);
    }

    // Batch stake NFTs for a single owner (requires approval for all)
    // @deprecated
    function batchStakeFor(
        address owner,
        uint256[] calldata tokenIds
    ) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        require(tokenIds.length <= 50, "TOO_MANY_TOKENS");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(stakes[tokenId].owner == address(0), "ALREADY_STAKED");
            require(nft.ownerOf(tokenId) == owner, "NOT_OWNER");
            // Check batch authorization (recommend user to use setApprovalForAll)
            require(
                nft.ownerOf(tokenId) == msg.sender ||
                    nft.getApproved(tokenId) == msg.sender ||
                    nft.isApprovedForAll(owner, msg.sender),
                "NOT_AUTHORIZED"
            );

            // Transfer NFT from owner to contract
            nft.safeTransferFrom(owner, address(this), tokenId);

            stakes[tokenId] = StakeData({
                owner: owner,
                stakedAt: uint64(block.timestamp),
                lastClaimAt: uint64(block.timestamp),
                burned: false,
                burnedAt: 0,
                lastBurnClaimAt: 0
            });

            emit StakedFor(owner, msg.sender, tokenId);
        }
    }

    // Batch stake NFTs for multiple owners
    // @deprecated
    function batchStakeForMultipleOwners(
        address[] calldata owners,
        uint256[] calldata tokenIds
    ) external nonReentrant {
        require(owners.length == tokenIds.length, "LENGTH_MISMATCH");
        require(owners.length > 0, "EMPTY_ARRAY");
        require(owners.length <= 30, "TOO_MANY_TOKENS");

        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 tokenId = tokenIds[i];

            require(stakes[tokenId].owner == address(0), "ALREADY_STAKED");
            require(nft.ownerOf(tokenId) == owner, "NOT_OWNER");
            require(
                nft.getApproved(tokenId) == msg.sender ||
                    nft.isApprovedForAll(owner, msg.sender),
                "NOT_AUTHORIZED"
            );

            nft.safeTransferFrom(owner, address(this), tokenId);

            stakes[tokenId] = StakeData({
                owner: owner,
                stakedAt: uint64(block.timestamp),
                lastClaimAt: uint64(block.timestamp),
                burned: false,
                burnedAt: 0,
                lastBurnClaimAt: 0
            });

            emit StakedFor(owner, msg.sender, tokenId);
        }
    }

    // Public claim function with reentrancy guard
    // @deprecated
    function claimFor(uint256 tokenId) public nonReentrant returns (uint256) {
        return _claimFor(tokenId);
    }

    // Internal claim function for proxy operations (no owner check)
    // @deprecated
    function _claimFor(uint256 tokenId) internal returns (uint256 amount) {
        StakeData storage sStore = stakes[tokenId];
        // Allow claim for either staked or burn-only positions
        require(sStore.stakedAt != 0 || sStore.burned, "NOT_STAKED");

        // Compute pending using shared view logic
        StakeData memory s = sStore;
        uint256 nowTs = block.timestamp;
        (uint256 pending, bool isBurn) = _pendingAmount(s, nowTs);
        if (pending == 0) return 0;

        if (isBurn) {
            // Additional safety check for invalid state when claiming
            require(sStore.burnedAt != 0, "INVALID_BURN_STATE");
            sStore.lastBurnClaimAt = uint64(nowTs);
            // Always mint to recorded owner to avoid future permissionless claim misdirection
            rewards.mint(sStore.owner, pending);
            emit BurnRewardClaimed(sStore.owner, tokenId, pending);
        } else {
            sStore.lastClaimAt = uint64(nowTs);
            rewards.mint(sStore.owner, pending);
            emit RewardClaimed(sStore.owner, tokenId, pending);
        }
        return pending;
    }

    // Unstake NFT on behalf of another user (requires approval)
    // @deprecated
    function unstakeFor(uint256 tokenId) external nonReentrant {
        StakeData memory s = stakes[tokenId];
        require(s.owner != address(0), "NOT_STAKED");
        require(!s.burned, "ALREADY_BURNED");

        address owner = s.owner;

        // Check permission: must be owner or authorized operator
        require(
            msg.sender == owner ||
                nft.isApprovedForAll(owner, msg.sender) ||
                nft.getApproved(tokenId) == msg.sender,
            "NOT_AUTHORIZED"
        );

        // Claim rewards for the real owner first
        _claimFor(tokenId);

        // Clear stake data
        delete stakes[tokenId];

        // Return NFT to the real owner, not the operator
        nft.safeTransferFrom(address(this), owner, tokenId);

        emit UnstakedFor(owner, msg.sender, tokenId);
    }

    // Batch unstake NFTs for a single owner (requires approval for all)
    // @deprecated
    function batchUnstakeFor(
        address owner,
        uint256[] calldata tokenIds
    ) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        require(tokenIds.length <= 50, "TOO_MANY_TOKENS");

        // Check batch authorization
        require(
            msg.sender == owner ||
                nft.isApprovedForAll(owner, msg.sender) ||
                nft.getApproved(tokenIds[0]) == msg.sender,
            "NOT_AUTHORIZED"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            StakeData memory s = stakes[tokenId];

            require(s.owner == owner, "NOT_OWNER");
            require(!s.burned, "ALREADY_BURNED");
            require(s.stakedAt != 0, "NOT_STAKED");

            // Claim rewards first
            _claimFor(tokenId);

            // Clear stake data
            delete stakes[tokenId];

            // Return NFT to owner
            nft.safeTransferFrom(address(this), owner, tokenId);

            emit UnstakedFor(owner, msg.sender, tokenId);
        }
    }

    // Batch unstake NFTs for multiple owners
    // @deprecated
    function batchUnstakeForMultipleOwners(
        uint256[] calldata tokenIds
    ) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        require(tokenIds.length <= 30, "TOO_MANY_TOKENS");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            StakeData memory s = stakes[tokenId];

            require(s.owner != address(0), "NOT_STAKED");
            require(!s.burned, "ALREADY_BURNED");

            address owner = s.owner;

            // Check permission for each NFT individually
            require(
                msg.sender == owner ||
                    nft.isApprovedForAll(owner, msg.sender) ||
                    nft.getApproved(tokenId) == msg.sender,
                "NOT_AUTHORIZED"
            );

            // Claim rewards for owner
            _claimFor(tokenId);

            // Clear stake data
            delete stakes[tokenId];

            // Return NFT to real owner
            nft.safeTransferFrom(address(this), owner, tokenId);

            emit UnstakedFor(owner, msg.sender, tokenId);
        }
    }

    // Required for receiving ERC721 tokens
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Multicall3-style functionality for batch operations
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Call3Value {
        address target;
        bool allowFailure;
        uint256 value;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    event MultiCallExecuted(address indexed caller, uint256 callsCount);

    // Standard multicall for this contract only (safer)

    function multicall(
        bytes[] calldata data
    ) external payable override returns (bytes[] memory results) {
        results = new bytes[](data.length);
        unchecked {
            for (uint256 i = 0; i < data.length; i++) {
                (bool success, bytes memory result) = address(this)
                    .delegatecall(data[i]);
                if (!success) {
                    // Look for revert reason and bubble it up if present
                    require(result.length > 0);
                    // The easiest way to bubble the revert reason is using memory via assembly
                    assembly ("memory-safe") {
                        revert(add(32, result), mload(result))
                    }
                }
                results[i] = result;
            }
        }
        emit MultiCallExecuted(msg.sender, data.length);
    }

    // Multicall3-style aggregate for external calls (like approve + stake)
    function aggregate3(
        Call3[] calldata calls
    ) external nonReentrant returns (Result[] memory returnData) {
        require(calls.length > 0, "EMPTY_CALLS");
        require(calls.length <= 50, "TOO_MANY_CALLS");

        returnData = new Result[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            Call3 calldata call = calls[i];

            // Security: Only allow calls to NFT contract or this contract
            require(
                call.target == address(nft) || call.target == address(this),
                "INVALID_TARGET"
            );

            (bool success, bytes memory result) = call.target.call(
                call.callData
            );

            if (!success && !call.allowFailure) {
                // Bubble up the revert reason
                if (result.length > 0) {
                    assembly {
                        let returndata_size := mload(result)
                        revert(add(32, result), returndata_size)
                    }
                } else {
                    revert("CALL_FAILED");
                }
            }

            returnData[i] = Result(success, result);
        }

        emit MultiCallExecuted(msg.sender, calls.length);
        return returnData;
    }

    // Multicall3-style aggregate with value for payable calls
    function aggregate3Value(
        Call3Value[] calldata calls
    ) external payable nonReentrant returns (Result[] memory returnData) {
        require(calls.length > 0, "EMPTY_CALLS");
        require(calls.length <= 50, "TOO_MANY_CALLS");

        returnData = new Result[](calls.length);
        uint256 totalValue = 0;

        for (uint256 i = 0; i < calls.length; i++) {
            Call3Value calldata call = calls[i];

            // Security: Only allow calls to NFT contract or this contract
            require(
                call.target == address(nft) || call.target == address(this),
                "INVALID_TARGET"
            );

            totalValue += call.value;

            (bool success, bytes memory result) = call.target.call{
                value: call.value
            }(call.callData);

            if (!success && !call.allowFailure) {
                // Bubble up the revert reason
                if (result.length > 0) {
                    assembly {
                        let returndata_size := mload(result)
                        revert(add(32, result), returndata_size)
                    }
                } else {
                    revert("CALL_FAILED");
                }
            }

            returnData[i] = Result(success, result);
        }

        require(msg.value >= totalValue, "INSUFFICIENT_VALUE");

        // Refund excess ETH
        if (msg.value > totalValue) {
            payable(msg.sender).transfer(msg.value - totalValue);
        }

        emit MultiCallExecuted(msg.sender, calls.length);
        return returnData;
    }

    // Required for UUPS upgrades - only owner can upgrade
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // Get implementation version
    function version() public pure returns (string memory) {
        return "1.0.2";
    }
}
