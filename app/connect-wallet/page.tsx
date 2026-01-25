"use client";

import Link from "next/link";
import { useState } from "react";

export default function ConnectWalletPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("Ethereum Mainnet");
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const connectMetaMask = async () => {
    setIsConnecting(true);
    // Simulate wallet connection
    setTimeout(() => {
      setConnectedWallet("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
      setIsConnecting(false);
      setWrongNetwork(Math.random() > 0.7); // Randomly simulate wrong network
    }, 1000);
  };

  const connectWalletConnect = async () => {
    setIsConnecting(true);
    setTimeout(() => {
      setConnectedWallet("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063");
      setIsConnecting(false);
    }, 1500);
  };

  const switchNetwork = () => {
    setWrongNetwork(false);
    setNetwork("Ethereum Mainnet");
  };

  const disconnect = () => {
    setConnectedWallet(null);
    setWrongNetwork(false);
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

        {!connectedWallet ? (
          <div className="space-y-6">
            {/* Connection Methods */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Choose Connection Method</h2>
              <div className="space-y-3">
                <button
                  onClick={connectMetaMask}
                  disabled={isConnecting}
                  className="flex w-full items-center justify-between rounded border border-white bg-black p-4 text-left hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
                >
                  <div>
                    <p className="font-bold">MetaMask</p>
                    <p className="text-xs text-gray-400">Connect using MetaMask browser extension</p>
                  </div>
                  <span className="text-2xl">→</span>
                </button>

                <button
                  onClick={connectWalletConnect}
                  disabled={isConnecting}
                  className="flex w-full items-center justify-between rounded border border-white bg-black p-4 text-left hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
                >
                  <div>
                    <p className="font-bold">WalletConnect</p>
                    <p className="text-xs text-gray-400">Scan QR code with your mobile wallet</p>
                  </div>
                  <span className="text-2xl">→</span>
                </button>
              </div>

              {isConnecting && (
                <div className="mt-4 rounded border border-gray-700 bg-black p-4 text-center">
                  <p className="text-sm text-gray-400">Connecting...</p>
                </div>
              )}
            </div>

            {/* Backend Signing Warning */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h3 className="mb-2 text-sm font-bold">⚠ About Backend Signing</h3>
              <p className="text-xs text-gray-400">
                While we support backend signing for convenience, it means our server controls the private key. 
                For maximum security and true ownership, always use your own wallet (MetaMask or WalletConnect). 
                Backend signing should only be used for testing or non-critical content.
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
                  <code className="block rounded border border-gray-700 bg-black p-3 text-white">
                    {connectedWallet}
                  </code>
                </div>

                <div>
                  <p className="mb-1 font-bold text-gray-400">Network</p>
                  <p className="text-white">{network}</p>
                </div>
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
