// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SnakeToken
 * @dev ERC20 token for Crypto Snake Battle rewards
 * Total supply: 1,000,000,000 SNAKE (18 decimals)
 * Only owner can mint tokens to the RewardsVault
 */
contract SnakeToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("Snake Token", "SNAKE") Ownable(msg.sender) {
        // Initial supply can be minted here or later
    }
    
    /**
     * @dev Mint tokens to a specific address (typically RewardsVault)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mintTo(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "SnakeToken: Max supply exceeded");
        require(to != address(0), "SnakeToken: Cannot mint to zero address");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Returns the maximum supply of tokens
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}