const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const PublicationRegistryModule = buildModule("PublicationRegistryModule", (m) => {
  const publicationRegistry = m.contract("PublicationRegistry", []);

  return { publicationRegistry };
});

module.exports = PublicationRegistryModule;
