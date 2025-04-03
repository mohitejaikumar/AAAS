import { google } from "googleapis";
import { Connection, PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { AaasContract } from "./aaas-contract";
import { Keypair } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

// Google Fit API OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_FIT_CLIENT_ID,
  process.env.GOOGLE_FIT_CLIENT_SECRET
);

// Create Fitness client
const fitness = google.fitness({
  version: "v1",
  auth: oauth2Client,
});

// Initialize Solana connection and program
const keypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.SECRET_KEY as string))
);
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
);

// User tokens storage
// In production, this should be stored in a database
const userTokens = new Map<
  string,
  {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }
>();

// Challenge data storage
// In production, this should be stored in a database
interface ChallengeData {
  challengeId: number;
  userId: string;
  stepsPerDay: number;
  startTime: string;
  endTime: string;
  lastUpdated?: number;
}
const challengeData = new Map<number, ChallengeData>();

// Get the user's challenge account PDA
function getUserChallengeAccountPDA(
  userPubkey: PublicKey,
  challengeAccountPDA: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_challenge_account"),
      userPubkey.toBuffer(),
      challengeAccountPDA.toBuffer(),
    ],
    process.env.PROGRAM_ID
      ? new PublicKey(process.env.PROGRAM_ID)
      : new PublicKey("2qZ14Js1pzXRRDC2CWLYeRCNx7Lge6sEzFmoRSsZz1Cj")
  );
}

// Get the challenge account PDA
function getChallengeAccountPDA(
  challengeId: number,
  program: Program<AaasContract>
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("challenge_account"),
      new BN(challengeId).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
}

// Exchange authorization code for tokens
export async function exchangeAuthCodeForTokens(
  access_token: string,
  refresh_token: string,
  userId: string,
  expires_in?: number
) {
  try {
    if (access_token && refresh_token && expires_in) {
      // Store tokens for this user
      userTokens.set(userId, {
        access_token: access_token,
        refresh_token: refresh_token,
        expiry_date: Date.now() + expires_in * 1000,
      });

      return { success: true };
    }

    return { success: false, error: "Invalid tokens received" };
  } catch (error) {
    console.error("Error exchanging auth code for tokens:", error);
    return { success: false, error };
  }
}

// Register a challenge for tracking
export function registerChallenge(data: ChallengeData) {
  try {
    challengeData.set(data.challengeId, data);
    return { success: true };
  } catch (error) {
    console.error("Error registering challenge:", error);
    return { success: false, error };
  }
}

// Fetch the step count from Google Fit for a user within a time range
async function fetchStepCount(
  userId: string,
  startTimeMillis: number,
  endTimeMillis: number
) {
  const userToken = userTokens.get(userId);

  if (!userToken) {
    console.error("No tokens found for user:", userId);
    return null;
  }

  // Set the auth credentials using the access token
  oauth2Client.setCredentials({
    access_token: userToken.access_token,
    refresh_token: userToken.refresh_token,
    expiry_date: userToken.expiry_date,
  });

  try {
    // Make a request to the Google Fit API to get step count data
    const response = (await fitness.users.dataset.aggregate({
      userId: "me",
      requestBody: {
        aggregateBy: [
          {
            dataTypeName: "com.google.step_count.delta",
            dataSourceId:
              "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
          },
        ],
        bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
        startTimeMillis,
        endTimeMillis,
      },
    } as any)) as any; // Type assertion to avoid type errors

    console.log("Response:", response);
    // Extract step count from the response
    let stepCount = 0;
    if (
      response.data &&
      response.data.bucket &&
      response.data.bucket.length > 0
    ) {
      const bucket = response.data.bucket[0];
      if (bucket.dataset && bucket.dataset.length > 0) {
        const dataset = bucket.dataset[0];
        if (dataset.point && dataset.point.length > 0) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              stepCount += point.value[0].intVal || 0;
            }
          }
        }
      }
    }

    return stepCount;
  } catch (error: any) {
    console.error("Error fetching step count from Google Fit:", error);

    // If token expired, refresh the token and try again
    if (error.response && error.response.status === 401) {
      try {
        // Use setCredentials and getAccessToken instead of refreshToken
        oauth2Client.setCredentials({
          refresh_token: userToken.refresh_token,
        });
        const tokenResponse = (await oauth2Client.getAccessToken()) as any;
        const tokens = tokenResponse.token || tokenResponse;

        if (tokens && typeof tokens === "string") {
          // Update the user's tokens
          userTokens.set(userId, {
            access_token: tokens,
            refresh_token: userToken.refresh_token,
            expiry_date: userToken.expiry_date,
          });

          // Try again with the new token
          return await fetchStepCount(userId, startTimeMillis, endTimeMillis);
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
      }
    }

    return null;
  }
}

// Update the user's step count on the blockchain
async function updateUserStepCount(
  program: Program<AaasContract>,
  challengeId: number,
  userId: string,
  stepCount: number
) {
  try {
    const userPubkey = new PublicKey(userId);
    const challengeAccountPDA = getChallengeAccountPDA(challengeId, program);
    const userChallengeAccountPDA = getUserChallengeAccountPDA(
      userPubkey,
      challengeAccountPDA[0]
    );

    // Get the program state PDA
    const programStatePDA = PublicKey.findProgramAddressSync(
      [Buffer.from("program_owner")],
      program.programId
    );

    // Create and send transaction to update step count
    const tx = await program.methods
      .updateChallengeStatus(new BN(challengeId), userPubkey, {
        challengeType: {
          monitored: {
            score: new BN(stepCount),
            isCompleted: true,
          },
        },
      })
      .accounts({
        signer: keypair.publicKey,
        state: programStatePDA[0],
        challengeAccount: challengeAccountPDA[0],
        userChallengeAccount: userChallengeAccountPDA[0],
      } as any) // Type assertion to avoid account property errors
      .signers([keypair])
      .rpc();

    console.log(
      `Updated step count for user ${userId} in challenge ${challengeId}: ${stepCount} steps`
    );
    return { success: true, transaction: tx };
  } catch (error) {
    console.error("Error updating user step count on blockchain:", error);
    return { success: false, error };
  }
}

// Regular job to process all challenges and update step counts
export async function processAllChallenges(program: Program<AaasContract>) {
  console.log("Processing all challenges...");

  const now = Date.now();

  for (const [challengeId, challenge] of challengeData.entries()) {
    // Skip challenges that are not yet started or already ended
    const startDate = new Date(challenge.startTime).getTime();
    const endDate = new Date(challenge.endTime).getTime();

    if (now < startDate || now > endDate) {
      console.log("Challenge not active, skipping");
      continue;
    }

    const lastUpdated = challenge.lastUpdated || startDate;

    // Fetch the step count for this user since the last update
    const stepCount = await fetchStepCount(challenge.userId, lastUpdated, now);
    console.log("Step count:", stepCount);
    if (stepCount !== null) {
      // Update the blockchain with the new step count
      const result = await updateUserStepCount(
        program,
        challengeId,
        challenge.userId,
        stepCount
      );

      if (result.success) {
        console.log("Updated step count on blockchain");
        // Update the last updated timestamp
        challenge.lastUpdated = now;
        challengeData.set(challengeId, challenge);
      }
    }
  }
}

// Start scheduled job to process challenges every hour
export function startScheduledJob(program: Program<AaasContract>) {
  // Process immediately on startup
  processAllChallenges(program);

  // Then schedule to run every hour
  setInterval(() => {
    processAllChallenges(program);
  }, 60 * 60 * 1000); // 1 hour
}
