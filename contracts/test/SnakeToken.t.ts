import { expect } from "chai";
import { ethers } from "hardhat";
import { SnakeToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SnakeToken", function () {
  let snakeToken: SnakeToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const SnakeToken = await ethers.getContractFactory("SnakeToken");
    snakeToken = await SnakeToken.deploy();
    await snakeToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await snakeToken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await snakeToken.name()).to.equal("Snake Token");
      expect(await snakeToken.symbol()).to.equal("SNAKE");
    });

    it("Should have correct max supply", async function () {
      const maxSupply = await snakeToken.MAX_SUPPLY();
      expect(maxSupply).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should start with zero total supply", async function () {
      expect(await snakeToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      await snakeToken.mintTo(addr1.address, amount);
      
      expect(await snakeToken.balanceOf(addr1.address)).to.equal(amount);
      expect(await snakeToken.totalSupply()).to.equal(amount);
    });

    it("Should emit TokensMinted event", async function () {
      const amount = ethers.parseEther("1000");
      await expect(snakeToken.mintTo(addr1.address, amount))
        .to.emit(snakeToken, "TokensMinted")
        .withArgs(addr1.address, amount);
    });

    it("Should not allow non-owner to mint", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        snakeToken.connect(addr1).mintTo(addr2.address, amount)
      ).to.be.revertedWithCustomError(snakeToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await snakeToken.MAX_SUPPLY();
      await expect(
        snakeToken.mintTo(addr1.address, maxSupply + 1n)
      ).to.be.revertedWith("SnakeToken: Max supply exceeded");
    });

    it("Should not allow minting to zero address", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        snakeToken.mintTo(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("SnakeToken: Cannot mint to zero address");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await snakeToken.mintTo(addr1.address, amount);
    });

    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      await snakeToken.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await snakeToken.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await snakeToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("900")
      );
    });

    it("Should not allow transfers exceeding balance", async function () {
      const transferAmount = ethers.parseEther("2000");
      await expect(
        snakeToken.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(snakeToken, "ERC20InsufficientBalance");
    });
  });
});