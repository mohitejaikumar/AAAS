use anchor_lang::prelude::*;

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
    pub treasury_bump: u8,
    pub is_private: bool,
    #[max_len(10)]
    pub private_group: Vec<Pubkey>, // this will be used to store the private group of the challenge
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum ChallengeType {
    #[doc = "this will be verified by the off-chain verification service"]
    GoogleFit { steps: u64 },
    #[doc = "this will be verified by the community members, (because github is subjective )"]
    Github { commits: u64 },
    #[doc = "this will be verified by the community members, because goal can be anything, eg:- study for 5 hr , read 100 pages , etc"]
    VoteBased,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ChallengeInformation {
    pub challenge_type: ChallengeType,
    #[max_len(32)]
    pub challenge_name: String,
    #[max_len(256)]
    pub challenge_description: String,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum ChallengeVerificationType {
    #[doc = "this will be verified by the off-chain verification service"]
    Monitored { score: u64, is_completed: bool },
    #[doc = "this will be verified by the community members, (because it is for subjective challenges)"]
    VoteBased { is_completed: bool },
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ChallengeVerification {
    pub challenge_type: ChallengeVerificationType,
}
