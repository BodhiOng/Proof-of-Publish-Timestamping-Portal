"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAddress(null);
    } else {
      setIsConnected(true);
      setAddress(accounts[0]);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setIsLoading(false);
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0].address);
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [checkConnection, handleAccountsChanged]);

  const disconnect = useCallback(async () => {
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
      setIsConnected(false);
      setAddress(null);
    }
  }, []);

  return { isConnected, address, isLoading, disconnect };
}
