use anchor_lang::prelude::*;

use crate::{
    errors::ErrorCode,
    states::{
        ChallengeAccount, ChallengeType, ChallengeVerification, ChallengeVerificationType,
        ProgramState, UserChallengeAccount,
    },
};

#[derive(Accounts)]
#[instruction(challenge_id: u64, user_address: Pubkey)]
pub struct UpdateChallengeStatus<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        seeds = [b"program_owner".as_ref()],
        bump = state.bump
    )]
    pub state: Account<'info, ProgramState>,
    #[account(
        mut,
        seeds = [b"challenge_account".as_ref(), challenge_id.to_le_bytes().as_ref()],
        bump = challenge_account.bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>,
    #[account(
        mut,
        seeds = [b"user_challenge_account".as_ref(), user_address.as_ref(), challenge_account.key().as_ref()],
        bump = user_challenge_account.bump
    )]
    pub user_challenge_account: Account<'info, UserChallengeAccount>,
}

impl<'info> UpdateChallengeStatus<'info> {
    pub fn update_challenge_status(
        &mut self,
        _challenge_id: u64,
        _user_address: Pubkey,
        challenge_verification: ChallengeVerification,
    ) -> Result<()> {
        let state = &mut self.state;
        require_keys_eq!(self.signer.key(), state.owner, ErrorCode::UnAuthorizedOwner);

        let challenge_account = &mut self.challenge_account;
        let user_challenge_account = &mut self.user_challenge_account;

        // Check if the user has participated in the challenge
        if !user_challenge_account.is_joined {
            return Err(ErrorCode::UserDidNotParticipate.into());
        }
        // check if the challenge is ended or not
        let current_time = Clock::get()?.unix_timestamp;
        if challenge_account.end_time > current_time {
            return Err(ErrorCode::ChallengeNotEnded.into());
        }

        // Check if the challenge is within the time_end + 30 minutes
        if challenge_account.end_time + 30 * 60 < current_time {
            return Err(ErrorCode::ChallengeVerificationTimeEnded.into());
        }

        // check the verification type and challenge type
        match (
            &challenge_account.challenge_information.challenge_type,
            &challenge_verification.challenge_type,
        ) {
            (
                ChallengeType::GoogleFit { steps: _ },
                ChallengeVerificationType::Monitored {
                    score,
                    is_completed,
                },
            ) => {
                if *is_completed {
                    user_challenge_account.is_challenge_completed = true;
                    user_challenge_account.score = *score;
                }
            }
            _ => return Err(ErrorCode::InvalidVerificationType.into()),
        }

        Ok(())
    }
}
