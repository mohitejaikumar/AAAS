import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useRouter } from 'expo-router';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  const connectWallet = async () => {
    setIsConnecting(true);
    // Mock wallet connection for now
    // In a real app, this would integrate with a Solana wallet
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        // Navigate to challenges page after successful connection
        router.replace('/challenges');
        resolve();
      }, 1500);
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 