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
pub struct ClaimChallenge<'info> {
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
        mut,
        seeds = [b"user_account".as_ref(), signer.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(
        mut,
        seeds = [b"user_challenge_account".as_ref(), signer.key().as_ref(), challenge_account.key().as_ref()],
        bump = user_challenge_account.bump
    )]
    pub user_challenge_account: Account<'info, UserChallengeAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> ClaimChallenge<'info> {
    pub fn claim_challenge(&mut self, _challenge_id: u64) -> Result<()> {
        let challenge_account = &mut self.challenge_account;
        let user_account = &mut self.user_account;
        let user_challenge_account = &mut self.user_challenge_account;
        let treasury_account = &mut self.treasury_account;
        // check if the user did participated in the challenge
        if !user_challenge_account.is_joined {
            return Err(ErrorCode::UserDidNotParticipate.into());
        }
        // already claimed
        if user_challenge_account.money_deposited == 0 {
            return Err(ErrorCode::AlreadyClaimed.into());
        }
        // check if the challenge is under verification_duration 30min
        let current_time = Clock::get()?.unix_timestamp;
        if challenge_account.end_time + 30 * 60 > current_time {
            return Err(ErrorCode::ChallengeUnderVerification.into());
        }
        // check if the user has completed the challenge
        if !user_challenge_account.is_challenge_completed
            && user_challenge_account.vote_in_positive < user_challenge_account.vote_in_negative
        {
            return Err(ErrorCode::UserHasNotCompletedTheChallenge.into());
        }

        // refund the money from the treasury account to the user account
        let transfer_accounts_option = TransferChecked {
            from: treasury_account.to_account_info(),
            to: self.user_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.treasury_account.to_account_info(),
        };

        let signers_seeds: &[&[&[u8]]] = &[&[
            b"treasury_account",
            &challenge_account.challenge_id.to_le_bytes(),
            &[challenge_account.treasury_bump],
        ]];

        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            transfer_accounts_option,
        )
        .with_signer(signers_seeds);

        let amount_to_refund = user_challenge_account.money_deposited.clone();
        transfer_checked(cpi_ctx, amount_to_refund, self.mint.decimals)?;

        // update the user account
        user_account.total_money_withdrawn += user_challenge_account.money_deposited;
        // update the user challenge account
        user_challenge_account.money_deposited = 0;

        Ok(())
    }
}
