// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title RewardsVault
 * @dev Distributes SNAKE tokens to players based on signed claims
 * Uses EIP-712 for secure off-chain signature verification
 */
contract RewardsVault is Ownable, EIP712 {
    using ECDSA for bytes32;
    
    IERC20 public immutable snakeToken;
    address public signer;
    
    // Daily caps
    uint256 public capPerWalletPerDay;
    uint256 public capGlobalPerDay;
    
    // Tracking
    mapping(address => mapping(uint256 => uint256)) public dailyRewards; // wallet => day => amount
    mapping(uint256 => uint256) public globalDailyRewards; // day => total amount
    mapping(address => mapping(uint256 => bool)) public usedNonces; // wallet => nonce => used
    
    // EIP-712 type hash
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address player,uint256 score,uint256 reward,uint256 nonce,uint256 deadline)"
    );
    
    struct Claim {
        address player;
        uint256 score;
        uint256 reward;
        uint256 nonce;
        uint256 deadline;
    }
    
    event Claimed(address indexed player, uint256 reward, uint256 score, uint256 nonce);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event CapsUpdated(uint256 perWallet, uint256 global);
    
    constructor(
        address _snakeToken,
        address _signer,
        uint256 _capPerWalletPerDay,
        uint256 _capGlobalPerDay
    ) EIP712("CryptoSnakeRewards", "1") Ownable(msg.sender) {
        require(_snakeToken != address(0), "RewardsVault: Invalid token address");
        require(_signer != address(0), "RewardsVault: Invalid signer address");
        
        snakeToken = IERC20(_snakeToken);
        signer = _signer;
        capPerWalletPerDay = _capPerWalletPerDay;
        capGlobalPerDay = _capGlobalPerDay;
    }
    
    /**
     * @dev Claim rewards with a signed message from the backend
     * @param claimData The claim data structure
     * @param signature The EIP-712 signature from the backend
     */
    function claim(Claim calldata claimData, bytes calldata signature) external {
        require(claimData.player == msg.sender, "RewardsVault: Invalid player");
        require(block.timestamp <= claimData.deadline, "RewardsVault: Claim expired");
        require(!usedNonces[msg.sender][claimData.nonce], "RewardsVault: Nonce already used");
        require(claimData.reward > 0, "RewardsVault: Zero reward");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            CLAIM_TYPEHASH,
            claimData.player,
            claimData.score,
            claimData.reward,
            claimData.nonce,
            claimData.deadline
        ));
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == signer, "RewardsVault: Invalid signature");
        
        // Check daily caps
        uint256 today = block.timestamp / 1 days;
        require(
            dailyRewards[msg.sender][today] + claimData.reward <= capPerWalletPerDay,
            "RewardsVault: Daily wallet cap exceeded"
        );
        require(
            globalDailyRewards[today] + claimData.reward <= capGlobalPerDay,
            "RewardsVault: Daily global cap exceeded"
        );
        
        // Mark nonce as used
        usedNonces[msg.sender][claimData.nonce] = true;
        
        // Update daily tracking
        dailyRewards[msg.sender][today] += claimData.reward;
        globalDailyRewards[today] += claimData.reward;
        
        // Transfer tokens
        require(
            snakeToken.transfer(msg.sender, claimData.reward),
            "RewardsVault: Transfer failed"
        );
        
        emit Claimed(msg.sender, claimData.reward, claimData.score, claimData.nonce);
    }
    
    /**
     * @dev Update the signer address (backend wallet)
     */
    function updateSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "RewardsVault: Invalid signer");
        address oldSigner = signer;
        signer = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }
    
    /**
     * @dev Update daily caps
     */
    function updateCaps(uint256 _capPerWallet, uint256 _capGlobal) external onlyOwner {
        capPerWalletPerDay = _capPerWallet;
        capGlobalPerDay = _capGlobal;
        emit CapsUpdated(_capPerWallet, _capGlobal);
    }
    
    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "RewardsVault: Invalid address");
        require(snakeToken.transfer(to, amount), "RewardsVault: Transfer failed");
    }
    
    /**
     * @dev Get remaining daily allowance for a wallet
     */
    function getRemainingDailyAllowance(address wallet) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 used = dailyRewards[wallet][today];
        return used >= capPerWalletPerDay ? 0 : capPerWalletPerDay - used;
    }
    
    /**
     * @dev Get remaining global daily allowance
     */
    function getRemainingGlobalAllowance() external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 used = globalDailyRewards[today];
        return used >= capGlobalPerDay ? 0 : capGlobalPerDay - used;
    }
    
    /**
     * @dev Get vault balance
     */
    function getBalance() external view returns (uint256) {
        return snakeToken.balanceOf(address(this));
    }
}