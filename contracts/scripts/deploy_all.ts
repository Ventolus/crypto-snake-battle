import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment to Base Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration
  const VAULT_SEED = process.env.REWARD_VAULT_SEED || ethers.parseEther("1000000").toString();
  const MINT_PRICE = process.env.MINT_PRICE_WEI || ethers.parseEther("0.0005").toString();
  const CAP_PER_WALLET_PER_DAY = ethers.parseEther("2000"); // 2000 SNAKE
  const CAP_GLOBAL_PER_DAY = ethers.parseEther("200000"); // 200,000 SNAKE

  // 1. Deploy SnakeToken
  console.log("1️⃣ Deploying SnakeToken...");
  const SnakeToken = await ethers.getContractFactory("SnakeToken");
  const snakeToken = await SnakeToken.deploy();
  await snakeToken.waitForDeployment();
  const snakeTokenAddress = await snakeToken.getAddress();
  console.log("✅ SnakeToken deployed to:", snakeTokenAddress);
  console.log("   Max Supply:", ethers.formatEther(await snakeToken.MAX_SUPPLY()), "SNAKE\n");

  // 2. Deploy RewardsVault
  console.log("2️⃣ Deploying RewardsVault...");
  const RewardsVault = await ethers.getContractFactory("RewardsVault");
  const rewardsVault = await RewardsVault.deploy(
    snakeTokenAddress,
    deployer.address, // Signer (will be updated to backend wallet later)
    CAP_PER_WALLET_PER_DAY,
    CAP_GLOBAL_PER_DAY
  );
  await rewardsVault.waitForDeployment();
  const rewardsVaultAddress = await rewardsVault.getAddress();
  console.log("✅ RewardsVault deployed to:", rewardsVaultAddress);
  console.log("   Cap per wallet/day:", ethers.formatEther(CAP_PER_WALLET_PER_DAY), "SNAKE");
  console.log("   Cap global/day:", ethers.formatEther(CAP_GLOBAL_PER_DAY), "SNAKE\n");

  // 3. Mint initial tokens to RewardsVault
  console.log("3️⃣ Minting initial tokens to RewardsVault...");
  const mintTx = await snakeToken.mintTo(rewardsVaultAddress, VAULT_SEED);
  await mintTx.wait();
  const vaultBalance = await snakeToken.balanceOf(rewardsVaultAddress);
  console.log("✅ Minted", ethers.formatEther(vaultBalance), "SNAKE to RewardsVault\n");

  // 4. Deploy CryptoSnakesGenesis
  console.log("4️⃣ Deploying CryptoSnakesGenesis NFT...");
  const CryptoSnakesGenesis = await ethers.getContractFactory("CryptoSnakesGenesis");
  const genesisNFT = await CryptoSnakesGenesis.deploy(MINT_PRICE);
  await genesisNFT.waitForDeployment();
  const genesisNFTAddress = await genesisNFT.getAddress();
  console.log("✅ CryptoSnakesGenesis deployed to:", genesisNFTAddress);
  console.log("   Max Supply:", await genesisNFT.MAX_SUPPLY());
  console.log("   Mint Price:", ethers.formatEther(await genesisNFT.mintPrice()), "ETH\n");

  // Save deployment addresses
  const deployments = {
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SnakeToken: snakeTokenAddress,
      RewardsVault: rewardsVaultAddress,
      CryptoSnakesGenesis: genesisNFTAddress,
    },
    config: {
      vaultSeed: ethers.formatEther(VAULT_SEED),
      mintPrice: ethers.formatEther(MINT_PRICE),
      capPerWalletPerDay: ethers.formatEther(CAP_PER_WALLET_PER_DAY),
      capGlobalPerDay: ethers.formatEther(CAP_GLOBAL_PER_DAY),
    },
  };

  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("📄 Deployment info saved to:", deploymentsPath);

  console.log("\n🎉 Deployment complete!\n");
  console.log("📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SnakeToken:           ", snakeTokenAddress);
  console.log("RewardsVault:         ", rewardsVaultAddress);
  console.log("CryptoSnakesGenesis:  ", genesisNFTAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("⚠️  Next steps:");
  console.log("1. Update .env with contract addresses");
  console.log("2. Update RewardsVault signer to backend wallet:");
  console.log("   await rewardsVault.updateSigner(BACKEND_WALLET_ADDRESS)");
  console.log("3. Verify contracts on Basescan:");
  console.log("   pnpm hardhat run scripts/verify.ts --network baseSepolia");
  console.log("4. Update frontend/wallet.js with contract addresses\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });