# 🚀 Deployment Guide

Complete step-by-step guide to deploy Crypto Snake Battle to Base Network.

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- MetaMask or Coinbase Wallet
- Base Sepolia testnet ETH ([Get from faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- Basescan API key ([Get from Basescan](https://basescan.org/apis))

## 🔧 Step 1: Environment Setup

### 1.1 Clone Repository
```bash
git clone https://github.com/Ventolus/crypto-snake-battle.git
cd crypto-snake-battle
```

### 1.2 Install Dependencies
```bash
pnpm install:all
```

### 1.3 Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
# Deployment wallet (KEEP SECURE!)
PRIVATE_KEY=0x...  # Your wallet private key

# Base Sepolia RPC
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Basescan API key for verification
BASESCAN_API_KEY=your_api_key_here

# Contract config
REWARD_VAULT_SEED=1000000000000000000  # 1M SNAKE tokens
MINT_PRICE_WEI=500000000000000  # 0.0005 ETH

# Backend (will configure later)
PORT=8787
SERVER_PRIVATE_KEY=0x...  # Generate new wallet for backend
CORS_ORIGIN=https://ventolus.github.io
```

## 📦 Step 2: Deploy Smart Contracts

### 2.1 Compile Contracts
```bash
cd contracts
pnpm hardhat compile
```

### 2.2 Run Tests (Optional but Recommended)
```bash
pnpm hardhat test
```

### 2.3 Deploy to Base Sepolia
```bash
pnpm hardhat run scripts/deploy_all.ts --network baseSepolia
```

**Expected Output:**
```
🚀 Starting deployment to Base Sepolia...
✅ SnakeToken deployed to: 0x...
✅ RewardsVault deployed to: 0x...
✅ CryptoSnakesGenesis deployed to: 0x...
📄 Deployment info saved to: deployments.json
```

### 2.4 Verify Contracts on Basescan
```bash
pnpm hardhat run scripts/verify.ts --network baseSepolia
```

### 2.5 Save Contract Addresses
Copy addresses from `contracts/deployments.json`:
```json
{
  "contracts": {
    "SnakeToken": "0x...",
    "RewardsVault": "0x...",
    "CryptoSnakesGenesis": "0x..."
  }
}
```

## 🖥️ Step 3: Setup Backend

### 3.1 Generate Backend Wallet
```bash
# Generate new wallet for backend signing
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
```

Save this private key to `.env` as `SERVER_PRIVATE_KEY`.

### 3.2 Update RewardsVault Signer
```bash
cd contracts
node -e "
const ethers = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const vaultAbi = ['function updateSigner(address)'];
const vault = new ethers.Contract('VAULT_ADDRESS', vaultAbi, wallet);
vault.updateSigner('BACKEND_WALLET_ADDRESS').then(tx => tx.wait());
"
```

Replace:
- `VAULT_ADDRESS` with RewardsVault address
- `BACKEND_WALLET_ADDRESS` with backend wallet address

### 3.3 Setup Database

**Option A: Supabase (Recommended)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Update `.env`:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

**Option B: Local PostgreSQL**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_snake
```

### 3.4 Run Migrations
```bash
cd backend
pnpm prisma:generate
pnpm prisma:migrate
```

### 3.5 Update Backend Config
Edit `.env`:
```bash
REWARDS_VAULT_ADDRESS=0x...  # From deployment
SNAKE_TOKEN_ADDRESS=0x...    # From deployment
GENESIS_NFT_ADDRESS=0x...    # From deployment
```

### 3.6 Test Backend Locally
```bash
pnpm dev
```

Visit `http://localhost:8787/health` - should return `{"status":"ok"}`

## 🌐 Step 4: Deploy Backend

### Option A: Railway.app (Recommended)

1. **Create Account:** [railway.app](https://railway.app)

2. **New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `crypto-snake-battle`

3. **Configure:**
   - Root directory: `backend`
   - Build command: `pnpm install && pnpm build`
   - Start command: `pnpm start`

4. **Environment Variables:**
   Add all variables from `.env` to Railway

5. **Deploy:**
   - Railway will auto-deploy
   - Get URL: `https://your-app.railway.app`

### Option B: Render.com

1. **Create Account:** [render.com](https://render.com)

2. **New Web Service:**
   - Connect GitHub repo
   - Root directory: `backend`
   - Build: `cd backend && pnpm install && pnpm build`
   - Start: `cd backend && pnpm start`

3. **Environment Variables:**
   Add all from `.env`

4. **Deploy:**
   - Render will build and deploy
   - Get URL: `https://your-app.onrender.com`

## 🎨 Step 5: Update Frontend

### 5.1 Update Contract Addresses
Edit `wallet.js`:
```javascript
export const CONFIG = {
  chainId: 84532,
  chainIdHex: '0x14a34',
  rpcUrl: 'https://sepolia.base.org',
  
  // UPDATE THESE:
  snakeToken: '0x...',      // SnakeToken address
  rewardsVault: '0x...',    // RewardsVault address
  genesisNft: '0x...',      // CryptoSnakesGenesis address
  
  // UPDATE THIS:
  backendBaseUrl: 'https://your-backend.railway.app',
};
```

### 5.2 Commit and Push
```bash
git add wallet.js
git commit -m "Update contract addresses and backend URL"
git push origin main
```

GitHub Pages will auto-deploy to:
`https://ventolus.github.io/crypto-snake-battle`

## ✅ Step 6: Verification

### 6.1 Test Contract Interactions
1. Visit your site
2. Connect wallet (MetaMask/Coinbase)
3. Switch to Base Sepolia
4. Check balances load

### 6.2 Test Game Flow
1. Play game
2. Submit score
3. Check transaction on Basescan
4. Verify SNAKE tokens received

### 6.3 Test NFT Minting
1. Go to mint page
2. Mint 1 NFT
3. Check transaction
4. Verify NFT in wallet

### 6.4 Test Leaderboard
1. Visit leaderboard page
2. Check your score appears
3. Verify sorting

## 🔒 Step 7: Security Checklist

- [ ] Private keys never committed to Git
- [ ] `.env` in `.gitignore`
- [ ] Backend CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Contract ownership verified
- [ ] Basescan verification complete
- [ ] Backend signer updated in vault
- [ ] Database backups configured

## 📊 Step 8: Monitoring

### Contract Monitoring
- **Basescan:** Monitor transactions
- **Vault Balance:** Check SNAKE token balance
- **NFT Supply:** Track minted NFTs

### Backend Monitoring
- **Logs:** Check Railway/Render logs
- **Database:** Monitor Prisma Studio
- **API Health:** `/health` endpoint

### Frontend Monitoring
- **GitHub Pages:** Check deployment status
- **Console Errors:** Monitor browser console
- **User Reports:** Track issues

## 🚀 Step 9: Going to Mainnet

When ready for Base Mainnet:

### 9.1 Update Hardhat Config
```typescript
base: {
  url: "https://mainnet.base.org",
  accounts: [process.env.PRIVATE_KEY],
  chainId: 8453,
}
```

### 9.2 Update Frontend Config
```javascript
chainId: 8453,
chainIdHex: '0x2105',
rpcUrl: 'https://mainnet.base.org',
```

### 9.3 Deploy Contracts
```bash
pnpm hardhat run scripts/deploy_all.ts --network base
```

### 9.4 Update All Addresses
- Backend `.env`
- Frontend `wallet.js`
- Documentation

### 9.5 Announce Launch! 🎉

## 🆘 Troubleshooting

### Contract Deployment Fails
- Check wallet has enough ETH
- Verify RPC URL is correct
- Check gas price settings

### Backend Won't Start
- Verify DATABASE_URL is correct
- Check all env variables set
- Run migrations: `pnpm prisma:migrate`

### Frontend Can't Connect
- Check contract addresses are correct
- Verify backend URL is accessible
- Check CORS settings
- Ensure wallet on correct network

### Transactions Fail
- Check wallet has ETH for gas
- Verify contract addresses
- Check daily caps not exceeded
- Ensure signature is valid

## 📞 Support

- **GitHub Issues:** [Report bugs](https://github.com/Ventolus/crypto-snake-battle/issues)
- **Documentation:** Check individual package READMEs
- **Base Discord:** [base.org/discord](https://base.org/discord)

---

**Deployment Complete!** 🎉

Your Crypto Snake Battle is now live on Base Network!