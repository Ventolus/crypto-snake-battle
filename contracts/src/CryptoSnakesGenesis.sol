// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CryptoSnakesGenesis
 * @dev Genesis NFT collection for Crypto Snake Battle
 * Max supply: 1000 NFTs
 * Max 2 per wallet
 * Mint price: 0.0005 ETH
 */
contract CryptoSnakesGenesis is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_PER_WALLET = 2;
    uint256 public mintPrice;
    
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    
    mapping(address => uint256) public mintedPerWallet;
    
    event Minted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPrice);
    
    constructor(uint256 _mintPrice) ERC721("Crypto Snakes Genesis", "CSNAKE") Ownable(msg.sender) {
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Mint NFTs (public mint)
     * @param amount Number of NFTs to mint (1 or 2)
     */
    function mint(uint256 amount) external payable {
        require(amount > 0 && amount <= 2, "CryptoSnakesGenesis: Invalid amount");
        require(_tokenIdCounter + amount <= MAX_SUPPLY, "CryptoSnakesGenesis: Max supply reached");
        require(
            mintedPerWallet[msg.sender] + amount <= MAX_PER_WALLET,
            "CryptoSnakesGenesis: Wallet limit exceeded"
        );
        require(msg.value >= mintPrice * amount, "CryptoSnakesGenesis: Insufficient payment");
        
        mintedPerWallet[msg.sender] += amount;
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _safeMint(msg.sender, tokenId);
        }
        
        emit Minted(msg.sender, _tokenIdCounter - amount, amount);
    }
    
    /**
     * @dev Airdrop NFTs (owner only)
     * @param to Address to receive NFTs
     * @param amount Number of NFTs to airdrop
     */
    function airdrop(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "CryptoSnakesGenesis: Invalid address");
        require(amount > 0, "CryptoSnakesGenesis: Invalid amount");
        require(_tokenIdCounter + amount <= MAX_SUPPLY, "CryptoSnakesGenesis: Max supply reached");
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _safeMint(to, tokenId);
        }
        
        emit Minted(to, _tokenIdCounter - amount, amount);
    }
    
    /**
     * @dev Set base URI for token metadata
     * @param baseURI The base URI (e.g., ipfs://QmHash/)
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }
    
    /**
     * @dev Update mint price
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "CryptoSnakesGenesis: No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "CryptoSnakesGenesis: Withdrawal failed");
    }
    
    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Returns the token URI for a given token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
            : "";
    }
    
    /**
     * @dev Get total minted supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get remaining supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter;
    }
    
    /**
     * @dev Check if an address can mint more NFTs
     */
    function canMint(address wallet, uint256 amount) external view returns (bool) {
        return mintedPerWallet[wallet] + amount <= MAX_PER_WALLET
            && _tokenIdCounter + amount <= MAX_SUPPLY;
    }
}