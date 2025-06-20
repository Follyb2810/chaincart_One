use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::Uint128;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub buyer: String,          // Buyer’s address as string (validated in instantiate)
    pub seller: String,         // Seller’s address
    pub marketplace: String,    // Marketplace’s address
    pub required_deposit: Uint128, // Required deposit amount
    pub denom: String,          // Denomination (e.g., "ucosm")
    pub fee_percentage: u8,     // Fee percentage (0-100)
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Deposit {},  // Buyer deposits funds
    Release {},  // Marketplace releases funds to seller and itself
    Refund {},   // Marketplace refunds buyer
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetState {}, // Query the current state
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct StateResponse {
    pub buyer: String,
    pub seller: String,
    pub marketplace: String,
    pub required_deposit: Uint128,
    pub denom: String,
    pub fee_percentage: u8,
    pub status: String,
}