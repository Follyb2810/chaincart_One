use cosmwasm_std::{
    entry_point,  to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cosmwasm_std::Uint128;
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, StateResponse};
use crate::state::{State, Status, STATE};

// Contract version info
const CONTRACT_NAME: &str = "crates.io:escrow-contract";
const CONTRACT_VERSION: &str = "0.1.0";

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // Validate inputs
    if msg.required_deposit.is_zero() {
        return Err(ContractError::InvalidDepositAmount {});
    }
    if msg.fee_percentage > 100 {
        return Err(ContractError::InvalidFeePercentage {});
    }

    // Validate and convert addresses
    let buyer = deps.api.addr_validate(&msg.buyer)?;
    let seller = deps.api.addr_validate(&msg.seller)?;
    let marketplace = deps.api.addr_validate(&msg.marketplace)?;

    let state = State {
        buyer,
        seller,
        marketplace,
        required_deposit: msg.required_deposit,
        denom: msg.denom,
        fee_percentage: msg.fee_percentage,
        status: Status::Created,
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    STATE.save(deps.storage, &state)?;

    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Deposit {} => execute_deposit(deps, env, info),
        ExecuteMsg::Release {} => execute_release(deps, env, info),
        ExecuteMsg::Refund {} => execute_refund(deps, env, info),
    }
}

fn execute_deposit(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;

    // Check status and sender
    if state.status != Status::Created {
        return Err(ContractError::InvalidStatus {});
    }
    if info.sender != state.buyer {
        return Err(ContractError::Unauthorized {});
    }

    // Validate deposited funds
    let funds = info.funds;
    let received = if funds.len() != 1 || funds[0].denom != state.denom {
        Uint128::zero()
    } else {
        funds[0].amount
    };

    if funds.len() != 1  || funds[0].denom != state.denom || funds[0].amount != state.required_deposit {
        return Err(ContractError::InvalidDeposit {
            expected: state.required_deposit,
            received,
            denom: state.denom.clone(),
        });
    }

    // Update status
    state.status = Status::Deposited;
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "deposit")
        .add_attribute("amount", state.required_deposit.to_string())
        .add_attribute("denom", state.denom.clone()))
}

fn execute_release(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let state = STATE.load(deps.storage)?;

    // Check status and sender
    if state.status != Status::Deposited {
        return Err(ContractError::InvalidStatus {});
    }
    if info.sender != state.marketplace {
        return Err(ContractError::Unauthorized {});
    }

    // Verify contract balance
    let balance = deps.querier.query_balance(&env.contract.address, &state.denom)?;
    if balance.amount < state.required_deposit {
        return Err(ContractError::InsufficientFunds {});
    }

    // Calculate amounts
    let fee = (state.required_deposit * Uint128::from(state.fee_percentage as u128)) / Uint128::from(100u128);
    let seller_amount = state.required_deposit - fee;

// Prepare messages
    let send_seller = BankMsg::Send {
        to_address: state.seller.to_string(),
        amount: vec![Coin {
            denom: state.denom.clone(),
            amount: seller_amount,
        }],
    };
    let send_marketplace = BankMsg::Send {
        to_address: state.marketplace.to_string(),
        amount: vec![Coin {
            denom: state.denom.clone(),
            amount: fee,
        }],
    };

    // Update status
    STATE.update(deps.storage, |mut s| -> Result<_, ContractError> {
        s.status = Status::Released;
        Ok(s)
    })?;

    Ok(Response::new()
        .add_message(send_seller)
        .add_message(send_marketplace)
        .add_attribute("method", "release")
        .add_attribute("seller_amount", seller_amount.to_string())
        .add_attribute("fee", fee.to_string())
        .add_attribute("denom", state.denom.clone()))
}

fn execute_refund(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let state = STATE.load(deps.storage)?;

    // Check status and sender
    if state.status != Status::Deposited {
        return Err(ContractError::InvalidStatus {});
    }
    if info.sender != state.marketplace {
        return Err(ContractError::Unauthorized {});
    }

    // Verify contract balance
    let balance = deps.querier.query_balance(&env.contract.address, &state.denom)?;
    if balance.amount < state.required_deposit {
        return Err(ContractError::InsufficientFunds {});
    }

    // Prepare refund message
    let send_buyer = BankMsg::Send {
        to_address: state.buyer.to_string(),
        amount: vec![Coin {
            denom: state.denom.clone(),
            amount: state.required_deposit,
        }],
    };

    // Update status
    STATE.update(deps.storage, |mut s| -> Result<_, ContractError> {
        s.status = Status::Refunded;
        Ok(s)
    })?;

    Ok(Response::new()
        .add_message(send_buyer)
        .add_attribute("method", "refund")
        .add_attribute("amount", state.required_deposit.to_string())
        .add_attribute("denom", state.denom.clone()))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetState {} => to_json_binary(&query_state(deps)?),
    }
}

fn query_state(deps: Deps) -> StdResult<StateResponse> {
    let state = STATE.load(deps.storage)?;
    Ok(StateResponse {
        buyer: state.buyer.to_string(),
        seller: state.seller.to_string(),
        marketplace: state.marketplace.to_string(),
        required_deposit: state.required_deposit,
        denom: state.denom,
        fee_percentage: state.fee_percentage,
        status: format!("{:?}", state.status),
    })
}