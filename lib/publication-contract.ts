export const PUBLICATION_REGISTRY_ABI = [
  "function registerPublication(bytes32 contentHash, string contentType, bytes32 parentHash) external",
  "function getPublication(bytes32 contentHash) external view returns (address publisher, uint256 registeredAt, bytes32 parentHash, string contentType, bool exists)",
  "function hasPublication(bytes32 contentHash) external view returns (bool)",
] as const;

export function getPublicationRegistryAddress(): string {
  const address = process.env.NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS?.trim();

  if (!address) {
    throw new Error(
      "Missing NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS. Set this in .env.local to your deployed contract address."
    );
  }

  return address;
}
