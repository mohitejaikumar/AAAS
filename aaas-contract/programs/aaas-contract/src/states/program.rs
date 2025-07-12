use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub owner: Pubkey,
    pub bump: u8,
}
