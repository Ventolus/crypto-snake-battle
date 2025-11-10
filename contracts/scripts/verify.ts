import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Starting contract verification on Basescan...\n");

  // Load deployment addresses
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    console.error("❌ deployments.json not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const { SnakeToken, RewardsVault, CryptoSnakesGenesis } = deployments.contracts;

  // Verify SnakeToken
  console.log("1️⃣ Verifying SnakeToken...");
  try {
    await run("verify:verify", {
      address: SnakeToken,
      constructorArguments: [],
    });
    console.log("✅ SnakeToken verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ SnakeToken already verified\n");
    } else {
      console.error("❌ Error verifying SnakeToken:", error.message, "\n");
    }
  }

  // Verify RewardsVault
  console.log("2️⃣ Verifying RewardsVault...");
  try {
    const CAP_PER_WALLET_PER_DAY = "2000000000000000000000"; // 2000 SNAKE
    const CAP_GLOBAL_PER_DAY = "200000000000000000000000"; // 200,000 SNAKE
    
    await run("verify:verify", {
      address: RewardsVault,
      constructorArguments: [
        SnakeToken,
        deployments.deployer, // Initial signer
        CAP_PER_WALLET_PER_DAY,
        CAP_GLOBAL_PER_DAY,
      ],
    });
    console.log("✅ RewardsVault verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ RewardsVault already verified\n");
    } else {
      console.error("❌ Error verifying RewardsVault:", error.message, "\n");
    }
  }

  // Verify CryptoSnakesGenesis
  console.log("3️⃣ Verifying CryptoSnakesGenesis...");
  try {
    const MINT_PRICE = process.env.MINT_PRICE_WEI || "500000000000000"; // 0.0005 ETH
    
    await run("verify:verify", {
      address: CryptoSnakesGenesis,
      constructorArguments: [MINT_PRICE],
    });
    console.log("✅ CryptoSnakesGenesis verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ CryptoSnakesGenesis already verified\n");
    } else {
      console.error("❌ Error verifying CryptoSnakesGenesis:", error.message, "\n");
    }
  }

  console.log("🎉 Verification complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });