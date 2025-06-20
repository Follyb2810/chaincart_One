use cosmwasm_std::{StdError, Uint128};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Invalid deposit: expected {expected} {denom}, got {received} {denom}")]
    InvalidDeposit { expected: Uint128, received: Uint128, denom: String },

    #[error("Contract is not in the correct status")]
    InvalidStatus {},

    #[error("Invalid fee percentage: must be between 0 and 100")]
    InvalidFeePercentage {},

    #[error("Invalid deposit amount: must be greater than zero")]
    InvalidDepositAmount {},

    #[error("Insufficient funds in the contract")]
    InsufficientFunds {},
}
