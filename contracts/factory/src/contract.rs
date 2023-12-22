use crate::{
    error::ContractResult,
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{Config, State, CONFIG, STATE},
};
use cosmwasm_std::{
    attr, entry_point, instantiate2_address, to_json_binary, Binary, CodeInfoResponse, CosmosMsg,
    Deps, DepsMut, Env, HexBinary, MessageInfo, Response, StdResult, WasmMsg,
};
use cw2::set_contract_version;
use lido_staking_base::msg::token::InstantiateMsg as TokenInstantiateMsg;
use lido_staking_base::{
    helpers::answer::response, msg::core::InstantiateMsg as CoreInstantiateMsg,
};
use neutron_sdk::{
    bindings::{msg::NeutronMsg, query::NeutronQuery},
    NeutronResult,
};

const CONTRACT_NAME: &str = concat!("crates.io:lido-neutron-contracts__", env!("CARGO_PKG_NAME"));
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> ContractResult<Response<NeutronMsg>> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    CONFIG.save(
        deps.storage,
        &Config {
            salt: msg.salt.to_string(),
            token_code_id: msg.token_code_id,
            core_code_id: msg.core_code_id,
            owner: info.sender.to_string(),
            subdenom: msg.subdenom.to_string(),
        },
    )?;

    let attrs = vec![
        attr("salt", msg.salt),
        attr("token_code_id", msg.token_code_id.to_string()),
        attr("core_code_id", msg.core_code_id.to_string()),
        attr("owner", info.sender),
        attr("subdenom", msg.subdenom),
    ];
    Ok(response("instantiate", CONTRACT_NAME, attrs))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps<NeutronQuery>, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::State {} => to_json_binary(&STATE.load(deps.storage)?),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> ContractResult<Response<NeutronMsg>> {
    match msg {
        ExecuteMsg::Init {} => execute_init(deps, env, info),
    }
}

fn execute_init(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
) -> ContractResult<Response<NeutronMsg>> {
    let config = CONFIG.load(deps.storage)?;
    let canonical_self_address = deps.api.addr_canonicalize(env.contract.address.as_str())?;
    let mut attrs = vec![attr("action", "init")];

    let token_contract_checksum = get_code_checksum(deps.as_ref(), config.token_code_id)?;
    let core_contract_checksum = get_code_checksum(deps.as_ref(), config.core_code_id)?;
    let salt = config.salt.as_bytes();

    let token_address =
        instantiate2_address(&token_contract_checksum, &canonical_self_address, salt)?;
    attrs.push(attr("token_address", token_address.to_string()));
    let core_address =
        instantiate2_address(&core_contract_checksum, &canonical_self_address, salt)?;
    attrs.push(attr("core_address", core_address.to_string()));

    let core_contract = deps.api.addr_humanize(&core_address)?.to_string();
    let token_contract = deps.api.addr_humanize(&token_address)?.to_string();
    let state = State {
        token_contract: token_contract.to_string(),
        core_contract: core_contract.to_string(),
    };

    STATE.save(deps.storage, &state)?;
    let msgs = vec![
        CosmosMsg::Wasm(WasmMsg::Instantiate2 {
            admin: Some(env.contract.address.to_string()),
            code_id: config.token_code_id,
            label: "token".to_string(),
            msg: to_json_binary(&TokenInstantiateMsg {
                core_address: core_contract,
                subdenom: config.subdenom,
            })?,
            funds: vec![],
            salt: Binary::from(salt),
        }),
        CosmosMsg::Wasm(WasmMsg::Instantiate2 {
            admin: Some(env.contract.address.to_string()),
            code_id: config.core_code_id,
            label: "core".to_string(),
            msg: to_json_binary(&CoreInstantiateMsg {
                token_contract: token_contract.to_string(),
                puppeteer_contract: "".to_string(),
                strategy_contract: "".to_string(),
                owner: env.contract.address.to_string(),
            })?,
            funds: vec![],
            salt: Binary::from(salt),
        }),
    ];

    Ok(response("execute-init", CONTRACT_NAME, attrs).add_messages(msgs))
}

fn get_code_checksum(deps: Deps, code_id: u64) -> NeutronResult<HexBinary> {
    let CodeInfoResponse { checksum, .. } = deps.querier.query_wasm_code_info(code_id)?;
    Ok(checksum)
}