"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";
import {
  createAccountProfile,
  getAccountProfile,
  issueAccountChallenge,
  updateAccountProfile,
  type AccountProfile,
} from "@/lib/api-client";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type ProfileDraft = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  website: string;
  location: string;
};

const EMPTY_DRAFT: ProfileDraft = {
  username: "",
  displayName: "",
  bio: "",
  avatarUrl: "",
  website: "",
  location: "",
};

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

function mapProfileToDraft(profile: AccountProfile): ProfileDraft {
  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    website: profile.website,
    location: profile.location,
  };
}

export default function ConnectWalletPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [balance, setBalance] = useState<string>("");

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const canSaveProfile = useMemo(() => {
    const hasUploadedAvatar = /^data:image\//i.test(draft.avatarUrl);
    return !!connectedWallet && draft.username.trim().length >= 3 && hasUploadedAvatar && !isSavingProfile;
  }, [connectedWallet, draft.username, draft.avatarUrl, isSavingProfile]);

  useEffect(() => {
    checkIfWalletIsConnected();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const loadAccountProfile = async (walletAddress: string) => {
    setIsLoadingProfile(true);

    try {
      const data = await getAccountProfile(walletAddress);
      setProfile(data.account);

      if (data.account) {
        setDraft(mapProfileToDraft(data.account));
      } else {
        setDraft({ ...EMPTY_DRAFT, username: `user_${walletAddress.slice(2, 8)}` });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const account = accounts[0];
        setConnectedWallet(account.address);
        await Promise.all([
          updateNetworkInfo(provider),
          updateBalance(provider, account.address),
          loadAccountProfile(account.address),
        ]);
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
      return;
    }

    const nextWallet = accounts[0];
    setConnectedWallet(nextWallet);
    setSuccess("");
    setError("");
    setProfile(null);
    setDraft(EMPTY_DRAFT);
    checkIfWalletIsConnected();
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const updateNetworkInfo = async (provider: BrowserProvider) => {
    try {
      const network = await provider.getNetwork();
      const chainIdNum = Number(network.chainId);
      setChainId(chainIdNum.toString());

      const networkNames: { [key: number]: string } = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
        137: "Polygon Mainnet",
        80001: "Polygon Mumbai",
        1337: "Localhost",
      };

      const networkName = networkNames[chainIdNum] || `Chain ID: ${chainIdNum}`;
      setNetwork(networkName);
      setWrongNetwork(false);
    } catch (err) {
      console.error("Error getting network info:", err);
    }
  };

  const updateBalance = async (provider: BrowserProvider, address: string) => {
    try {
      const balanceWei = await provider.getBalance(address);
      const balanceEth = (Number(balanceWei) / 1e18).toFixed(4);
      setBalance(balanceEth);
    } catch (err) {
      console.error("Error getting balance:", err);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask browser extension.");
      return;
    }

    setIsConnecting(true);
    setError("");
    setSuccess("");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        const wallet = accounts[0];
        setConnectedWallet(wallet);
        await Promise.all([
          updateNetworkInfo(provider),
          updateBalance(provider, wallet),
          loadAccountProfile(wallet),
        ]);
      }
    } catch (err: any) {
      console.error("Error connecting to MetaMask:", err);
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the connection request in MetaMask.");
      } else {
        setError("Failed to connect to MetaMask. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }],
      });
      setWrongNetwork(false);
    } catch (err: any) {
      console.error("Error switching network:", err);
      if (err.code === 4902) {
        setError("Network not added to MetaMask. Please add it manually.");
      } else {
        setError("Failed to switch network. Please change it manually in MetaMask.");
      }
    }
  };

  const onProfileFieldChange = (field: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files can be used as profile pictures.");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setError("Profile image must be 2MB or smaller.");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read profile image"));
        reader.readAsDataURL(file);
      });

      setDraft((current) => ({ ...current, avatarUrl: dataUrl }));
      setError("");
      setSuccess("Profile picture ready. Save profile to persist it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image upload");
    }
  };

  const clearAvatar = () => {
    setDraft((current) => ({ ...current, avatarUrl: "" }));
  };

  const signChallenge = async (wallet: string) => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is required to sign profile updates");
    }

    const challenge = await issueAccountChallenge(wallet);
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(challenge.message);
    return { signature, challengeMessage: challenge.message };
  };

  const handleSaveProfile = async () => {
    if (!connectedWallet) return;

    if (!/^data:image\//i.test(draft.avatarUrl)) {
      setError("Profile picture upload is required.");
      return;
    }

    setIsSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const { signature, challengeMessage } = await signChallenge(connectedWallet);
      const payload = {
        wallet: connectedWallet,
        signature,
        challengeMessage,
        ...draft,
      };

      if (!profile) {
        const created = await createAccountProfile(payload);
        setProfile(created.account);
        setDraft(mapProfileToDraft(created.account));
        setSuccess("Account created and linked to your connected wallet.");
      } else {
        const updated = await updateAccountProfile(payload);
        setProfile(updated.account);
        setDraft(mapProfileToDraft(updated.account));
        setSuccess("Profile updated successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const disconnect = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (err) {
      console.error("Error revoking wallet permissions:", err);
    } finally {
      setConnectedWallet(null);
      setNetwork("");
      setChainId("");
      setBalance("");
      setProfile(null);
      setDraft(EMPTY_DRAFT);
      setWrongNetwork(false);
      setError("");
      setSuccess("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
        <div className="mb-8 border-b border-white pb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Wallet & Account</h1>
          <p className="mt-1 text-sm text-gray-400">
            Connect your wallet and manage your account profile in one place.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-white bg-black p-4">
            <p className="text-sm font-bold text-white">⚠ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-white bg-black p-4">
            <p className="text-sm font-bold text-white">✓ {success}</p>
          </div>
        )}

        {!connectedWallet ? (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Connect MetaMask</h2>
              <button
                onClick={connectMetaMask}
                disabled={isConnecting || (typeof window !== "undefined" && !window.ethereum)}
                className="w-full rounded bg-white px-6 py-4 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
              >
                {isConnecting
                  ? "Connecting..."
                  : typeof window !== "undefined" && !window.ethereum
                    ? "MetaMask Not Installed"
                    : "Connect MetaMask"}
              </button>

              {isConnecting && (
                <div className="mt-4 rounded border border-gray-700 bg-black p-4 text-center">
                  <p className="text-sm text-gray-400">Please check MetaMask and approve the connection request</p>
                </div>
              )}
            </div>

            {typeof window !== "undefined" && !window.ethereum && (
              <div className="rounded-lg border border-white bg-black p-6">
                <h3 className="mb-2 text-sm font-bold">MetaMask Not Detected</h3>
                <p className="mb-4 text-xs text-gray-400">
                  MetaMask is required to connect your wallet. Install the browser extension to continue.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-200"
                >
                  Install MetaMask →
                </a>
              </div>
            )}

            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h3 className="mb-2 text-sm font-bold">Why connect your wallet?</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>• Sign ownership-proof actions with your own key</li>
                <li>• Create and update your profile securely</li>
                <li>• Publish and manage verifiable content provenance</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="space-y-6">
              <div className="rounded-lg border border-white bg-black p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Wallet Connected</h2>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                    <span className="text-xs font-bold">ACTIVE</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 font-bold text-gray-400">Wallet Address</p>
                    <code className="block break-all rounded border border-gray-700 bg-black p-3 font-mono text-xs text-white">
                      {connectedWallet}
                    </code>
                  </div>

                  <div>
                    <p className="mb-1 font-bold text-gray-400">Network</p>
                    <p className="text-white">{network}</p>
                    {chainId && <p className="text-xs text-gray-400">Chain ID: {chainId}</p>}
                  </div>

                  {balance && (
                    <div>
                      <p className="mb-1 font-bold text-gray-400">Balance</p>
                      <p className="text-white">{balance} ETH</p>
                    </div>
                  )}
                </div>
              </div>

              {wrongNetwork && (
                <div className="rounded-lg border border-white bg-black p-6">
                  <h3 className="mb-3 text-lg font-bold">⚠ Wrong Network</h3>
                  <p className="mb-4 text-sm text-gray-400">
                    You are connected to the wrong network. Please switch to Ethereum Mainnet to use this application.
                  </p>
                  <button
                    onClick={switchNetwork}
                    className="w-full rounded bg-white px-4 py-2 font-bold text-black hover:bg-gray-200"
                  >
                    Switch to Ethereum Mainnet
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  href="/publish"
                  className="block w-full rounded bg-white px-6 py-3 text-center font-bold text-black hover:bg-gray-200"
                >
                  Go to Publish
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full rounded border border-white bg-black px-6 py-3 text-center font-bold text-white hover:bg-white hover:text-black"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={disconnect}
                  className="w-full rounded border border-gray-700 bg-black px-6 py-3 font-bold text-white hover:border-white"
                >
                  Disconnect Wallet
                </button>
              </div>

              <div className="rounded-lg border border-gray-700 bg-black p-4">
                <p className="text-xs text-gray-300">
                  Wallet-only policy: every action must be signed by your connected wallet.
                </p>
              </div>
            </section>

            <section className="space-y-4 rounded-lg border border-white bg-black p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{profile ? "Edit Account Profile" : "Create Account Profile"}</h2>
                <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300">
                  {profile ? "Profile exists" : "No profile yet"}
                </span>
              </div>

              {isLoadingProfile ? (
                <div className="rounded border border-gray-700 bg-black p-4 text-sm text-gray-400">Loading profile...</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-300">
                        Username
                      </label>
                      <input
                        id="username"
                        value={draft.username}
                        onChange={(e) => onProfileFieldChange("username", e.target.value)}
                        placeholder="your_handle"
                        className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-400">3-24 chars, letters numbers underscore only.</p>
                    </div>

                    <div>
                      <label htmlFor="displayName" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-300">
                        Display Name
                      </label>
                      <input
                        id="displayName"
                        value={draft.displayName}
                        onChange={(e) => onProfileFieldChange("displayName", e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-300">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        value={draft.bio}
                        onChange={(e) => onProfileFieldChange("bio", e.target.value)}
                        rows={4}
                        placeholder="What do you publish and verify?"
                        className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="avatar-upload" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-300">
                          Profile Picture
                        </label>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="cursor-pointer rounded border border-white px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-black"
                          >
                            {draft.avatarUrl ? "Change Image" : "Upload Image"}
                          </label>
                          {draft.avatarUrl && (
                            <button
                              type="button"
                              onClick={clearAvatar}
                              className="rounded border border-gray-700 px-3 py-1 text-xs font-bold text-gray-300 hover:border-white hover:text-white"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Required. PNG/JPG/WebP/GIF, up to 2MB.</p>
                      </div>

                      <div>
                        <label htmlFor="website" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-300">
                          Website
                        </label>
                        <input
                          id="website"
                          value={draft.website}
                          onChange={(e) => onProfileFieldChange("website", e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-300">
                        Location
                      </label>
                      <input
                        id="location"
                        value={draft.location}
                        onChange={(e) => onProfileFieldChange("location", e.target.value)}
                        placeholder="Singapore"
                        className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={!canSaveProfile}
                      className="w-full rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500"
                    >
                      {isSavingProfile ? "Requesting wallet signature..." : profile ? "Save Profile" : "Create Account"}
                    </button>
                  </div>

                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
