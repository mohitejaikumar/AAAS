use anchor_lang::prelude::*;

use crate::{
    errors::ErrorCode,
    states::{
        ChallengeAccount, ChallengeType, ChallengeVerificationType, UserChallengeAccount,
        VoteAccount,
    },
};

#[derive(Accounts)]
#[instruction(challenge_id: u64, user_address: Pubkey)]
pub struct VoteForVoteBasedChallenge<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
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
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + VoteAccount::INIT_SPACE,
        seeds = [b"vote_account".as_ref(), challenge_account.key().as_ref(), signer.key().as_ref(), user_address.as_ref()],
        bump
    )]
    pub vote_account: Account<'info, VoteAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> VoteForVoteBasedChallenge<'info> {
    pub fn vote_for_vote_based_challenge(
        &mut self,
        _challenge_id: u64,
        _user_address: Pubkey,
        challenge_verification: ChallengeVerificationType,
        bumps: &VoteForVoteBasedChallengeBumps,
    ) -> Result<()> {
        let challenge_account = &mut self.challenge_account;
        let user_challenge_account = &mut self.user_challenge_account;
        let vote_account = &mut self.vote_account;

        // Check if the user has participated in the challenge
        if !user_challenge_account.is_joined {
            return Err(ErrorCode::UserDidNotParticipate.into());
        }
        // Check if voter is not voting for himself
        if user_challenge_account.user_address == self.signer.key() {
            return Err(ErrorCode::VoterIsVotingForHimself.into());
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

        // check if the user has already voted
        if vote_account.is_voted {
            return Err(ErrorCode::UserHasAlreadyVoted.into());
        }

        match challenge_verification {
            ChallengeVerificationType::VoteBased { is_completed } => {
                // check if the challenge is also vote based
                match challenge_account.challenge_information.challenge_type {
                    ChallengeType::VoteBased => {
                        if is_completed {
                            user_challenge_account.vote_in_positive += 1;
                        } else {
                            user_challenge_account.vote_in_negative += 1;
                        }
                        vote_account.is_voted = true;
                        vote_account.is_completed = is_completed;
                        vote_account.bump = bumps.vote_account;
                        vote_account.challenge_address = challenge_account.key();
                        vote_account.user_address = user_challenge_account.user_address;
                        vote_account.voter_address = self.signer.key();
                    }
                    ChallengeType::Github { commits: _ } => {
                        if is_completed {
                            user_challenge_account.vote_in_positive += 1;
                        } else {
                            user_challenge_account.vote_in_negative += 1;
                        }
                        vote_account.is_voted = true;
                        vote_account.is_completed = is_completed;
                        vote_account.bump = bumps.vote_account;
                        vote_account.challenge_address = challenge_account.key();
                        vote_account.user_address = user_challenge_account.user_address;
                        vote_account.voter_address = self.signer.key();
                    }
                    _ => return Err(ErrorCode::InvalidVerificationType.into()),
                }
            }
            _ => return Err(ErrorCode::InvalidVerificationType.into()),
        }

        Ok(())
    }
}
