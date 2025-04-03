import express from "express";
import cors from "cors";
import nacl from "tweetnacl";
import { Request, Response, NextFunction } from "express";
import { BN, Program } from "@coral-xyz/anchor";
import idl from "../idl.json";
import type { AaasContract } from "./aaas-contract";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import * as googleFitService from "./googleFitService";

dotenv.config();
const app = express();

app.use(cors());

app.use(express.json());

// this should be replaced with some 100xdevs coin
export const MINT_OF_TOKEN_FOR_REWARD =
  "HPuw5bXXxUj8akYkscffhM92gSu9sV7Z5PDJJmPzeNEa";

const keypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.SECRET_KEY as string))
);

const connection = new Connection("https://api.devnet.solana.com");

const program = new Program<AaasContract>(idl, {
  connection: connection,
});

// Interface for the request body with signature verification data
interface SignedRequest {
  message: string;
  signature: string;
  publicKey: string;
}

// Routes that don't require signature verification
const unsecuredRoutes = ["/api/google-fit/auth", "/health"];

// Modified signature verification middleware to exclude certain routes
const verifySignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip verification for unsecured routes
  if (unsecuredRoutes.includes(req.path)) {
    return next();
  }

  try {
    console.log("req.body", req.body);
    const { message, signature, publicKey } = req.body;

    if (!message || !signature || !publicKey) {
      res
        .status(400)
        .json({ error: "Message, signature, and publicKey are required" });
      return;
    }

    // Decode the base64 encoded message, signature and public key
    const decodedMessage = new TextEncoder().encode(message);
    // Parse the comma-separated signature string into a Uint8Array
    const decodedSignature = signature.includes(",")
      ? new Uint8Array(
          signature.split(",").map((num: string) => parseInt(num.trim(), 10))
        )
      : new TextEncoder().encode(signature);
    const decodedPublicKey = new PublicKey(publicKey).toBytes();

    // Verify that the message was signed by the owner of the publicKey
    const isValid = nacl.sign.detached.verify(
      decodedMessage,
      decodedSignature,
      decodedPublicKey
    );

    if (!isValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Signature is valid, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Signature verification error:", error);
    res.status(500).json({ error: "Failed to verify signature" });
    return;
  }
};

app.use(verifySignature);

// async function signAndSendTransaction(instruction: TransactionInstruction) {
//   try {
//     // Get recent blockhash
//     const { blockhash, lastValidBlockHeight } =
//       await connection.getLatestBlockhash();

//     const transaction = new Transaction().add(instruction);
//     transaction.recentBlockhash = blockhash;
//     transaction.feePayer = keypair.publicKey;

//     // Send transaction
//     const signature = await connection.sendTransaction(transaction, [keypair]);
//     console.log("Signature:", signature);

//     // Confirm transaction
//     await connection.confirmTransaction({
//       blockhash,
//       lastValidBlockHeight,
//       signature,
//     });

//     return signature;
//   } catch (error) {
//     console.error("Error signing and sending transaction:", error);
//     throw error;
//   }
// }

function getChallengeAccountPDA(challengeId: number) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("challenge_account"),
      new BN(challengeId).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
}

// 10 Lamports of JKCOIN per challenge vote
async function transferJKCOIN(to: PublicKey, amount: number) {
  try {
    const voterATA = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      new PublicKey(MINT_OF_TOKEN_FOR_REWARD),
      keypair.publicKey
    );
    console.log("voterATA", voterATA);
    await mintTo(
      connection,
      keypair,
      new PublicKey(MINT_OF_TOKEN_FOR_REWARD),
      voterATA.address,
      keypair.publicKey,
      amount
    );
    console.log("transferJKCOIN");
  } catch (error) {
    console.error("Error transferring JKCOIN:", error);
    throw error;
  }
}

// claim the tokens
app.post("/vote-claim", async (req: Request, res: Response) => {
  const { challengeId, publicKey } = req.body;
  const challengeAccountPDA = getChallengeAccountPDA(challengeId);
  try {
    console.log("challengeAccountPDA", challengeAccountPDA);
    const challengeAccount = await program.account.challengeAccount.fetch(
      challengeAccountPDA[0]
    );
    if (challengeAccount) {
      // check if the challenge is over
      if (challengeAccount.endTime >= new Date()) {
        res.json({
          message: "Challenge is not over",
        });
        return;
      }
      console.log("challengeAccountPDA", challengeAccountPDA[0]);
      console.log(
        "participants",
        await program.account.userChallengeAccount.all()
      );
      // check if the voter has voted everyone except himself
      // for this get all the participants
      const participants = (
        await program.account.userChallengeAccount.all()
      ).filter(
        (participant) =>
          participant.account.challengeAddress.toString() ==
          challengeAccountPDA[0].toString()
      );
      // now check if there exists voteAccount corresponding to the participant
      const correspondingVoteAccount = (
        await program.account.voteAccount.all()
      ).filter((voteAccount) => {
        return (
          participants.some(
            (participant) =>
              participant.account.userAddress.toString() ==
              voteAccount.account.userAddress.toString()
          ) &&
          challengeAccountPDA[0].toString() ==
            voteAccount.account.challengeAddress.toString() &&
          publicKey == voteAccount.account.voterAddress.toString()
        );
      });

      console.log("correspondingVoteAccount", correspondingVoteAccount);
      console.log("participants", participants);

      // check if the voter has voted everyone except himself and other case that he has not participated in the challenge
      if (
        correspondingVoteAccount.length == participants.length - 1 &&
        participants.length != 1
      ) {
        // now check if the voter has voted everyone except himself
        const voter = participants.find(
          (participant) => participant.account.userAddress == keypair.publicKey
        );
        console.log("voter", voter);
        if (voter) {
          console.log("voter", voter);
          // valid case
          await transferJKCOIN(voter.account.userAddress, 10);
          console.log("Vote claimed successfully");
          res.json({
            message: "Vote claimed successfully",
          });
          return;
        }
      } else if (
        correspondingVoteAccount.length == participants.length &&
        participants.length != 0
      ) {
        // valid case
        console.log("voting");
        await transferJKCOIN(new PublicKey(publicKey), 10);
        res.json({
          message: "Vote claimed successfully",
        });
        return;
      }
    }
    console.log("challengeAccount", challengeAccount);
    res.json({
      message: "Unauthorized to claim vote",
    });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

app.get("/health", (req, res) => {
  res.send("ok");
});

// Google Fit API routes
// Exchange auth code for tokens
app.post("/api/google-fit/auth", async (req, res) => {
  try {
    const { access_token, refresh_token, user_id, expires_in } = req.body;
    console.log("Received request body:", req.body);
    if (!access_token || !refresh_token || !user_id || !expires_in) {
      res
        .status(400)
        .json({ error: "Authorization code and user ID are required" });
      return;
    }

    const result = await googleFitService.exchangeAuthCodeForTokens(
      access_token,
      refresh_token,
      user_id,
      expires_in
    );

    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Error in Google Fit auth endpoint:", error);
    res
      .status(500)
      .json({ error: "Failed to process Google Fit authorization" });
  }
});

// Register a challenge for step tracking
app.post("/api/google-fit/register-challenge", async (req, res) => {
  try {
    const { challenge_id, user_id, steps_per_day, start_time, end_time } =
      req.body;

    if (
      !challenge_id ||
      !user_id ||
      !steps_per_day ||
      !start_time ||
      !end_time
    ) {
      res.status(400).json({ error: "All challenge parameters are required" });
      return;
    }

    const result = googleFitService.registerChallenge({
      challengeId: challenge_id,
      userId: user_id,
      stepsPerDay: steps_per_day,
      startTime: start_time,
      endTime: end_time,
    });

    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Error registering challenge for step tracking:", error);
    res
      .status(500)
      .json({ error: "Failed to register challenge for step tracking" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");

  // Start the scheduled job to process all Google Fit challenges
  googleFitService.startScheduledJob(program);
});
