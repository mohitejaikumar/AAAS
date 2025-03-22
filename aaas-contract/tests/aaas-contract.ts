import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AaasContract } from "../target/types/aaas_contract";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";
import { BN } from "bn.js";

describe("aaas-contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.AaasContract as Program<AaasContract>;

  // owner of the contract
  const owner = provider.wallet;
  
  // Test accounts
  const payer = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  
  // Challenge parameters
  const challengeId = new BN(1);
  const startTime = new BN(Math.floor(Date.now() / 1000) + 60); // 60 seconds in the future
  const endTime = new BN(Math.floor(Date.now() / 1000) + 300); // 5 minutes in the future
  const moneyPerParticipant = new BN(1000000000); // 1 token with 9 decimals
  
  // Token accounts
  let mint: PublicKey;
  let payerAta: PublicKey;
  let user1Ata: PublicKey;
  let user2Ata: PublicKey;
  
  // PDAs
  let challengeAccount: PublicKey;
  let challengeBump: number;
  let treasuryAccount: PublicKey;
  let treasuryBump: number;
  let user1Account: PublicKey;
  let user1AccountBump: number;
  let user2Account: PublicKey;
  let user2AccountBump: number;
  let user1ChallengeAccount: PublicKey;
  let user1ChallengeBump: number;
  let user2ChallengeAccount: PublicKey;
  let user2ChallengeBump: number;
  
  before(async () => {
    // Airdrop SOL to the payer
    const airdropSignature = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Transfer some SOL to users for account creation
    const transferTx1 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: user1.publicKey,
        lamports: 2*LAMPORTS_PER_SOL,
      })
    );
    
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    transferTx1.recentBlockhash = latestBlockhash.blockhash;
    transferTx1.feePayer = payer.publicKey;
    
    const txSignature1 = await provider.connection.sendTransaction(transferTx1, [payer]);
    await provider.connection.confirmTransaction(txSignature1);
    
    const transferTx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: user2.publicKey,
        lamports: 2*LAMPORTS_PER_SOL,
      })
    );
    
    transferTx2.recentBlockhash = latestBlockhash.blockhash;
    transferTx2.feePayer = payer.publicKey;
    
    const txSignature2 = await provider.connection.sendTransaction(transferTx2, [payer]);
    await provider.connection.confirmTransaction(txSignature2);
    
    // Create a new token mint
    mint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      9
    );
    
    // Create token accounts for each user
    payerAta = await createAccount(
      provider.connection,
      payer,
      mint,
      payer.publicKey
    );
    
    user1Ata = await createAccount(
      provider.connection,
      user1,
      mint,
      user1.publicKey
    );
    
    user2Ata = await createAccount(
      provider.connection,
      user2,
      mint,
      user2.publicKey
    );
    
    // Mint tokens to user accounts
    await mintTo(
      provider.connection,
      payer,
      mint,
      user1Ata,
      payer.publicKey,
      2*LAMPORTS_PER_SOL // 2 tokens
    );
    
    await mintTo(
      provider.connection,
      payer,
      mint,
      user2Ata,
      payer.publicKey,
      2*LAMPORTS_PER_SOL // 2 tokens
    );
    
    // Derive PDAs
    [challengeAccount, challengeBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_account"), challengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    [treasuryAccount, treasuryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury_account"), challengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    [user1Account, user1AccountBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_account"), user1.publicKey.toBytes()],
      program.programId
    );
    
    [user2Account, user2AccountBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_account"), user2.publicKey.toBytes()],
      program.programId
    );
    
    [user1ChallengeAccount, user1ChallengeBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_challenge_account"), user1.publicKey.toBytes(), challengeAccount.toBytes()],
      program.programId
    );
    
    [user2ChallengeAccount, user2ChallengeBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_challenge_account"), user2.publicKey.toBytes(), challengeAccount.toBytes()],
      program.programId
    );
  });
  
  it("Initialize the contract", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        signer: owner.publicKey,
      })
      .rpc();
    
    console.log("Initialize contract transaction signature", tx);
  });
  
  it("Initialize a challenge", async () => {
    // Initialize a GoogleFit steps challenge
    const tx = await program.methods
      .initializeChallenge(
        challengeId,
        { googleFit: { steps: new BN(10000) } },
        startTime,
        endTime,
        moneyPerParticipant,
        false, // not private
        [] // no private group
      )
      .accounts({
        signer: payer.publicKey,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
    
    console.log("Initialize challenge transaction signature", tx);
    
    // Fetch the challenge account and verify its data
    const challengeData = await program.account.challengeAccount.fetch(challengeAccount);
    assert.equal(challengeData.challengeId.toString(), challengeId.toString());
    assert.equal(challengeData.startTime.toString(), startTime.toString());
    assert.equal(challengeData.endTime.toString(), endTime.toString());
    assert.equal(challengeData.moneyPerParticipant.toString(), moneyPerParticipant.toString());
    assert.equal(challengeData.totalParticipants.toString(), "0");
    assert.equal(challengeData.moneyPool.toString(), "0");
    assert.equal(challengeData.isPrivate, false);
  });

  it("Join a challenge", async () => {
    // User1 joins the challenge
    const tx = await program.methods
      .joinChallenge(
        challengeId,
        "Jaikumar Mohite"
      )
      .accounts({
        signer: user1.publicKey,
        mint,
        treasuryAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();
    
    console.log("Join challenge transaction signature", tx);
    
    // Fetch the challenge account and verify the updated data
    const challengeData = await program.account.challengeAccount.fetch(challengeAccount);
    assert.equal(challengeData.totalParticipants.toString(), "1");
    assert.equal(challengeData.moneyPool.toString(), moneyPerParticipant.toString());
    
    // Fetch the user account and verify its data
    const userData = await program.account.userAccount.fetch(user1Account);
    assert.equal(userData.userName, "Jaikumar Mohite");
    assert.equal(userData.totalParticipations.toString(), "1");
    assert.equal(userData.totalMoneyDeposited.toString(), moneyPerParticipant.toString());
    
    // Fetch the user challenge account and verify its data
    const userChallengeData = await program.account.userChallengeAccount.fetch(user1ChallengeAccount);
    assert.equal(userChallengeData.isJoined, true);
    assert.equal(userChallengeData.moneyDeposited.toString(), moneyPerParticipant.toString());
    assert.equal(userChallengeData.isChallengeCompleted, false);
  });

  it("Update challenge status for user", async () => {
    try {
      await program.methods
        .updateChallengeStatus(
          challengeId,
          user1.publicKey,
          {
            challengeType: {
              monitored: {
                score: new BN(12000),
                isCompleted: true
              }
            }
          }
        )
        .accounts({
          signer: owner.publicKey,
          
        })
        .rpc();
      
      assert.fail("Should have failed because challenge is not ended yet");
    } catch (error) {
      assert.include(error.message, "ChallengeNotEnded");
    }
  });

  it("Vote for a vote-based challenge", async () => {
    // Initialize a vote-based challenge
    const voteBasedChallengeId = new BN(3);
    
    // Initialize the vote-based challenge
    await program.methods
      .initializeChallenge(
        voteBasedChallengeId,
        { voteBased: {} },
        startTime,
        endTime,
        moneyPerParticipant,
        false,
        []
      )
      .accounts({
        signer: payer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
    
    // This test would require advancing the clock
    // Instead of testing complete flow, we'll test the error
    try {
      
      await program.methods
        .voteForVoteBasedChallenge(
          voteBasedChallengeId,
          user1.publicKey,
          { voteBased: { isCompleted: true } }
        )
        .accounts({
          signer: user2.publicKey,
        })
        .signers([user2])
        .rpc();
      
      assert.fail("Should have failed because user did not participate");
    } catch (error) {
      assert.include(error.message, "AccountNotInitialized");
    }
  });

  it("Claim challenge rewards", async () => {
    // This would require advancing the clock past end_time + 30 minutes
    // Instead of testing complete flow, we'll test the error
    try {
      await program.methods
        .claimChallenge(challengeId)
        .accounts({
          signer: user1.publicKey,
          mint,
          treasuryAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
      
      assert.fail("Should have failed because challenge is under verification");
    } catch (error) {
      assert.include(error.message, "ChallengeUnderVerification");
    }
  });
});
