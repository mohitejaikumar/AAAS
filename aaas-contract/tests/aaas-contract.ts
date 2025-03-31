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
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Transfer some SOL to users for account creation
    const transferTx1 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: user1.publicKey,
        lamports: 20*LAMPORTS_PER_SOL,
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
        lamports: 20*LAMPORTS_PER_SOL,
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
      20*LAMPORTS_PER_SOL // 2 tokens
    );
    
    await mintTo(
      provider.connection,
      payer,
      mint,
      user2Ata,
      payer.publicKey,
      20*LAMPORTS_PER_SOL // 2 tokens
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
        "Lets fit",
        "do run 10000 steps",
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
        "Jaikumar Mohite",
        "I will try my best"
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
        "Lets complete my homework",
        "I will do homework for 10 hours",
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

  // Add test for private challenge initialization and joining
  it("Initialize and join a private challenge", async () => {
    // Initialize a private challenge
    const privateGroupChallengeId = new BN(4);
    
    // Define private group with only user1 allowed
    const privateGroup = [user1.publicKey];
    
    // Initialize the private challenge
    const initTx = await program.methods
      .initializeChallenge(
        privateGroupChallengeId,
        { voteBased: {} },
        "Lets complete my homework",
        "I will do homework for 10 hours",
        startTime,
        endTime,
        moneyPerParticipant,
        true, // private challenge
        privateGroup // only user1 is allowed
      )
      .accounts({
        signer: payer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
    
    console.log("Initialize private challenge tx signature", initTx);
    
    // Derive private challenge PDAs
    const [privateChallenge] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_account"), privateGroupChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const [privateTreasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury_account"), privateGroupChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const [user1PrivateChallengeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_challenge_account"), user1.publicKey.toBytes(), privateChallenge.toBytes()],
      program.programId
    );
    
    // Fetch the challenge account and verify its data
    const privateData = await program.account.challengeAccount.fetch(privateChallenge);
    assert.equal(privateData.isPrivate, true);
    assert.deepEqual(privateData.privateGroup[0].toBase58(), user1.publicKey.toBase58());
    
    // User1 joins the private challenge (should succeed)
    const joinTx = await program.methods
      .joinChallenge(
        privateGroupChallengeId,
        "User One",
        "I will try my best"
      )
      .accounts({
        signer: user1.publicKey,
    
        mint,
        treasuryAccount: privateTreasury,
       
        tokenProgram: TOKEN_PROGRAM_ID,
       
      })
      .signers([user1])
      .rpc();
    
    console.log("Join private challenge tx signature", joinTx);
    
    // User2 tries to join the private challenge (should fail)
    try {
      await program.methods
        .joinChallenge(
          privateGroupChallengeId,
          "User Two",
          "I will try my best"
        )
        .accounts({
          signer: user2.publicKey,
   
          mint,
          treasuryAccount: privateTreasury,
     
          tokenProgram: TOKEN_PROGRAM_ID,
         
        })
        .signers([user2])
        .rpc();
      
      assert.fail("Should have failed because user2 is not in the private group");
    } catch (error) {
      assert.include(error.message, "UnAuthorized");
    }
  });

  // Test multiple users interacting with a challenge
  it("Multiple users joining a challenge", async () => {
    // Initialize a new challenge for multiple users
    const multiUserChallengeId = new BN(5);
    
    await program.methods
      .initializeChallenge(
        multiUserChallengeId,
        { googleFit: { steps: new BN(7500) } },
        "Lets fit",
        "do run 7500 steps",
        startTime,
        endTime,
        moneyPerParticipant,
        false, // not private
        [] // no private group
      )
      .accounts({
        signer: payer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
    
    // Derive multi-user challenge PDAs
    const [multiChallenge] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_account"), multiUserChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const [multiTreasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury_account"), multiUserChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    // User1 joins the multi-user challenge
    await program.methods
      .joinChallenge(
        multiUserChallengeId,
        "User One",
        "I will try my best"
      )
      .accounts({
        signer: user1.publicKey,
       
        mint,
        treasuryAccount: multiTreasury,
        
        tokenProgram: TOKEN_PROGRAM_ID,
     
      })
      .signers([user1])
      .rpc();
    
    // User2 joins the multi-user challenge
    await program.methods
      .joinChallenge(
        multiUserChallengeId,
        "User Two",
        "I will try my best"
      )
      .accounts({
        signer: user2.publicKey,
        
        mint,
        treasuryAccount: multiTreasury,
        
        tokenProgram: TOKEN_PROGRAM_ID,
        
      })
      .signers([user2])
      .rpc();
    
    // Verify the challenge has 2 participants and correct money pool
    const challengeData = await program.account.challengeAccount.fetch(multiChallenge);
    assert.equal(challengeData.totalParticipants.toString(), "2");
    assert.equal(challengeData.moneyPool.toString(), (moneyPerParticipant.toNumber() * 2).toString());
  });

  // Test vote-based challenge with multiple voters
  it("Vote-based challenge with multiple votes", async () => {
    // Create a more robust vote-based challenge test
    const voteBasedChallengeId = new BN(6);
    
    // Initialize the vote-based challenge
    await program.methods
      .initializeChallenge(
        voteBasedChallengeId,
        { voteBased: {} },
        "Read book",
        "I will read book for 2 hours",
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
    
    // Derive vote-based challenge PDAs
    const [voteChallenge] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_account"), voteBasedChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const [voteTreasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury_account"), voteBasedChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const [user1VoteChallengeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_challenge_account"), user1.publicKey.toBytes(), voteChallenge.toBytes()],
      program.programId
    );
    
    const [user2VoteChallengeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_challenge_account"), user2.publicKey.toBytes(), voteChallenge.toBytes()],
      program.programId
    );
    
    // The vote account that user2 will create for user1
    const [voteAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote_account"), voteChallenge.toBytes(), user1.publicKey.toBytes()],
      program.programId
    );
    
    // Both users join the vote-based challenge
    // User1 joins
    await program.methods
      .joinChallenge(
        voteBasedChallengeId,
        "Vote User One",
        "I will try my best"
      )
      .accounts({
        signer: user1.publicKey,
      
        mint,
        treasuryAccount: voteTreasury,
        
        tokenProgram: TOKEN_PROGRAM_ID,
        
      })
      .signers([user1])
      .rpc();
    
    // User2 joins
    await program.methods
      .joinChallenge(
        voteBasedChallengeId,
        "Vote User Two",
        "I will try my best"
      )
      .accounts({
        signer: user2.publicKey,
        mint,
        treasuryAccount: voteTreasury,
        tokenProgram: TOKEN_PROGRAM_ID,
        
      })
      .signers([user2])
      .rpc();
    
    // Test that user can't vote for themselves
    try {
      await program.methods
        .voteForVoteBasedChallenge(
          voteBasedChallengeId,
          user1.publicKey,
          { voteBased: { isCompleted: true } }
        )
        .accounts({
          signer: user1.publicKey,

        })
        .signers([user1])
        .rpc();
      
      assert.fail("Should have failed because user is voting for themselves");
    } catch (error) {
      assert.include(error.message, "VoterIsVotingForHimself");
    }
    
    // Test challenge timing validation with manual clock manipulation
    // This test would simulate time passing if we could manipulate the onchain clock
    // Since we can't easily do that in a test, we'll just verify the error conditions
    
    // Test that user can't update challenge status before it's ended
    try {
      await program.methods
        .updateChallengeStatus(
          voteBasedChallengeId,
          user1.publicKey,
          {
            challengeType: {
              monitored: {
                score: new BN(8000),
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

  // Test for attempting to initialize a challenge with invalid parameters
  it("Challenge initialization with invalid parameters", async () => {
    // Test initialization with start time in the past
    const pastStartTime = new BN(Math.floor(Date.now() / 1000) - 60); // 60 seconds ago
    const futureEndTime = new BN(Math.floor(Date.now() / 1000) + 300); // 5 minutes in the future
    const invalidChallengeId = new BN(7);
    
    try {
      await program.methods
        .initializeChallenge(
          invalidChallengeId,
          { googleFit: { steps: new BN(10000) } },
          "Lets fit",
          "do run 10000 steps",
          pastStartTime,
          futureEndTime,
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
      
      assert.fail("Should have failed due to start time in the past");
    } catch (error) {
      assert.include(error.message, "StartTimeInThePast");
    }
    
    // Test initialization with end time before start time
    const futureStartTime = new BN(Math.floor(Date.now() / 1000) + 300); // 5 minutes in the future
    const earlierEndTime = new BN(Math.floor(Date.now() / 1000) + 60); // 1 minute in the future
    
    try {
      await program.methods
        .initializeChallenge(
          invalidChallengeId,
          { googleFit: { steps: new BN(10000) } },
          "Lets fit",
          "do run 10000 steps",
          futureStartTime,
          earlierEndTime,
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
      
      assert.fail("Should have failed due to end time before start time");
    } catch (error) {
      assert.include(error.message, "EndTimeBeforeStartTime");
    }
    
    // Test initialization of private challenge with empty private group
    try {
      await program.methods
        .initializeChallenge(
          invalidChallengeId,
          { googleFit: { steps: new BN(10000) } },
          "Lets fit",
          "do run 10000 steps",
          startTime,
          endTime,
          moneyPerParticipant,
          true, // private
          [] // empty private group
        )
        .accounts({
          signer: payer.publicKey,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();
      
      assert.fail("Should have failed due to empty private group for a private challenge");
    } catch (error) {
      assert.include(error.message, "PrivateGroupEmpty");
    }
  });

  // Test double joining a challenge
  it("User cannot join the same challenge twice", async () => {
    // Initialize a new challenge
    const doubleJoinChallengeId = new BN(8);
    
    await program.methods
      .initializeChallenge(
        doubleJoinChallengeId,
        { googleFit: { steps: new BN(5000) } },
        "Lets fit",
        "do run 5000 steps",
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
    
    // Derive challenge PDAs
    const [doubleJoinChallenge] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_account"), doubleJoinChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const [doubleJoinTreasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury_account"), doubleJoinChallengeId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    // User1 joins the challenge
    await program.methods
      .joinChallenge(
        doubleJoinChallengeId,
        "User One",
        "I will try my best"
      )
      .accounts({
        signer: user1.publicKey,
        mint,
        treasuryAccount: doubleJoinTreasury,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();
    
    // User1 tries to join again (should fail)
    try {
      await program.methods
        .joinChallenge(
          doubleJoinChallengeId,
          "User One Again",
          "I will try my best"
        )
        .accounts({
          signer: user1.publicKey,
          
          mint,
          treasuryAccount: doubleJoinTreasury,
          
          tokenProgram: TOKEN_PROGRAM_ID,
          
        })
        .signers([user1])
        .rpc();
      
      assert.fail("Should have failed because user already joined the challenge");
    } catch (error) {
      assert.include(error.message, "AlreadyJoined");
    }
  });
});
