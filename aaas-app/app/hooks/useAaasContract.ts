import { PublicKey } from "@solana/web3.js";
import { useWallet } from "../contexts/WalletContext";
import * as contractService from "../services/contractService";
import { MINT_OF_TOKEN_TO_PARTICIPATE_IN_CHALLENGE } from "../utils";
// Default SOL mint address
const DEFAULT_MINT = new PublicKey(MINT_OF_TOKEN_TO_PARTICIPATE_IN_CHALLENGE);

export function useAaasContract() {
  const {
    isConnected,
    userPublickey,
    signAndSendTransaction,
    anchorWallet,
    program,
  } = useWallet();

  const fetchChallenges = async () => {
    if (!program) {
      throw new Error("Program not initialized");
    }
    console.log("Fetching challenges");
    try {
      const challengeAccounts = await contractService.getAllChallenges(program);
      return challengeAccounts.map(contractService.formatChallengeData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      throw error;
    }
  };

  // Join a challenge
  const joinChallenge = async (
    challengeId: number,
    userName: string,
    description: string
  ): Promise<string> => {
    if (!program || !userPublickey) {
      throw new Error("Wallet not connected or program not initialized");
    }

    try {
      const transaction = await contractService.joinChallenge(
        program,
        challengeId,
        userName,
        description,
        userPublickey,
        DEFAULT_MINT
      );

      return await signAndSendTransaction(transaction);
    } catch (error) {
      // console.error("Error joining challenge:", error);
      throw error;
    }
  };

  // Vote for a challenge
  const voteForChallenge = async (
    challengeId: number,
    userAddress: string,
    isCompleted: boolean
  ): Promise<string> => {
    if (!program || !userPublickey) {
      throw new Error("Wallet not connected or program not initialized");
    }

    try {
      const userAddressPubkey = new PublicKey(userAddress);
      const transaction = await contractService.voteForChallenge(
        program,
        challengeId,
        userAddressPubkey,
        isCompleted,
        userPublickey
      );

      return await signAndSendTransaction(transaction);
    } catch (error) {
      // console.error("Error voting for challenge:", error);
      throw error;
    }
  };

  // Claim a challenge
  const claimChallenge = async (challengeId: number): Promise<string> => {
    if (!program || !userPublickey) {
      throw new Error("Wallet not connected or program not initialized");
    }

    try {
      const transaction = await contractService.claimChallenge(
        program,
        challengeId,
        userPublickey,
        DEFAULT_MINT
      );

      return await signAndSendTransaction(transaction);
    } catch (error) {
      console.error("Error claiming challenge:", error);
      throw error;
    }
  };

  return {
    program,
    fetchChallenges,
    joinChallenge,
    voteForChallenge,
    claimChallenge,
  };
}
