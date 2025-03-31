import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "expo-router";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AuthorizationResult } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { toUint8Array } from "js-base64";
import { useConnection } from "../hooks/useConnection";
import * as anchor from "@coral-xyz/anchor";
import { AaasContract } from "../aaas-contract";
import * as contractService from "../services/contractService";
const APP_CLUSTER = "devnet";
export const APP_IDENTITY = {
  name: "AAAS dApp",
  uri: "https://aaas-app.com",
  icon: "../../assets/images/favicon.png",
};

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  userPublickey: PublicKey | null;
  dappWallet: Web3MobileWallet | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signAndSendTransaction: (
    instruction: TransactionInstruction
  ) => Promise<string>;
  signAndSendAllTransaction: (
    instructions: TransactionInstruction[]
  ) => Promise<string>;
  anchorWallet: anchor.Wallet;
  program: anchor.Program<AaasContract> | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [storedAuthToken, setStoredAuthToken] = useState<string | null>(null);
  const [userPublickey, setUserPublickey] = useState<PublicKey | null>(null);
  const [authorization, setAuthorization] =
    useState<AuthorizationResult | null>(null);
  const [dappWallet, setDappWallet] = useState<Web3MobileWallet | null>(null);
  const [program, setProgram] = useState<anchor.Program<AaasContract> | null>(
    null
  );
  const router = useRouter();
  const connection = useConnection();

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
        if (
          authorizationResult &&
          authorizationResult.accounts &&
          authorizationResult.accounts.length > 0
        ) {
          const publicKey = new PublicKey(
            toUint8Array(authorizationResult.accounts[0].address)
          );
          console.log(publicKey.toString());
          setStoredAuthToken(authorizationResult.auth_token);
          setUserPublickey(publicKey);
          setIsConnecting(() => false);
          setIsConnected(() => true);
        } else {
          // console.error("No accounts found in authorization result");
          setIsConnecting(() => false);
        }

        return await handleAuthorizationResult(authorizationResult);
      } catch (error) {
        
        setIsConnecting(() => false);
      }
    },
    [authorization, handleAuthorizationResult]
  );

  const connectWallet = async () => {
    setIsConnecting(true);
    setIsConnected(false);

    await transact(async (wallet) => {
      setDappWallet(wallet);
      await authorizeSession(wallet);
      console.log("Connected to wallet");
      router.replace("/challenges");
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUserPublickey(null);
    setDappWallet(null);
    router.replace("/");
  };

  // Sign and send transaction
  const signAndSendTransaction = async (
    instruction: TransactionInstruction
  ): Promise<string> => {
    if (!dappWallet || !userPublickey) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublickey;

      // Sign transaction
      const signedTransaction = await transact(async (wallet) => {
        const authorizationResult = await wallet.authorize({
          cluster: "devnet",
          identity: APP_IDENTITY,
        });
        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });
        return signedTransactions[0] as Transaction;
      });

      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      console.log("Signature:", signature);

      // Confirm transaction
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      return signature;
    } catch (error) {
      // console.error("Error signing and sending transaction:", error);
      throw error;
    }
  };

  // Sign and send transaction
  const signAndSendAllTransaction = async (
    instructions: TransactionInstruction[]
  ): Promise<string> => {
    if (!dappWallet || !userPublickey) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublickey;

      // Sign transaction
      const signedTransaction = await transact(async (wallet) => {
        const authorizationResult = await wallet.authorize({
          cluster: "devnet",
          identity: APP_IDENTITY,
        });
        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });
        return signedTransactions[0] as Transaction;
      });

      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      console.log("Signature:", signature);

      // Confirm transaction
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      return signature;
    } catch (error) {
      // console.error("Error signing and sending transaction:", error);
      throw error;
    }
  };

  const signTransaction = async (transaction: Transaction) => {
    return transact(async (wallet: Web3MobileWallet) => {
      const authorizationResult = await wallet.authorize({
        cluster: "devnet",
        identity: APP_IDENTITY,
      });

      transaction.feePayer = userPublickey;

      const signedTransactions = await wallet.signTransactions({
        transactions: [transaction],
      });
      return signedTransactions[0];
    });
  };

  const signAllTransactions = async (transactions: Transaction[]) => {
    return transact(async (wallet: Web3MobileWallet) => {
      const authorizationResult = await wallet.authorize({
        cluster: "devnet",
        identity: APP_IDENTITY,
      });

      transactions.forEach((transaction) => {
        transaction.feePayer = userPublickey;
      });

      const signedTransactions = await wallet.signTransactions({
        transactions: transactions,
      });
      return signedTransactions;
    });
  };

  const anchorWallet = useMemo(() => {
    return {
      signTransaction,
      signAllTransactions,
      get publicKey() {
        return userPublickey;
      },
    } as anchor.Wallet;
  }, []);

  const initializeProgram = useCallback(() => {
    console.log("Initializing program");
    const provider = contractService.getProvider(connection, anchorWallet);
    console.log("Provider initialized");
    const programInstance = contractService.getProgram(provider);
    console.log("Program instance:", programInstance);
    setProgram(() => programInstance);
  }, [connection, anchorWallet]);

  useEffect(() => {
    if (isConnected && userPublickey) {
      initializeProgram();
    } else {
      setProgram(null);
    }
  }, [isConnected, userPublickey]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectWallet,
        disconnectWallet,
        userPublickey,
        dappWallet,
        signAndSendTransaction,
        anchorWallet,
        program,
        signAndSendAllTransaction,
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
