use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VoteAccount {
    pub challenge_address: Pubkey,
    pub user_address: Pubkey,
    pub is_voted: bool,
    pub is_completed: bool,
    pub bump: u8,
    pub voter_address: Pubkey,
}
