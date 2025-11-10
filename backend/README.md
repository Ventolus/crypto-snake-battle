# 🖥️ Backend API

Backend server for Crypto Snake Battle - handles score submission, reward signing, and leaderboard.

## 🎯 Features

- **EIP-712 Signature Generation:** Secure off-chain signing for reward claims
- **Anti-Cheat Validation:** Basic score validation (expandable)
- **Rate Limiting:** Per-IP and per-wallet limits
- **Daily Caps:** Enforces wallet and global daily reward limits
- **Leaderboard:** Tracks and serves top scores
- **Database:** PostgreSQL/SQLite via Prisma

## 🚀 Setup

### Install Dependencies
```bash
cd backend
pnpm install
```

### Configure Environment
Ensure `../.env` has these variables:
```bash
# Backend
PORT=8787
SERVER_PRIVATE_KEY=0x...  # Backend wallet for signing
CORS_ORIGIN=https://ventolus.github.io

# Contract addresses (from deployment)
REWARDS_VAULT_ADDRESS=0x...
SNAKE_TOKEN_ADDRESS=0x...

# Reward configuration
DIFFICULTY_NUMERATOR=1
CAP_PER_WALLET_PER_DAY=2000
CAP_GLOBAL_PER_DAY=200000

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Setup Database
```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# (Optional) Open Prisma Studio
pnpm prisma:studio
```

## 🔨 Development

### Run Development Server
```bash
pnpm dev
```

Server will run on `http://localhost:8787` with hot reload.

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

## 📡 API Endpoints

### POST /api/score/submit
Submit a game score and receive a signed claim.

**Request:**
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "score": 1500
}
```

**Response:**
```json
{
  "claim": {
    "player": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "score": 1500,
    "reward": "15000000000000000000",
    "nonce": "1704067200123456",
    "deadline": "1704067800"
  },
  "signature": "0x..."
}
```

**Rate Limit:** 5 requests/minute per IP+wallet

### GET /api/leaderboard/top?limit=100
Get top scores.

**Response:**
```json
{
  "leaderboard": [
    {
      "wallet": "0x...",
      "score": 5000,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 50
}
```

### GET /api/stats
Get global statistics.

**Response:**
```json
{
  "totalGames": 1234,
  "rewardsDistributedToday": "50000.0",
  "remainingRewardsToday": "150000.0",
  "capPerWalletPerDay": "2000.0",
  "capGlobalPerDay": "200000.0"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

## 🔐 Security

### EIP-712 Signing
- Uses typed structured data signing (EIP-712)
- Domain: `CryptoSnakeRewards` v1
- Verifying contract: RewardsVault address
- Prevents signature replay across chains/contracts

### Rate Limiting
- **Global:** 100 requests per 15 minutes per IP
- **Score Submit:** 5 requests per minute per IP+wallet
- Prevents spam and abuse

### Daily Caps
- **Per Wallet:** 2,000 SNAKE/day
- **Global:** 200,000 SNAKE/day
- Prevents reward drain

### Nonce System
- Each claim has unique nonce
- Stored in database
- Prevents replay attacks

### Anti-Cheat (Basic)
Current validation:
- Score range: 0-100,000
- Integer values only

**TODO (v2):**
- Game duration validation
- Move pattern analysis
- Coin collection timing
- Client-side game proof

## 🗄️ Database Schema

### Score
- `id`: Unique identifier
- `wallet`: Player wallet address
- `score`: Game score
- `reward`: Calculated reward (string)
- `createdAt`: Timestamp

### Nonce
- `id`: Unique identifier
- `wallet`: Player wallet
- `nonce`: Unique nonce (string)
- `usedAt`: Timestamp

### DailyReward
- `id`: Unique identifier
- `wallet`: Player wallet
- `day`: Date (YYYY-MM-DD)
- `total`: Total rewards claimed (string)
- `updatedAt`: Last update

### GlobalDailyReward
- `id`: Unique identifier
- `day`: Date (YYYY-MM-DD)
- `total`: Total global rewards (string)
- `updatedAt`: Last update

## 🚢 Deployment

### Railway.app (Recommended)
1. Create new project on Railway
2. Connect GitHub repo
3. Set environment variables
4. Deploy automatically

### Render.com
1. Create new Web Service
2. Connect GitHub repo
3. Build command: `cd backend && pnpm install && pnpm build`
4. Start command: `cd backend && pnpm start`
5. Set environment variables

### Docker (Optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN pnpm install
COPY backend/ ./
RUN pnpm build
CMD ["pnpm", "start"]
```

## 🧪 Testing

### Test EIP-712 Signing
```typescript
import { EIP712Signer } from "./src/eip712";

const signer = new EIP712Signer(
  "0x...", // private key
  84532,   // chainId
  "0x..."  // vault address
);

const claim = {
  player: "0x...",
  score: 1000,
  reward: 10n,
  nonce: 123n,
  deadline: 1704067800n,
};

const signature = await signer.signClaim(claim);
console.log("Signature:", signature);
```

## 📊 Monitoring

### Logs
```bash
# Development
pnpm dev

# Production (with PM2)
pm2 start dist/server.js --name crypto-snake-api
pm2 logs crypto-snake-api
```

### Database
```bash
# Open Prisma Studio
pnpm prisma:studio
```

## 🔗 Integration

### Frontend Integration
```javascript
// Submit score
const response = await fetch('https://api.example.com/api/score/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet, score }),
});

const { claim, signature } = await response.json();

// Use claim and signature with RewardsVault.claim()
```

## 📄 License

MIT