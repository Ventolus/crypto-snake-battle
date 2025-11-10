// Configuration - UPDATE THESE AFTER DEPLOYMENT
export const CONFIG = {
  chainId: 84532, // Base Sepolia
  chainIdHex: '0x14a34',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  
  // Contract addresses - UPDATE AFTER DEPLOYMENT
  snakeToken: '0x0000000000000000000000000000000000000000', // TODO: Update
  rewardsVault: '0x0000000000000000000000000000000000000000', // TODO: Update
  genesisNft: '0x0000000000000000000000000000000000000000', // TODO: Update
  
  // Backend API
  backendBaseUrl: 'http://localhost:8787', // TODO: Update to production URL
};

// Base Network configuration
const BASE_NETWORK = {
  chainId: CONFIG.chainIdHex,
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: [CONFIG.rpcUrl],
  blockExplorerUrls: [CONFIG.blockExplorer]
};

// Contract ABIs (minimal)
const SNAKE_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

const REWARDS_VAULT_ABI = [
  'function claim((address player, uint256 score, uint256 reward, uint256 nonce, uint256 deadline), bytes signature)',
  'function getRemainingDailyAllowance(address) view returns (uint256)',
  'function getRemainingGlobalAllowance() view returns (uint256)',
];

const GENESIS_NFT_ABI = [
  'function mint(uint256 amount) payable',
  'function mintPrice() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function remainingSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function canMint(address, uint256) view returns (bool)',
];

// Global state
let walletConnected = false;
let userAddress = null;
let provider = null;
let signer = null;

// Contract instances
let snakeTokenContract = null;
let rewardsVaultContract = null;
let genesisNftContract = null;

/**
 * Connect wallet and initialize contracts
 */
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask or Coinbase Wallet to connect!');
    return false;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    userAddress = accounts[0];
    
    // Initialize ethers provider
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    
    // Check if on Base Sepolia
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== CONFIG.chainIdHex) {
      await switchToBaseSepolia();
    }
    
    // Initialize contracts
    initializeContracts();
    
    walletConnected = true;
    updateWalletUI();
    
    // Load balances
    await loadBalances();
    
    return true;
    
  } catch (error) {
    console.error('Error connecting wallet:', error);
    alert('Failed to connect wallet. Please try again.');
    return false;
  }
}

/**
 * Switch to Base Sepolia network
 */
async function switchToBaseSepolia() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CONFIG.chainIdHex }],
    });
  } catch (switchError) {
    // Network not added, try to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BASE_NETWORK],
        });
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Initialize contract instances
 */
function initializeContracts() {
  if (!signer) return;
  
  snakeTokenContract = new ethers.Contract(
    CONFIG.snakeToken,
    SNAKE_TOKEN_ABI,
    signer
  );
  
  rewardsVaultContract = new ethers.Contract(
    CONFIG.rewardsVault,
    REWARDS_VAULT_ABI,
    signer
  );
  
  genesisNftContract = new ethers.Contract(
    CONFIG.genesisNft,
    GENESIS_NFT_ABI,
    signer
  );
}

/**
 * Load user balances
 */
async function loadBalances() {
  if (!walletConnected || !userAddress) return;
  
  try {
    // Get SNAKE balance
    const snakeBalance = await snakeTokenContract.balanceOf(userAddress);
    const snakeFormatted = ethers.formatEther(snakeBalance);
    
    // Get NFT balance
    const nftBalance = await genesisNftContract.balanceOf(userAddress);
    
    // Update UI
    const balanceElement = document.getElementById('snakeBalance');
    if (balanceElement) {
      balanceElement.textContent = parseFloat(snakeFormatted).toFixed(2);
    }
    
    const nftElement = document.getElementById('nftBalance');
    if (nftElement) {
      nftElement.textContent = nftBalance.toString();
    }
    
    // Get remaining daily allowance
    const remaining = await rewardsVaultContract.getRemainingDailyAllowance(userAddress);
    const remainingFormatted = ethers.formatEther(remaining);
    
    const allowanceElement = document.getElementById('dailyAllowance');
    if (allowanceElement) {
      allowanceElement.textContent = parseFloat(remainingFormatted).toFixed(0);
    }
    
  } catch (error) {
    console.error('Error loading balances:', error);
  }
}

/**
 * Submit score and claim rewards
 */
async function submitScoreAndClaim(score) {
  if (!walletConnected) {
    alert('Please connect your wallet first!');
    return false;
  }
  
  try {
    // Show loading
    showStatus('Submitting score...', 'info');
    
    // Submit score to backend
    const response = await fetch(`${CONFIG.backendBaseUrl}/api/score/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: userAddress,
        score: score,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit score');
    }
    
    const { claim, signature } = await response.json();
    
    showStatus('Claiming rewards...', 'info');
    
    // Call contract to claim rewards
    const tx = await rewardsVaultContract.claim(
      {
        player: claim.player,
        score: claim.score,
        reward: claim.reward,
        nonce: claim.nonce,
        deadline: claim.deadline,
      },
      signature
    );
    
    showStatus('Transaction submitted. Waiting for confirmation...', 'info');
    
    // Wait for transaction
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      const rewardFormatted = ethers.formatEther(claim.reward);
      showStatus(`Success! Claimed ${parseFloat(rewardFormatted).toFixed(2)} SNAKE tokens!`, 'success');
      
      // Reload balances
      await loadBalances();
      
      return true;
    } else {
      throw new Error('Transaction failed');
    }
    
  } catch (error) {
    console.error('Error claiming rewards:', error);
    
    let errorMessage = 'Failed to claim rewards';
    if (error.message.includes('Daily wallet cap exceeded')) {
      errorMessage = 'Daily reward cap reached! Try again tomorrow.';
    } else if (error.message.includes('Daily global cap exceeded')) {
      errorMessage = 'Global daily cap reached! Try again tomorrow.';
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Transaction cancelled';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showStatus(errorMessage, 'error');
    return false;
  }
}

/**
 * Mint Genesis NFT
 */
async function mintNFT(amount) {
  if (!walletConnected) {
    alert('Please connect your wallet first!');
    return false;
  }
  
  try {
    showStatus('Checking mint eligibility...', 'info');
    
    // Check if can mint
    const canMint = await genesisNftContract.canMint(userAddress, amount);
    if (!canMint) {
      throw new Error('Cannot mint: wallet limit or max supply reached');
    }
    
    // Get mint price
    const mintPrice = await genesisNftContract.mintPrice();
    const totalPrice = mintPrice * BigInt(amount);
    
    showStatus('Minting NFT...', 'info');
    
    // Mint
    const tx = await genesisNftContract.mint(amount, {
      value: totalPrice,
    });
    
    showStatus('Transaction submitted. Waiting for confirmation...', 'info');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      showStatus(`Success! Minted ${amount} Genesis NFT(s)!`, 'success');
      await loadBalances();
      return true;
    } else {
      throw new Error('Transaction failed');
    }
    
  } catch (error) {
    console.error('Error minting NFT:', error);
    
    let errorMessage = 'Failed to mint NFT';
    if (error.message.includes('wallet limit')) {
      errorMessage = 'Wallet limit reached (max 2 per wallet)';
    } else if (error.message.includes('max supply')) {
      errorMessage = 'Max supply reached!';
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Transaction cancelled';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showStatus(errorMessage, 'error');
    return false;
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('statusMessage');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.style.display = 'block';
  
  // Auto-hide after 5 seconds for success/error
  if (type !== 'info') {
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
}

/**
 * Update wallet UI
 */
function updateWalletUI() {
  const connectBtn = document.getElementById('connectWallet');
  const walletInfo = document.getElementById('walletInfo');
  const walletAddress = document.getElementById('walletAddress');
  
  if (walletConnected && userAddress) {
    if (connectBtn) {
      connectBtn.textContent = 'Connected ✓';
      connectBtn.classList.add('connected');
    }
    
    if (walletInfo) {
      walletInfo.style.display = 'block';
    }
    
    if (walletAddress) {
      walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    }
  } else {
    if (connectBtn) {
      connectBtn.textContent = 'Connect Wallet';
      connectBtn.classList.remove('connected');
    }
    
    if (walletInfo) {
      walletInfo.style.display = 'none';
    }
  }
}

/**
 * Get NFT info for mint page
 */
async function getNFTInfo() {
  if (!genesisNftContract) return null;
  
  try {
    const [mintPrice, totalSupply, remainingSupply] = await Promise.all([
      genesisNftContract.mintPrice(),
      genesisNftContract.totalSupply(),
      genesisNftContract.remainingSupply(),
    ]);
    
    return {
      mintPrice: ethers.formatEther(mintPrice),
      totalSupply: totalSupply.toString(),
      remainingSupply: remainingSupply.toString(),
      maxSupply: '1000',
    };
  } catch (error) {
    console.error('Error getting NFT info:', error);
    return null;
  }
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      walletConnected = false;
      userAddress = null;
    } else {
      userAddress = accounts[0];
      walletConnected = true;
      loadBalances();
    }
    updateWalletUI();
  });
  
  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}

// Connect wallet button event
document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectWallet');
  if (connectBtn) {
    connectBtn.addEventListener('click', connectWallet);
  }
});

// Check if already connected on page load
window.addEventListener('load', async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      userAddress = accounts[0];
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      initializeContracts();
      walletConnected = true;
      updateWalletUI();
      await loadBalances();
    }
  }
});

// Export functions for use in other files
window.cryptoSnake = {
  connectWallet,
  submitScoreAndClaim,
  mintNFT,
  getNFTInfo,
  loadBalances,
  isConnected: () => walletConnected,
  getAddress: () => userAddress,
};