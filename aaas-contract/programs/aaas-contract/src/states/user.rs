use anchor_lang::prelude::*;

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
    #[max_len(300)]
    pub description: String,
    pub user_address: Pubkey,
    pub is_joined: bool,
    pub money_deposited: u64,
    pub is_challenge_completed: bool,
    pub bump: u8,
    pub score: u64,
    pub vote_in_positive: u64,
    pub vote_in_negative: u64,
}
