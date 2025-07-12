use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

pub use instructions::*;
pub use states::*;

declare_id!("3hVGVR6onYRsf3UHajMMcLgZ5EGowqUMbJqYkqtiArFY");

#[program]
pub mod aaas_contract {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)?;
        Ok(())
    }

    // this will be called by the owner of the contract
    pub fn initialize_challenge(
        context: Context<InitializeChallenge>,
        challenge_id: u64,
        challenge_type: ChallengeType,
        challenge_name: String,
        challenge_description: String,
        start_time: i64,
        end_time: i64,
        money_per_participant: u64,
        is_private: bool,
        private_group: Vec<Pubkey>,
    ) -> Result<()> {
        context.accounts.initialize_challenge(
            challenge_id,
            challenge_type,
            challenge_name,
            challenge_description,
            start_time,
            end_time,
            money_per_participant,
            is_private,
            private_group,
            &context.bumps,
        )?;
        Ok(())
    }

    pub fn join_challenge(
        context: Context<JoinChallenge>,
        challenge_id: u64,
        user_name: String,
        description: String,
    ) -> Result<()> {
        context
            .accounts
            .join_challenge(challenge_id, user_name, description, &context.bumps)?;
        Ok(())
    }

    pub fn claim_challenge(context: Context<ClaimChallenge>, challenge_id: u64) -> Result<()> {
        context.accounts.claim_challenge(challenge_id)?;
        Ok(())
    }

    // this will be called by off-chain verification service
    pub fn update_challenge_status(
        context: Context<UpdateChallengeStatus>,
        challenge_id: u64,
        user_address: Pubkey,
        challenge_verification: ChallengeVerification,
    ) -> Result<()> {
        context.accounts.update_challenge_status(
            challenge_id,
            user_address,
            challenge_verification,
        )?;
        Ok(())
    }

    // this will be called by the community members
    pub fn vote_for_vote_based_challenge(
        context: Context<VoteForVoteBasedChallenge>,
        challenge_id: u64,
        user_address: Pubkey,
        challenge_verification: ChallengeVerificationType,
    ) -> Result<()> {
        context.accounts.vote_for_vote_based_challenge(
            challenge_id,
            user_address,
            challenge_verification,
            &context.bumps,
        )?;

        Ok(())
    }
}
