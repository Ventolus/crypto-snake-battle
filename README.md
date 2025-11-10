# 🐍💰 Crypto Snake Battle

**Multiplayer Snake Game with Play-to-Earn on Base Network**

Play the classic Snake game with a crypto twist! Collect Bitcoin, Ethereum, and other crypto coins while battling against a friend. Earn $SNAKE tokens for your high scores and mint exclusive Genesis NFTs.

## 🎮 Play Now

**Live Demo:** [https://ventolus.github.io/crypto-snake-battle](https://ventolus.github.io/crypto-snake-battle)

## ✨ Features

### 🎯 Gameplay
- **2-Player Battle Mode** - Compete with a friend on the same keyboard
- **Crypto Coins** - Collect Bitcoin (₿), Ethereum (Ξ), Solana (S), Binance (B), and Dogecoin (Ð)
- **Score Tracking** - Track both points and crypto value
- **Smooth Controls** - Responsive WASD and arrow key controls

### 💰 Play-to-Earn
- **$SNAKE Token Rewards** - Earn tokens based on your score
- **Daily Caps** - Fair distribution with wallet and global limits
- **Secure Claims** - EIP-712 signed rewards from backend
- **Leaderboard** - Compete for top positions

### 🎨 NFTs
- **Genesis Collection** - 1,000 unique NFTs
- **Mint Price** - 0.0005 ETH on Base Network
- **Wallet Limit** - Max 2 NFTs per wallet
- **Exclusive Benefits** - Future utility and perks

### 🔵 Base Network
- **Layer 2 Solution** - Fast and cheap transactions
- **Wallet Integration** - MetaMask and Coinbase Wallet support
- **Auto-Switch** - Automatically connects to Base Network

## 🏗️ Architecture

This is a monorepo with three main packages:

```
crypto-snake-battle/
├── contracts/     # Smart contracts (Solidity + Hardhat)
├── backend/       # API server (Node.js + Express)
└── frontend/      # Game UI (Vanilla JS)
```

### Smart Contracts
- **SnakeToken (ERC-20)** - $SNAKE reward token
- **RewardsVault** - Distributes rewards with EIP-712 signatures
- **CryptoSnakesGenesis (ERC-721)** - Genesis NFT collection

### Backend
- **Score Submission** - Validates and signs reward claims
- **Leaderboard** - Tracks top scores
- **Anti-Cheat** - Basic validation (expandable)
- **Rate Limiting** - Prevents abuse

### Frontend
- **Game Engine** - Classic Snake mechanics
- **Web3 Integration** - Wallet connection and transactions
- **Mint Page** - NFT minting interface
- **Leaderboard UI** - View top players

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MetaMask or Coinbase Wallet
- Base Sepolia testnet ETH

### Installation

```bash
# Clone repository
git clone https://github.com/Ventolus/crypto-snake-battle.git
cd crypto-snake-battle

# Install all dependencies
pnpm install:all

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### Deploy Contracts

```bash
# Compile contracts
cd contracts
pnpm hardhat compile

# Deploy to Base Sepolia
pnpm hardhat run scripts/deploy_all.ts --network baseSepolia

# Verify on Basescan
pnpm hardhat run scripts/verify.ts --network baseSepolia
```

### Run Backend

```bash
cd backend

# Setup database
pnpm prisma:generate
pnpm prisma:migrate

# Start development server
pnpm dev
```

### Run Frontend

The frontend is already deployed to GitHub Pages. For local development:

```bash
cd frontend
# Open index.html in browser
# Or use a local server:
python -m http.server 8000
```

## 🕹️ How to Play

### Controls
- **Player 1:** W (up), A (left), S (down), D (right)
- **Player 2:** Arrow keys

### Objective
1. Collect crypto coins to grow your snake
2. Each coin type has different values:
   - 🪙 Bitcoin (₿) - $100
   - 💎 Ethereum (Ξ) - $50
   - 🌟 Solana (S) - $40
   - ⭐ Binance (B) - $30
   - 🐕 Dogecoin (Ð) - $20
3. Avoid hitting walls, yourself, or the other player
4. Submit your score to earn $SNAKE tokens!

### Earning Rewards
1. **Connect Wallet** - Click "Connect Wallet" and approve
2. **Play Game** - Achieve a high score
3. **Submit Score** - Click "Submit & Claim" after game over
4. **Receive Tokens** - $SNAKE tokens sent to your wallet

**Reward Formula:** `reward = floor(score * 1.0 / 100)`

Example: Score 1,000 = 10 SNAKE tokens

## 💰 Tokenomics

### $SNAKE Token
- **Total Supply:** 1,000,000,000 SNAKE
- **Distribution:**
  - 70% Play-to-Earn pool
  - 20% Development & Marketing
  - 10% Liquidity & Partners

### Daily Caps
- **Per Wallet:** 2,000 SNAKE/day
- **Global:** 200,000 SNAKE/day

### NFT Economics
- **Max Supply:** 1,000 NFTs
- **Mint Price:** 0.0005 ETH
- **Max Per Wallet:** 2 NFTs

## 🔐 Security

### Smart Contract Security
- **OpenZeppelin Contracts** - Battle-tested implementations
- **EIP-712 Signatures** - Industry-standard typed data signing
- **Nonce System** - Prevents replay attacks
- **Daily Caps** - Prevents reward drain
- **Audited Patterns** - Following best practices

### Backend Security
- **Rate Limiting** - Per-IP and per-wallet limits
- **CORS Protection** - Whitelist-based origin control
- **Helmet.js** - Security headers
- **Input Validation** - Sanitized user inputs
- **Secure Signing** - Private key never exposed

### Anti-Cheat
Current measures:
- Score range validation
- Integer-only scores
- Rate limiting

Future improvements:
- Game duration validation
- Move pattern analysis
- Client-side game proof

## 📊 Contract Addresses

### Base Sepolia (Testnet)
```
SnakeToken:          [Deploy to get address]
RewardsVault:        [Deploy to get address]
CryptoSnakesGenesis: [Deploy to get address]
```

Addresses will be updated after deployment.

## 🛠️ Development

### Project Structure

```
crypto-snake-battle/
├── contracts/
│   ├── src/
│   │   ├── SnakeToken.sol
│   │   ├── RewardsVault.sol
│   │   └── CryptoSnakesGenesis.sol
│   ├── scripts/
│   │   ├── deploy_all.ts
│   │   └── verify.ts
│   └── test/
│       └── *.t.ts
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes.ts
│   │   └── eip712.ts
│   └── prisma/
│       └── schema.prisma
└── frontend/
    ├── index.html
    ├── game.js
    ├── wallet.js
    ├── mint.html
    └── leaderboard.html
```

### Testing

```bash
# Test contracts
cd contracts
pnpm hardhat test

# Test backend (TODO)
cd backend
pnpm test

# Manual testing
# 1. Deploy contracts to Sepolia
# 2. Start backend locally
# 3. Open frontend and test flow
```

### Building

```bash
# Build contracts
cd contracts
pnpm hardhat compile

# Build backend
cd backend
pnpm build
```

## 🚢 Deployment

### Contracts → Base Sepolia
```bash
cd contracts
pnpm hardhat run scripts/deploy_all.ts --network baseSepolia
```

### Backend → Railway/Render
1. Push to GitHub
2. Connect repo to Railway/Render
3. Set environment variables
4. Deploy automatically

### Frontend → GitHub Pages
Already deployed! Updates push automatically.

## 🗺️ Roadmap

### ✅ Phase 1 (Current)
- [x] Core game mechanics
- [x] 2-player local mode
- [x] Smart contracts
- [x] Backend API
- [x] Wallet integration
- [x] NFT minting
- [x] Leaderboard

### 🔄 Phase 2 (In Progress)
- [ ] Deploy to Base Sepolia
- [ ] Backend hosting
- [ ] Enhanced anti-cheat
- [ ] Mobile touch controls
- [ ] Sound effects

### 🔮 Phase 3 (Future)
- [ ] Online multiplayer (Socket.IO)
- [ ] Tournament system
- [ ] NFT staking for boosts
- [ ] Power-ups marketplace
- [ ] Achievement NFTs (ERC-1155)
- [ ] Base Mainnet launch

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Test on Sepolia before mainnet

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🔗 Links

- **Live Game:** [https://ventolus.github.io/crypto-snake-battle](https://ventolus.github.io/crypto-snake-battle)
- **GitHub:** [https://github.com/Ventolus/crypto-snake-battle](https://github.com/Ventolus/crypto-snake-battle)
- **Base Network:** [https://base.org](https://base.org)
- **Base Sepolia Explorer:** [https://sepolia.basescan.org](https://sepolia.basescan.org)
- **Documentation:** See individual package READMEs

## 💙 Built With

- **Blockchain:** Base Network (Ethereum L2)
- **Smart Contracts:** Solidity 0.8.24, Hardhat, OpenZeppelin
- **Backend:** Node.js, Express, Prisma, PostgreSQL
- **Frontend:** Vanilla JavaScript, Ethers.js v6
- **Deployment:** GitHub Pages, Railway/Render

## 🙏 Acknowledgments

- Built with [Bhindi](https://bhindi.io) - where text transforms into action
- Powered by [Base Network](https://base.org)
- Smart contracts using [OpenZeppelin](https://openzeppelin.com)

---

**Made with ❤️ on Base Network** 🔵

For questions or support, open an issue on GitHub!