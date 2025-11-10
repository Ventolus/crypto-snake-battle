import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import { EIP712Signer, ClaimData } from "./eip712";
import rateLimit from "express-rate-limit";

const router = Router();
const prisma = new PrismaClient();

// Configuration
const CHAIN_ID = 84532; // Base Sepolia
const REWARDS_VAULT_ADDRESS = process.env.REWARDS_VAULT_ADDRESS!;
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY!;
const DIFFICULTY_NUMERATOR = parseInt(process.env.DIFFICULTY_NUMERATOR || "1");
const CAP_PER_WALLET_PER_DAY = ethers.parseEther(process.env.CAP_PER_WALLET_PER_DAY || "2000");
const CAP_GLOBAL_PER_DAY = ethers.parseEther(process.env.CAP_GLOBAL_PER_DAY || "200000");
const CLAIM_DEADLINE_SECONDS = 600; // 10 minutes

// Initialize EIP-712 signer
const signer = new EIP712Signer(SERVER_PRIVATE_KEY, CHAIN_ID, REWARDS_VAULT_ADDRESS);

console.log("🔐 Backend signer address:", signer.getAddress());

// Rate limiter for score submission (stricter)
const scoreSubmitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: "Too many score submissions, please try again later.",
  keyGenerator: (req) => {
    // Rate limit by both IP and wallet
    const wallet = req.body.wallet || "unknown";
    return `${req.ip}-${wallet}`;
  },
});

/**
 * Calculate reward from score
 */
function calculateReward(score: number): bigint {
  // reward = floor(score * difficulty / 100)
  const reward = Math.floor((score * DIFFICULTY_NUMERATOR) / 100);
  return ethers.parseEther(reward.toString());
}

/**
 * Generate unique nonce for a wallet
 */
async function generateNonce(wallet: string): Promise<bigint> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const nonce = BigInt(`${timestamp}${random}`);
  
  // Store nonce in database
  await prisma.nonce.create({
    data: {
      wallet: wallet.toLowerCase(),
      nonce: nonce.toString(),
    },
  });
  
  return nonce;
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check and update daily caps
 */
async function checkAndUpdateCaps(wallet: string, reward: bigint): Promise<boolean> {
  const today = getTodayString();
  
  // Check wallet daily cap
  const walletDaily = await prisma.dailyReward.findUnique({
    where: {
      wallet_day: {
        wallet: wallet.toLowerCase(),
        day: today,
      },
    },
  });
  
  const walletTotal = walletDaily ? BigInt(walletDaily.total) : 0n;
  if (walletTotal + reward > CAP_PER_WALLET_PER_DAY) {
    return false;
  }
  
  // Check global daily cap
  const globalDaily = await prisma.globalDailyReward.findUnique({
    where: { day: today },
  });
  
  const globalTotal = globalDaily ? BigInt(globalDaily.total) : 0n;
  if (globalTotal + reward > CAP_GLOBAL_PER_DAY) {
    return false;
  }
  
  // Update caps
  await prisma.dailyReward.upsert({
    where: {
      wallet_day: {
        wallet: wallet.toLowerCase(),
        day: today,
      },
    },
    update: {
      total: (walletTotal + reward).toString(),
    },
    create: {
      wallet: wallet.toLowerCase(),
      day: today,
      total: reward.toString(),
    },
  });
  
  await prisma.globalDailyReward.upsert({
    where: { day: today },
    update: {
      total: (globalTotal + reward).toString(),
    },
    create: {
      day: today,
      total: reward.toString(),
    },
  });
  
  return true;
}

/**
 * Basic anti-cheat validation
 */
function validateScore(score: number): boolean {
  // Basic sanity checks
  if (score < 0 || score > 100000) return false;
  if (!Number.isInteger(score)) return false;
  
  // TODO: Add more sophisticated checks:
  // - Game duration vs score ratio
  // - Move patterns
  // - Coin collection timing
  
  return true;
}

/**
 * POST /api/score/submit
 * Submit score and get signed claim
 */
router.post("/score/submit", scoreSubmitLimiter, async (req: Request, res: Response) => {
  try {
    const { wallet, score } = req.body;
    
    // Validation
    if (!wallet || !ethers.isAddress(wallet)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    
    if (typeof score !== "number" || !validateScore(score)) {
      return res.status(400).json({ error: "Invalid score" });
    }
    
    // Calculate reward
    const reward = calculateReward(score);
    
    if (reward === 0n) {
      return res.status(400).json({ error: "Score too low for reward" });
    }
    
    // Check caps
    const capsOk = await checkAndUpdateCaps(wallet, reward);
    if (!capsOk) {
      return res.status(429).json({ error: "Daily reward cap exceeded" });
    }
    
    // Generate nonce and deadline
    const nonce = await generateNonce(wallet);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + CLAIM_DEADLINE_SECONDS);
    
    // Create claim data
    const claim: ClaimData = {
      player: wallet,
      score,
      reward,
      nonce,
      deadline,
    };
    
    // Sign claim
    const signature = await signer.signClaim(claim);
    
    // Save score to database
    await prisma.score.create({
      data: {
        wallet: wallet.toLowerCase(),
        score,
        reward: reward.toString(),
      },
    });
    
    // Return signed claim
    res.json({
      claim: {
        player: claim.player,
        score: claim.score,
        reward: claim.reward.toString(),
        nonce: claim.nonce.toString(),
        deadline: claim.deadline.toString(),
      },
      signature,
    });
    
  } catch (error: any) {
    console.error("Error in /score/submit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/leaderboard/top
 * Get top scores
 */
router.get("/leaderboard/top", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    
    const scores = await prisma.score.findMany({
      orderBy: {
        score: "desc",
      },
      take: limit,
      select: {
        wallet: true,
        score: true,
        createdAt: true,
      },
    });
    
    // Group by wallet and take highest score
    const leaderboard = scores.reduce((acc: any[], curr) => {
      const existing = acc.find(s => s.wallet === curr.wallet);
      if (!existing || curr.score > existing.score) {
        if (existing) {
          acc = acc.filter(s => s.wallet !== curr.wallet);
        }
        acc.push(curr);
      }
      return acc;
    }, []);
    
    // Sort and limit again
    leaderboard.sort((a, b) => b.score - a.score);
    
    res.json({
      leaderboard: leaderboard.slice(0, limit),
      total: leaderboard.length,
    });
    
  } catch (error: any) {
    console.error("Error in /leaderboard/top:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/stats
 * Get global statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const today = getTodayString();
    
    const [totalScores, globalDaily] = await Promise.all([
      prisma.score.count(),
      prisma.globalDailyReward.findUnique({
        where: { day: today },
      }),
    ]);
    
    const rewardsToday = globalDaily ? BigInt(globalDaily.total) : 0n;
    const remainingToday = CAP_GLOBAL_PER_DAY - rewardsToday;
    
    res.json({
      totalGames: totalScores,
      rewardsDistributedToday: ethers.formatEther(rewardsToday),
      remainingRewardsToday: ethers.formatEther(remainingToday > 0n ? remainingToday : 0n),
      capPerWalletPerDay: ethers.formatEther(CAP_PER_WALLET_PER_DAY),
      capGlobalPerDay: ethers.formatEther(CAP_GLOBAL_PER_DAY),
    });
    
  } catch (error: any) {
    console.error("Error in /stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router };