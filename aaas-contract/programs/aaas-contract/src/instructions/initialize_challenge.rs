use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    errors::ErrorCode,
    states::{ChallengeAccount, ChallengeInformation, ChallengeType},
};

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct InitializeChallenge<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + ChallengeAccount::INIT_SPACE,
        seeds = [b"challenge_account".as_ref(), challenge_id.to_le_bytes().as_ref()],
        bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = signer,
        token::mint = mint,
        token::authority = treasury_account,
        seeds = [b"treasury_account".as_ref(), challenge_id.to_le_bytes().as_ref()],
        bump
    )]
    pub treasury_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> InitializeChallenge<'info> {
    pub fn initialize_challenge(
        &mut self,
        challenge_id: u64,
        challenge_type: ChallengeType,
        challenge_name: String,
        challenge_description: String,
        start_time: i64,
        end_time: i64,
        money_per_participant: u64,
        is_private: bool,
        private_group: Vec<Pubkey>,
        bumps: &InitializeChallengeBumps,
    ) -> Result<()> {
        // check if the challenge is private and the private group is empty
        if is_private && private_group.is_empty() {
            return Err(ErrorCode::PrivateGroupEmpty.into());
        }
        // check start time is in the future
        let current_time = Clock::get()?.unix_timestamp;
        if start_time <= current_time {
            return Err(ErrorCode::StartTimeInThePast.into());
        }
        // check end time is more than start time
        if end_time <= start_time {
            return Err(ErrorCode::EndTimeBeforeStartTime.into());
        }

        let challenge_account = &mut self.challenge_account;
        challenge_account.challenge_id = challenge_id;
        challenge_account.challenge_information = ChallengeInformation {
            challenge_type,
            challenge_name,
            challenge_description,
        };
        challenge_account.start_time = start_time;
        challenge_account.end_time = end_time;
        challenge_account.total_participants = 0;
        challenge_account.money_pool = 0;
        challenge_account.money_per_participant = money_per_participant;
        challenge_account.treasury_account = self.treasury_account.key();
        challenge_account.is_private = is_private;
        challenge_account.private_group = private_group;
        challenge_account.bump = bumps.challenge_account;
        challenge_account.treasury_bump = bumps.treasury_account;

        Ok(())
    }
}
