"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectWalletPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [error, setError] = useState<string>("");
  const [balance, setBalance] = useState<string>("");

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkIfWalletIsConnected();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0];
        setConnectedWallet(account.address);
        await updateNetworkInfo(provider);
        await updateBalance(provider, account.address);
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setConnectedWallet(accounts[0]);
      checkIfWalletIsConnected();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const updateNetworkInfo = async (provider: BrowserProvider) => {
    try {
      const network = await provider.getNetwork();
      const chainIdNum = Number(network.chainId);
      setChainId(chainIdNum.toString());

      // Map chain IDs to network names
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

      // Check if wrong network (for this example, we accept any network)
      // You can add specific network requirements here
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
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask browser extension.");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setConnectedWallet(accounts[0]);
        await updateNetworkInfo(provider);
        await updateBalance(provider, accounts[0]);
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
    if (!window.ethereum) return;

    try {
      // Try to switch to Ethereum Mainnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // 0x1 = Ethereum Mainnet
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

  const disconnect = async () => {
    try {
      if (window.ethereum) {
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
      setWrongNetwork(false);
      setError("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 border-b border-white pb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Connect Wallet</h1>
          <p className="mt-1 text-sm text-gray-400">
            Connect your wallet to publish and manage content proofs
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-white bg-black p-4">
            <p className="text-sm font-bold text-white">⚠ {error}</p>
          </div>
        )}

        {!connectedWallet ? (
          <div className="space-y-6">
            {/* Connection Method */}
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
                    : "Connect MetaMask"
                }
              </button>

              {isConnecting && (
                <div className="mt-4 rounded border border-gray-700 bg-black p-4 text-center">
                  <p className="text-sm text-gray-400">Please check MetaMask and approve the connection request</p>
                </div>
              )}
            </div>

            {/* MetaMask Installation */}
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

            {/* Backend Signing Info */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h3 className="mb-2 text-sm font-bold">💡 About Wallet Connection</h3>
              <p className="text-xs text-gray-400">
                Connecting your wallet gives you full control and ownership. Your private keys never leave your device.
                You'll use your wallet to sign transactions and prove ownership of your publications.
              </p>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h3 className="mb-3 text-sm font-bold">Why Connect a Wallet?</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>• Sign transactions to register content hashes on-chain</li>
                <li>• Prove authorship and timestamp of your publications</li>
                <li>• Create verifiable version chains with parent hashes</li>
                <li>• Maintain full custody of your cryptographic identity</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="rounded-lg border border-white bg-black p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Connected</h2>
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
                  {chainId && (
                    <p className="text-xs text-gray-400">Chain ID: {chainId}</p>
                  )}
                </div>

                {balance && (
                  <div>
                    <p className="mb-1 font-bold text-gray-400">Balance</p>
                    <p className="text-white">{balance} ETH</p>
                  </div>
                )}
              </div>
            </div>

            {/* Wrong Network Warning */}
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

            {/* Actions */}
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

            {/* Security Reminder */}
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <h3 className="mb-2 text-sm font-bold">Security Reminder</h3>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Never share your private keys or seed phrase</li>
                <li>• Always verify transaction details before signing</li>
                <li>• Only connect to trusted applications</li>
                <li>• Keep your wallet software up to date</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
