import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "expo-router";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey } from "@solana/web3.js";
import { AuthorizationResult } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { toUint8Array } from "js-base64";

const APP_CLUSTER = "devnet";
export const APP_IDENTITY = {
  name: "React Native dApp",
  uri: "https://yourdapp.com",
  icon: "../../assets/images/favicon.png", // Full path resolves to https://yourdapp.com/favicon.ico
};

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  userPublickey: PublicKey | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [storedAuthToken, setStoredAuthToken] = useState<string | null>(null);
  const [userPublickey, setUserPublickey] = useState<PublicKey | null>(null);
  const [authorization, setAuthorization] =
    useState<AuthorizationResult | null>(null);
  const router = useRouter();

  const handleAuthorizationResult = useCallback(
    async (authorizationResult: AuthorizationResult) => {
      setAuthorization(authorizationResult);
      return authorizationResult;
    },
    []
  );

  const authorizeSession = useCallback(
    async (wallet: Web3MobileWallet) => {
      try {
        const authorizationResult = await (authorization
          ? wallet.reauthorize({
              auth_token: authorization.auth_token,
              identity: APP_IDENTITY,
            })
          : wallet.authorize({
              cluster: APP_CLUSTER,
              identity: APP_IDENTITY,
            }));

        console.log(authorizationResult);
        console.log(
          new PublicKey(toUint8Array(authorizationResult.accounts[0].address))
        );
        console.log("uibvnioen");
        setStoredAuthToken(authorizationResult.auth_token);
        setUserPublickey(
          new PublicKey(toUint8Array(authorizationResult.accounts[0].address))
        );
        setIsConnecting(() => false);
        setIsConnected(() => true);

        return await handleAuthorizationResult(authorizationResult);
      } catch (error) {
        console.log(error);
      }
    },
    [authorization, handleAuthorizationResult]
  );

  const connectWallet = async () => {
    setIsConnecting(true);
    setIsConnected(false);

    await transact(async (wallet) => {
      await authorizeSession(wallet);
      console.log("Connected to wallet");
      router.replace("/challenges");
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
        userPublickey,
      }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
