const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PublicationRegistry", function () {
  async function deployRegistryFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const PublicationRegistry = await ethers.getContractFactory("PublicationRegistry");
    const registry = await PublicationRegistry.deploy();

    return { registry, owner, otherAccount };
  }

  describe("Registration", function () {
    it("Registers a publication and exposes stored metadata", async function () {
      const { registry, owner } = await loadFixture(deployRegistryFixture);
      const contentHash = ethers.id("content-A");

      await expect(registry.registerPublication(contentHash, "text", ethers.ZeroHash))
        .to.emit(registry, "PublicationRegistered")
        .withArgs(contentHash, owner.address, anyValue, ethers.ZeroHash, "text");

      expect(await registry.hasPublication(contentHash)).to.equal(true);

      const [publisher, registeredAt, parentHash, contentType, exists] = await registry.getPublication(contentHash);
      expect(publisher).to.equal(owner.address);
      expect(registeredAt).to.be.greaterThan(0);
      expect(parentHash).to.equal(ethers.ZeroHash);
      expect(contentType).to.equal("text");
      expect(exists).to.equal(true);
    });

    it("Rejects duplicate content hash registrations", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      const contentHash = ethers.id("content-duplicate");

      await registry.registerPublication(contentHash, "article", ethers.ZeroHash);
      await expect(
        registry.registerPublication(contentHash, "article", ethers.ZeroHash)
      ).to.be.revertedWith("Publication already exists");
    });

    it("Requires parent publication to exist", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      const childHash = ethers.id("child");
      const missingParentHash = ethers.id("missing-parent");

      await expect(
        registry.registerPublication(childHash, "text", missingParentHash)
      ).to.be.revertedWith("Parent publication not found");
    });

    it("Restricts child versions to the parent publisher", async function () {
      const { registry, otherAccount } = await loadFixture(deployRegistryFixture);
      const parentHash = ethers.id("parent");
      const childHash = ethers.id("child-version");

      await registry.registerPublication(parentHash, "text", ethers.ZeroHash);

      await expect(
        registry.connect(otherAccount).registerPublication(childHash, "text", parentHash)
      ).to.be.revertedWith("Only parent publisher can create child version");
    });

    it("Accepts child version registration by the parent publisher", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      const parentHash = ethers.id("parent-ok");
      const childHash = ethers.id("child-ok");

      await registry.registerPublication(parentHash, "text", ethers.ZeroHash);
      await expect(
        registry.registerPublication(childHash, "text", parentHash)
      ).not.to.be.reverted;
    });

    it("Rejects zero hash and empty content type", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);

      await expect(
        registry.registerPublication(ethers.ZeroHash, "text", ethers.ZeroHash)
      ).to.be.revertedWith("Content hash is required");

      await expect(
        registry.registerPublication(ethers.id("valid-hash"), "", ethers.ZeroHash)
      ).to.be.revertedWith("Content type is required");
    });
  });
});
