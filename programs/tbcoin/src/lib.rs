use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use mpl_token_metadata::instruction::create_metadata_accounts_v3;
use mpl_token_metadata::pda::find_metadata_account;
use mpl_token_metadata::types::DataV2;
use solana_program::program::invoke;

pub const CONFIG_SEED: &[u8] = b"config";
pub const MAX_URI_LEN: usize = 200;
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;

// Replace with the program id once deployed.
declare_id!("tbCoiNq1tFZzxfbE7yVZM6P8Rsm1LkNgnE5Z5yJ6Fzq");

#[program]
pub mod tbcoin {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        metadata_uri: String,
        decimals: u8,
    ) -> Result<()> {
        require!(metadata_uri.as_bytes().len() <= MAX_URI_LEN, TbCoinError::MetadataUriTooLong);
        require!(decimals <= 9, TbCoinError::InvalidDecimals);
        require!(ctx.accounts.mint.decimals == decimals, TbCoinError::InvalidDecimals);

        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.mint = ctx.accounts.mint.key();
        config.decimals = decimals;
        config.bump = ctx.bumps.config;
        config.metadata_uri = metadata_uri;
        Ok(())
    }

    pub fn create_mint(ctx: Context<CreateMint>, decimals: u8) -> Result<()> {
        // Anchor takes care of initializing the mint via the account constraints.
        // Storing decimals in the newly created mint so subsequent instructions can validate.
        require!(decimals <= 9, TbCoinError::InvalidDecimals);
        Ok(())
    }

    pub fn create_associated_token_account(
        _ctx: Context<CreateAssociatedTokenAccount>,
    ) -> Result<()> {
        // The account constraint performs the CPI to create the ATA.
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.mint_authority.key(), TbCoinError::Unauthorized);
        require_keys_eq!(ctx.accounts.config.mint, ctx.accounts.mint.key(), TbCoinError::InvalidMint);
        require!(ctx.accounts.destination.mint == ctx.accounts.mint.key(), TbCoinError::InvalidTokenAccount);

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        require!(ctx.accounts.source.owner == ctx.accounts.authority.key(), TbCoinError::Unauthorized);
        require!(ctx.accounts.source.mint == ctx.accounts.destination.mint, TbCoinError::InvalidTokenAccount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.source.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn create_metadata(
        ctx: Context<CreateMetadata>,
        name: String,
        symbol: String,
        uri: Option<String>,
        seller_fee_basis_points: u16,
    ) -> Result<()> {
        require!(name.as_bytes().len() <= MAX_NAME_LEN, TbCoinError::NameTooLong);
        require!(symbol.as_bytes().len() <= MAX_SYMBOL_LEN, TbCoinError::SymbolTooLong);
        let metadata_uri = uri.unwrap_or_else(|| ctx.accounts.config.metadata_uri.clone());
        require!(metadata_uri.as_bytes().len() <= MAX_URI_LEN, TbCoinError::MetadataUriTooLong);
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.update_authority.key(), TbCoinError::Unauthorized);
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.mint_authority.key(), TbCoinError::Unauthorized);
        require_keys_eq!(ctx.accounts.config.mint, ctx.accounts.mint.key(), TbCoinError::InvalidMint);
        let (expected_metadata, _) = find_metadata_account(&ctx.accounts.mint.key());
        require_keys_eq!(expected_metadata, ctx.accounts.metadata.key(), TbCoinError::InvalidMetadataAccount);

        let data = DataV2 {
            name,
            symbol,
            uri: metadata_uri,
            seller_fee_basis_points,
            creators: None,
            collection: None,
            uses: None,
        };

        let ix = create_metadata_accounts_v3(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.mint_authority.key(),
            ctx.accounts.payer.key(),
            ctx.accounts.update_authority.key(),
            data,
            true,
            None,
            true,
            true,
        );

        let account_infos = [
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.update_authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];

        invoke(&ix, &account_infos)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        space = Config::LEN,
        seeds = [CONFIG_SEED, mint.key().as_ref()],
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint_authority: Signer<'info>,
    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAssociatedTokenAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Account owner for the associated token account
    pub owner: UncheckedAccount<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = owner
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(has_one = admin, has_one = mint)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub source: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    #[account(has_one = admin, has_one = mint)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    /// CHECK: PDA for token metadata
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    pub mint_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub update_authority: Signer<'info>,
    /// CHECK: Metadata program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub decimals: u8,
    pub bump: u8,
    pub metadata_uri: String,
}

impl Config {
    pub const LEN: usize = 8  // discriminator
        + 32  // admin
        + 32  // mint
        + 1   // decimals
        + 1   // bump
        + 4   // string prefix
        + MAX_URI_LEN; // uri storage cap
}

#[error_code]
pub enum TbCoinError {
    #[msg("Metadata URI exceeds maximum length")] 
    MetadataUriTooLong,
    #[msg("Name exceeds maximum length")] 
    NameTooLong,
    #[msg("Symbol exceeds maximum length")] 
    SymbolTooLong,
    #[msg("Caller not authorized for this action")] 
    Unauthorized,
    #[msg("Provided mint does not match configuration")] 
    InvalidMint,
    #[msg("Token account is not valid for this mint")] 
    InvalidTokenAccount,
    #[msg("Decimals must be between 0 and 9")] 
    InvalidDecimals,
    #[msg("Metadata account PDA is invalid")] 
    InvalidMetadataAccount,
}
