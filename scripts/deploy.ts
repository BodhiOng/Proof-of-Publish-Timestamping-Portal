import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const ethers = hre.ethers;
  const PublicationRegistry = await ethers.getContractFactory("PublicationRegistry");
  const publicationRegistry = await PublicationRegistry.deploy();

  await publicationRegistry.waitForDeployment();

  console.log(`PublicationRegistry deployed to ${await publicationRegistry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
