use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub buyer: Addr,            // Buyer’s address
    pub seller: Addr,           // Seller’s address
    pub marketplace: Addr,      // Marketplace’s address (acts as broker)
    pub required_deposit: Uint128, // Amount buyer must deposit
    pub denom: String,          // Denomination of the deposit (e.g., "ucosm")
    pub fee_percentage: u8,     // Fee percentage for marketplace (e.g., 5 for 5%)
    pub status: Status,         // Current status of the escrow
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum Status {
    Created,    // Initial state after instantiation
    Deposited,  // After buyer deposits funds
    Released,   // After funds are released to seller and marketplace
    Refunded,   // After funds are refunded to buyer
}

// Storage key for the state
pub const STATE: Item<State> = Item::new("state");