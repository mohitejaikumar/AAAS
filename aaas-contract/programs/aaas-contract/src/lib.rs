use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

declare_id!("9BojoNnqcLQ74aBpw7zg76WQRPAac5RwgMcUeeC54R1x");

#[program]
pub mod aaas_contract {
    use super::*;
    // this will be called by the owner of the contract
    pub fn initialize_challenge(
        context: Context<InitializeChallenge>,
        challenge_id: u64,
        challenge_type: ChallengeType,
        start_time: i64,
        end_time: i64,
        money_per_participant: u64,
        is_private: bool,
        private_group: Vec<Pubkey>,
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

        let challenge_account = &mut context.accounts.challenge_account;
        challenge_account.challenge_id = challenge_id;
        challenge_account.challenge_information = ChallengeInformation {
            challenge_type,
            challenge_name: String::new(),
            challenge_description: String::new(),
        };
        challenge_account.start_time = start_time;
        challenge_account.end_time = end_time;
        challenge_account.total_participants = 0;
        challenge_account.money_pool = 0;
        challenge_account.money_per_participant = money_per_participant;
        challenge_account.treasury_account = context.accounts.treasury_account.key();
        challenge_account.is_private = is_private;
        challenge_account.private_group = private_group;
        Ok(())
    }

    pub fn join_challenge(
        context: Context<JoinChallenge>,
        _challenge_id: u64,
        user_name: String,
    ) -> Result<()> {
        let challenge_account = &mut context.accounts.challenge_account;
        let user_account = &mut context.accounts.user_account;
        let user_challenge_account = &mut context.accounts.user_challenge_account;
        let treasury_account = &mut context.accounts.treasury_account;

        // check if the challenge is private and the user is in the private group
        if challenge_account.is_private {
            if !challenge_account
                .private_group
                .contains(&context.accounts.signer.key())
            {
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
            from: user_account.to_account_info(),
            to: treasury_account.to_account_info(),
            mint: context.accounts.mint.to_account_info(),
            authority: context.accounts.signer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            context.accounts.token_program.to_account_info(),
            transfer_accounts_option,
        );
        transfer_checked(
            cpi_ctx,
            challenge_account.money_per_participant,
            context.accounts.mint.decimals,
        )?;

        // update the user challenge account
        user_challenge_account.is_joined = true;
        user_challenge_account.money_deposited = challenge_account.money_per_participant;
        user_challenge_account.challenge_address = challenge_account.key();
        user_challenge_account.user_address = context.accounts.signer.key();
        user_challenge_account.is_challenge_completed = false;

        // update the user account
        user_account.user_name = user_name;
        user_account.total_participations += 1;
        user_account.total_money_deposited += challenge_account.money_per_participant;

        // update the challenge account
        challenge_account.total_participants += 1;
        challenge_account.money_pool += challenge_account.money_per_participant;

        Ok(())
    }

    pub fn claim_challenge(context: Context<ClaimChallenge>, _challenge_id: u64) -> Result<()> {
        let challenge_account = &mut context.accounts.challenge_account;
        let user_account = &mut context.accounts.user_account;
        let user_challenge_account = &mut context.accounts.user_challenge_account;
        let treasury_account = &mut context.accounts.treasury_account;
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

        // update the user account
        user_account.total_money_withdrawn += user_challenge_account.money_deposited;
        // update the user challenge account
        let amount_to_refund = user_challenge_account.money_deposited.clone();
        user_challenge_account.money_deposited = 0;

        // refund the money from the treasury account to the user account
        let transfer_accounts_option = TransferChecked {
            from: treasury_account.to_account_info(),
            to: user_account.to_account_info(),
            mint: context.accounts.mint.to_account_info(),
            authority: context.accounts.treasury_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            context.accounts.token_program.to_account_info(),
            transfer_accounts_option,
        );
        transfer_checked(cpi_ctx, amount_to_refund, context.accounts.mint.decimals)?;

        Ok(())
    }

    // this will be called by off-chain verification service
    pub fn update_challenge_status(
        context: Context<UpdateChallengeStatus>,
        _challenge_id: u64,
        _user_address: Pubkey,
        challenge_verification: ChallengeVerification,
    ) -> Result<()> {
        let challenge_account = &mut context.accounts.challenge_account;
        let user_challenge_account = &mut context.accounts.user_challenge_account;

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
            (
                ChallengeType::Github { commits: _ },
                ChallengeVerificationType::VoteBased { is_completed },
            ) => {
                if *is_completed {
                    user_challenge_account.is_challenge_completed = true;
                    user_challenge_account.vote_in_positive += 1;
                } else {
                    user_challenge_account.vote_in_negative += 1;
                }
            }
            (
                ChallengeType::NonMonitored,
                ChallengeVerificationType::VoteBased { is_completed },
            ) => {
                if *is_completed {
                    user_challenge_account.is_challenge_completed = true;
                    user_challenge_account.vote_in_positive += 1;
                } else {
                    user_challenge_account.vote_in_negative += 1;
                }
            }
            _ => return Err(ErrorCode::InvalidVerificationType.into()),
        }

        Ok(())
    }
}

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

#[derive(Accounts)]
#[instruction(challenge_id: u64, user_address: Pubkey)]
pub struct UpdateChallengeStatus<'info> {
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
}
// -----------------------------------------------------------------------------------------------------------
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum ChallengeType {
    #[doc = "this will be verified by the off-chain verification service"]
    GoogleFit { steps: u64 },
    #[doc = "this will be verified by the community members, (because github is subjective )"]
    Github { commits: u64 },
    #[doc = "this will be verified by the community members, because goal can be anything, eg:- study for 5 hr , read 100 pages , etc"]
    NonMonitored,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ChallengeInformation {
    pub challenge_type: ChallengeType,
    #[max_len(32)]
    pub challenge_name: String,
    #[max_len(256)]
    pub challenge_description: String,
}

#[account]
#[derive(InitSpace)]
pub struct ChallengeAccount {
    pub challenge_id: u64,
    pub challenge_information: ChallengeInformation,
    pub start_time: i64,
    pub end_time: i64,
    pub total_participants: u64,
    pub total_votes: u64,
    pub money_pool: u64,
    pub money_per_participant: u64,
    pub treasury_account: Pubkey,
    pub is_private: bool,
    #[max_len(10)]
    pub private_group: Vec<Pubkey>, // this will be used to store the private group of the challenge
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    #[max_len(32)]
    pub user_name: String,
    pub user_address: Pubkey,
    pub total_participations: u64,
    pub total_money_deposited: u64,
    pub total_money_withdrawn: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserChallengeAccount {
    pub challenge_address: Pubkey,
    pub user_address: Pubkey,
    pub is_joined: bool,
    pub money_deposited: u64,
    pub is_challenge_completed: bool,
    pub bump: u8,
    pub score: u64,
    pub vote_in_positive: u64,
    pub vote_in_negative: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("User is not in the private group")]
    UnAuthorized,
    #[msg("User has already joined the challenge")]
    AlreadyJoined,
    #[msg("Challenge has already started")]
    ChallengeStarted,
    #[msg("Private group is empty")]
    PrivateGroupEmpty,
    #[msg("Start time is in the past")]
    StartTimeInThePast,
    #[msg("End time is before start time")]
    EndTimeBeforeStartTime,
    #[msg("User did not participate in the challenge")]
    UserDidNotParticipate,
    #[msg("Challenge is not ended")]
    ChallengeNotEnded,
    #[msg("User has not completed the challenge")]
    UserHasNotCompletedTheChallenge,
    #[msg("User has already claimed the challenge")]
    AlreadyClaimed,
    #[msg("Challenge is not yet started")]
    ChallengeNotStarted,
    #[msg("Challenge is ended")]
    ChallengeEnded,
    #[msg("Invalid verification type")]
    InvalidVerificationType,
    #[msg("Challenge is under verification")]
    ChallengeUnderVerification,
    #[msg("Challenge verification time ended")]
    ChallengeVerificationTimeEnded,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum ChallengeVerificationType {
    #[doc = "this will be verified by the off-chain verification service"]
    Monitored { score: u64, is_completed: bool },
    #[doc = "this will be verified by the community members, (because github is subjective )"]
    VoteBased { is_completed: bool },
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ChallengeVerification {
    pub challenge_type: ChallengeVerificationType,
}
