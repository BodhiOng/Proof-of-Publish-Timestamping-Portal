const hre = require("hardhat");

async function main() {
  const PublicationRegistry = await hre.ethers.getContractFactory("PublicationRegistry");
  const publicationRegistry = await PublicationRegistry.deploy();

  await publicationRegistry.waitForDeployment();

  console.log(`PublicationRegistry deployed to ${await publicationRegistry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
