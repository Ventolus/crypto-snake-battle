import { ethers } from "ethers";

export interface ClaimData {
  player: string;
  score: number;
  reward: bigint;
  nonce: bigint;
  deadline: bigint;
}

export class EIP712Signer {
  private wallet: ethers.Wallet;
  private domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };

  constructor(privateKey: string, chainId: number, verifyingContract: string) {
    this.wallet = new ethers.Wallet(privateKey);
    this.domain = {
      name: "CryptoSnakeRewards",
      version: "1",
      chainId,
      verifyingContract,
    };
  }

  /**
   * Sign a claim using EIP-712
   */
  async signClaim(claim: ClaimData): Promise<string> {
    const types = {
      Claim: [
        { name: "player", type: "address" },
        { name: "score", type: "uint256" },
        { name: "reward", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = {
      player: claim.player,
      score: claim.score,
      reward: claim.reward.toString(),
      nonce: claim.nonce.toString(),
      deadline: claim.deadline.toString(),
    };

    const signature = await this.wallet.signTypedData(this.domain, types, value);
    return signature;
  }

  /**
   * Get signer address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Verify a signature (for testing)
   */
  async verifyClaim(claim: ClaimData, signature: string): Promise<boolean> {
    const types = {
      Claim: [
        { name: "player", type: "address" },
        { name: "score", type: "uint256" },
        { name: "reward", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = {
      player: claim.player,
      score: claim.score,
      reward: claim.reward.toString(),
      nonce: claim.nonce.toString(),
      deadline: claim.deadline.toString(),
    };

    const digest = ethers.TypedDataEncoder.hash(this.domain, types, value);
    const recoveredAddress = ethers.recoverAddress(digest, signature);
    
    return recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase();
  }
}