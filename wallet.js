// Base Network Configuration
const BASE_CHAIN_ID = '0x2105'; // 8453 in hex
const BASE_NETWORK = {
    chainId: BASE_CHAIN_ID,
    chainName: 'Base',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
};

let walletConnected = false;
let userAddress = null;

// Connect Wallet Function
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or Coinbase Wallet to connect!');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        userAddress = accounts[0];
        
        // Check if on Base network
        const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
        });
        
        if (chainId !== BASE_CHAIN_ID) {
            // Try to switch to Base network
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BASE_CHAIN_ID }],
                });
            } catch (switchError) {
                // If Base network is not added, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BASE_NETWORK],
                    });
                }
            }
        }
        
        walletConnected = true;
        updateWalletUI();
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

// Update Wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWallet');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    
    if (walletConnected && userAddress) {
        connectBtn.textContent = 'Connected ✓';
        connectBtn.classList.add('connected');
        walletInfo.style.display = 'block';
        walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    } else {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('connected');
        walletInfo.style.display = 'none';
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
        }
        updateWalletUI();
    });
    
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// Connect wallet button event
document.getElementById('connectWallet').addEventListener('click', connectWallet);

// Check if already connected on page load
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
        });
        if (accounts.length > 0) {
            userAddress = accounts[0];
            walletConnected = true;
            updateWalletUI();
        }
    }
});