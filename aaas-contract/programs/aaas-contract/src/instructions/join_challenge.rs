use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{
    errors::ErrorCode,
    states::{ChallengeAccount, UserAccount, UserChallengeAccount},
};

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct JoinChallenge<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge_account".as_ref(), challenge_id.to_le_bytes().as_ref()],
        bump = challenge_account.bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub treasury_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user_account".as_ref(), signer.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + UserChallengeAccount::INIT_SPACE,
        seeds = [b"user_challenge_account".as_ref(), signer.key().as_ref(), challenge_account.key().as_ref()],
        bump
    )]
    pub user_challenge_account: Account<'info, UserChallengeAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> JoinChallenge<'info> {
    pub fn join_challenge(
        &mut self,
        _challenge_id: u64,
        user_name: String,
        description: String,
        bumps: &JoinChallengeBumps,
    ) -> Result<()> {
        let challenge_account = &mut self.challenge_account;
        let user_account = &mut self.user_account;
        let user_challenge_account = &mut self.user_challenge_account;
        let treasury_account = &mut self.treasury_account;

        // check if the challenge is private and the user is in the private group
        if challenge_account.is_private {
            if !challenge_account.private_group.contains(&self.signer.key()) {
                return Err(ErrorCode::UnAuthorized.into());
            }
        }

        // check if the user has already joined the challenge
        if user_challenge_account.is_joined {
            return Err(ErrorCode::AlreadyJoined.into());
        }

        // check if the challenge has started
        let current_time = Clock::get()?.unix_timestamp;
        if challenge_account.start_time <= current_time {
            return Err(ErrorCode::ChallengeStarted.into());
        }

        // transfer the money from the user to treasury account
        let transfer_accounts_option = TransferChecked {
            from: self.user_token_account.to_account_info(),
            to: treasury_account.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.signer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            transfer_accounts_option,
        );
        transfer_checked(
            cpi_ctx,
            challenge_account.money_per_participant,
            self.mint.decimals,
        )?;

        // update the user challenge account
        user_challenge_account.is_joined = true;
        user_challenge_account.money_deposited = challenge_account.money_per_participant;
        user_challenge_account.challenge_address = challenge_account.key();
        user_challenge_account.user_address = self.signer.key();
        user_challenge_account.is_challenge_completed = false;
        user_challenge_account.bump = bumps.user_challenge_account;
        user_challenge_account.description = description;

        // update the user account
        user_account.user_name = user_name;
        user_account.total_participations += 1;
        user_account.total_money_deposited += challenge_account.money_per_participant;
        user_account.bump = bumps.user_account;

        // update the challenge account
        challenge_account.total_participants += 1;
        challenge_account.money_pool += challenge_account.money_per_participant;

        Ok(())
    }
}
