# 🔐 Smart Contracts

Smart contracts for Crypto Snake Battle on Base Network.

## 📋 Contracts

### 1. SnakeToken (ERC-20)
- **Symbol:** SNAKE
- **Decimals:** 18
- **Max Supply:** 1,000,000,000 SNAKE
- **Features:**
  - Owner-controlled minting
  - Standard ERC-20 functionality
  - Capped supply

### 2. RewardsVault
- **Purpose:** Distribute SNAKE tokens to players
- **Features:**
  - EIP-712 signature verification
  - Daily caps (per wallet & global)
  - Nonce-based replay protection
  - Deadline enforcement
- **Security:**
  - Backend-signed claims
  - Rate limiting via caps
  - Emergency withdraw function

### 3. CryptoSnakesGenesis (ERC-721)
- **Supply:** 1,000 NFTs
- **Mint Price:** 0.0005 ETH
- **Wallet Limit:** 2 NFTs per wallet
- **Features:**
  - Public minting
  - Owner airdrop capability
  - Configurable base URI
  - Revenue withdrawal

## 🚀 Setup

### Install Dependencies
```bash
cd contracts
pnpm install
```

### Configure Environment
```bash
cp ../.env.example ../.env
# Edit .env with your values
```

Required variables:
- `PRIVATE_KEY` - Deployment wallet private key
- `BASE_SEPOLIA_RPC` - Base Sepolia RPC URL
- `BASESCAN_API_KEY` - For contract verification

## 🔨 Development

### Compile Contracts
```bash
pnpm hardhat compile
```

### Run Tests
```bash
pnpm hardhat test
```

### Test Coverage
```bash
pnpm hardhat coverage
```

### Clean Build
```bash
pnpm hardhat clean
```

## 🚢 Deployment

### Deploy to Base Sepolia
```bash
pnpm hardhat run scripts/deploy_all.ts --network baseSepolia
```

This will:
1. Deploy SnakeToken
2. Deploy RewardsVault
3. Mint initial tokens to vault
4. Deploy CryptoSnakesGenesis
5. Save addresses to `deployments.json`

### Verify Contracts
```bash
pnpm hardhat run scripts/verify.ts --network baseSepolia
```

## 📝 Post-Deployment

### 1. Update Backend Signer
The RewardsVault initially uses the deployer as signer. Update it to your backend wallet:

```typescript
const rewardsVault = await ethers.getContractAt("RewardsVault", VAULT_ADDRESS);
await rewardsVault.updateSigner(BACKEND_WALLET_ADDRESS);
```

### 2. Set NFT Metadata
Upload metadata to IPFS and set base URI:

```typescript
const genesisNFT = await ethers.getContractAt("CryptoSnakesGenesis", NFT_ADDRESS);
await genesisNFT.setBaseURI("ipfs://QmYourHash/");
```

### 3. Update Frontend Config
Copy contract addresses to `frontend/wallet.js`:

```javascript
export const CONFIG = {
  snakeToken: "0x...",
  rewardsVault: "0x...",
  genesisNft: "0x...",
};
```

## 🔒 Security

### RewardsVault Security Features
- **EIP-712 Signatures:** Industry-standard typed data signing
- **Nonce System:** Prevents replay attacks
- **Deadlines:** Time-limited claims (5-10 minutes)
- **Daily Caps:** 
  - Per wallet: 2,000 SNAKE/day
  - Global: 200,000 SNAKE/day
- **Signer Control:** Only backend can sign valid claims

### Best Practices
- Keep `PRIVATE_KEY` secure (never commit)
- Use hardware wallet for mainnet deployments
- Test thoroughly on Sepolia before mainnet
- Monitor vault balance and refill as needed
- Regularly review claim patterns for abuse

## 📊 Contract Addresses

After deployment, addresses are saved to `deployments.json`:

```json
{
  "network": "baseSepolia",
  "chainId": 84532,
  "contracts": {
    "SnakeToken": "0x...",
    "RewardsVault": "0x...",
    "CryptoSnakesGenesis": "0x..."
  }
}
```

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Test Individual Contract
```bash
pnpm hardhat test test/SnakeToken.t.ts
pnpm hardhat test test/RewardsVault.t.ts
pnpm hardhat test test/CryptoSnakesGenesis.t.ts
```

### Gas Report
```bash
REPORT_GAS=true pnpm hardhat test
```

## 🔗 Useful Links

- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## 📄 License

MIT