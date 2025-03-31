import { Program, AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import idl from "../idl.json";
import { AaasContract } from "../aaas-contract";

// Challenge Type Enum
export enum ChallengeType {
  GOOGLE_FIT = "GoogleFit",
  GITHUB = "GitHub",
  VOTE_BASED = "Votebased",
}

// Contract address
const PROGRAM_ID = new PublicKey(
  "2qZ14Js1pzXRRDC2CWLYeRCNx7Lge6sEzFmoRSsZz1Cj"
);

// Convert string to PublicKey
export const stringToPublicKey = (address: string): PublicKey => {
  return new PublicKey(address);
};

// Create a provider with the wallet adapter
export const getProvider = (connection: Connection, wallet: Wallet) => {
  // @ts-ignore
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
    commitment: "processed",
  });
  return provider;
};

// Initialize the program
export const getProgram = (provider: AnchorProvider) => {
  const program = new Program<AaasContract>(idl as AaasContract, provider);
  return program;
};

// Get PDA for challenge account
export const getChallengeAccountPDA = async (challengeId: number) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("challenge_account"),
      new BN(challengeId).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  return pda;
};

// Get PDA for user account
export const getUserAccountPDA = async (userPubkey: PublicKey) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_account"), userPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};

// Get PDA for user challenge account
export const getUserChallengeAccountPDA = async (
  userPubkey: PublicKey,
  challengeAccountPDA: PublicKey
) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_challenge_account"),
      userPubkey.toBuffer(),
      challengeAccountPDA.toBuffer(),
    ],
    PROGRAM_ID
  );
  return pda;
};

// Get PDA for vote account
export const getVoteAccountPDA = async (
  challengeAccountPDA: PublicKey,
  userPubkey: PublicKey
) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote_account"),
      challengeAccountPDA.toBuffer(),
      userPubkey.toBuffer(),
    ],
    PROGRAM_ID
  );
  return pda;
};

// Get PDA for treasury account
export const getTreasuryAccountPDA = async (challengeId: number) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("treasury_account"),
      new BN(challengeId).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  return pda;
};

// Get all challenges
export const getAllChallenges = async (program: Program<AaasContract>) => {
  try {
    const challengeAccounts = await program.account.challengeAccount.all();
    return challengeAccounts;
  } catch (error) {
    console.error("Error fetching challenges:", error);
    throw error;
  }
};

// Join a challenge
export const joinChallenge = async (
  program: Program<AaasContract>,
  challengeId: number,
  userName: string,
  description: string,
  userPublicKey: PublicKey,
  mint: PublicKey
) => {
  try {
    const treasuryAccount = await getTreasuryAccountPDA(challengeId);
    // Join challenge transaction
    const tx = await program.methods
      .joinChallenge(new BN(challengeId), userName, description)
      .accounts({
        signer: userPublicKey,
        mint: mint,
        treasuryAccount: treasuryAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    return tx;
  } catch (error) {
    console.error("Error joining challenge:", error);
    throw error;
  }
};

// Vote for a challenge
export const voteForChallenge = async (
  program: Program<AaasContract>,
  challengeId: number,
  userAddress: PublicKey,
  verification: boolean,
  voterPublicKey: PublicKey
) => {
  try {
    // Create a verification object
    const challengeVerification = {
      voteBased: {
        isCompleted: verification,
      },
    };

    // Vote transaction
    const tx = await program.methods
      .voteForVoteBasedChallenge(
        new BN(challengeId),
        userAddress,
        challengeVerification
      )
      .accounts({
        signer: voterPublicKey,
      })
      .transaction();

    return tx;
  } catch (error) {
    console.error("Error voting for challenge:", error);
    throw error;
  }
};

// Claim a challenge reward
export const claimChallenge = async (
  program: Program<AaasContract>,
  challengeId: number,
  userPublicKey: PublicKey,
  mint: PublicKey
) => {
  try {
    const treasuryAccount = await getTreasuryAccountPDA(challengeId);

    // Claim challenge transaction
    const tx = await program.methods
      .claimChallenge(new BN(challengeId))
      .accounts({
        signer: userPublicKey,
        mint: mint,
        treasuryAccount: treasuryAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    return tx;
  } catch (error) {
    console.error("Error claiming challenge:", error);
    throw error;
  }
};

// Get user challenge status
export const getUserChallengeStatus = async (
  program: Program<AaasContract>,
  challengeId: number,
  userPublicKey: PublicKey
) => {
  try {
    const challengeAccount = await getChallengeAccountPDA(challengeId);
    const userChallengeAccount = await getUserChallengeAccountPDA(
      userPublicKey,
      challengeAccount
    );

    const userChallengeData = await program.account.userChallengeAccount.fetch(
      userChallengeAccount
    );
    return userChallengeData;
  } catch (error) {
    console.error("Error getting user challenge status:", error);
    throw error;
  }
};

// Format challenge data
export const formatChallengeData = (challenge: any) => {
  const account = challenge.account;

  // Convert the challenge type to a string
  let challengeType: ChallengeType;
  if (account.challengeInformation.challengeType.googleFit) {
    challengeType = ChallengeType.GOOGLE_FIT;
  } else if (account.challengeInformation.challengeType.github) {
    challengeType = ChallengeType.GITHUB;
  } else if (account.challengeInformation.challengeType.voteBased) {
    challengeType = ChallengeType.VOTE_BASED;
  } else {
    challengeType = ChallengeType.VOTE_BASED; // Default
  }

  return {
    id: account.challengeId.toString(),
    title: account.challengeInformation.challengeName,
    description: account.challengeInformation.challengeDescription,
    challenge_type: challengeType,
    start_time: new Date(account.startTime * 1000).toISOString(),
    end_time: new Date(account.endTime * 1000).toISOString(),
    total_participants: account.totalParticipants.toNumber(),
    total_votes: account.totalVotes.toNumber(),
    money_pool: account.moneyPool.toNumber() / 1_000_000_000, // Convert from lamports to SOL
    money_per_participant:
      account.moneyPerParticipant.toNumber() / 1_000_000_000,
    treasury_account: account.treasuryAccount.toString(),
    is_private: account.isPrivate,
    private_group: Array.isArray(account.privateGroup)
      ? account.privateGroup.map((pubkey: PublicKey) => pubkey.toString())
      : [],
  };
};

// Initialize a new challenge
export const initializeChallenge = async (
  program: Program<AaasContract>,
  challengeId: number,
  challengeType: ChallengeType,
  startTime: Date,
  endTime: Date,
  moneyPerParticipant: number,
  isPrivate: boolean,
  privateGroup: string[],
  mint: PublicKey,
  userPublicKey: PublicKey,
  challengeName: string,
  challengeDescription: string,
  stepsPerDay?: number,
  commitsPerDay?: number
) => {
  try {
    // Convert the dates to Unix timestamp (seconds)
    const startTimeUnix = Math.floor(startTime.getTime() / 1000);
    const endTimeUnix = Math.floor(endTime.getTime() / 1000);

    // Convert moneyPerParticipant from SOL to lamports
    const moneyPerParticipantLamports = new BN(
      moneyPerParticipant * 1_000_000_000
    );

    // Convert challenge type to the format expected by the contract
    let challengeTypeObj;
    if (challengeType === ChallengeType.GOOGLE_FIT) {
      challengeTypeObj = { googleFit: { steps: new BN(stepsPerDay || 10000) } };
    } else if (challengeType === ChallengeType.GITHUB) {
      challengeTypeObj = { github: { commits: new BN(commitsPerDay || 3) } };
    } else {
      challengeTypeObj = { voteBased: {} };
    }

    // Convert private group strings to PublicKeys
    const privateGroupPubkeys = privateGroup.map((addr) => new PublicKey(addr));

    // Get PDAs
    const treasuryAccount = await getTreasuryAccountPDA(challengeId);
    const challengeAccount = await getChallengeAccountPDA(challengeId);

    // Create the challenge information object
    const challengeInformation = {
      challengeName,
      challengeDescription,
      challengeType: challengeTypeObj,
    };

    // Follow the same pattern as other functions (e.g., joinChallenge)
    // @ts-ignore - Type issues are expected because of the IDL structure
    const tx = await program.methods
      .initializeChallenge(
        new BN(challengeId),
        challengeInformation,
        new BN(startTimeUnix),
        new BN(endTimeUnix),
        moneyPerParticipantLamports,
        isPrivate,
        privateGroupPubkeys
      )
      .accounts({
        signer: userPublicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error initializing challenge:", error);
    throw error;
  }
};
