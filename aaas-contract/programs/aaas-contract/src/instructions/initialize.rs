use anchor_lang::prelude::*;

use crate::states::ProgramState;


#[derive(Accounts)]
pub struct Initialize<'info> {

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init, 
        payer = signer,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program_owner".as_ref()],
        bump
    )]
    pub state: Account<'info, ProgramState>,

    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    
    pub fn initialize(
        &mut self,
        bumps: &InitializeBumps
    ) -> Result<()> {
        
        let state = &mut self.state;
        state.owner = *self.signer.key; // Store the deployer's key
        state.bump = bumps.state;
        Ok(()) 
    }
}