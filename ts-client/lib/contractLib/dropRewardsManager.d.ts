import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult, InstantiateResult } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";
import { Coin } from "@cosmjs/amino";
/**
 * A thin wrapper around u128 that is using strings for JSON encoding/decoding, such that the full u128 range can be used for clients that convert JSON numbers to floats, like JavaScript and jq.
 *
 * # Examples
 *
 * Use `from` to create instances of this and `u128` to get the value out:
 *
 * ``` # use cosmwasm_std::Uint128; let a = Uint128::from(123u128); assert_eq!(a.u128(), 123);
 *
 * let b = Uint128::from(42u64); assert_eq!(b.u128(), 42);
 *
 * let c = Uint128::from(70u32); assert_eq!(c.u128(), 70); ```
 */
export type Uint128 = string;
export type ArrayOfHandlerConfig = HandlerConfig[];
/**
 * Expiration represents a point in time when some event happens. It can compare with a BlockInfo and will return is_expired() == true once the condition is hit (and for every block in the future)
 */
export type Expiration = {
    at_height: number;
} | {
    at_time: Timestamp;
} | {
    never: {};
};
/**
 * A point in time in nanosecond precision.
 *
 * This type can represent times from 1970-01-01T00:00:00Z to 2554-07-21T23:34:33Z.
 *
 * ## Examples
 *
 * ``` # use cosmwasm_std::Timestamp; let ts = Timestamp::from_nanos(1_000_000_202); assert_eq!(ts.nanos(), 1_000_000_202); assert_eq!(ts.seconds(), 1); assert_eq!(ts.subsec_nanos(), 202);
 *
 * let ts = ts.plus_seconds(2); assert_eq!(ts.nanos(), 3_000_000_202); assert_eq!(ts.seconds(), 3); assert_eq!(ts.subsec_nanos(), 202); ```
 */
export type Timestamp = Uint64;
/**
 * A thin wrapper around u64 that is using strings for JSON encoding/decoding, such that the full u64 range can be used for clients that convert JSON numbers to floats, like JavaScript and jq.
 *
 * # Examples
 *
 * Use `from` to create instances of this and `u64` to get the value out:
 *
 * ``` # use cosmwasm_std::Uint64; let a = Uint64::from(42u64); assert_eq!(a.u64(), 42);
 *
 * let b = Uint64::from(70u32); assert_eq!(b.u64(), 70); ```
 */
export type Uint64 = string;
/**
 * Information about if the contract is currently paused.
 */
export type PauseInfoResponse = {
    paused: {};
} | {
    unpaused: {};
};
/**
 * Actions that can be taken to alter the contract's ownership
 */
export type UpdateOwnershipArgs = {
    transfer_ownership: {
        expiry?: Expiration | null;
        new_owner: string;
    };
} | "accept_ownership" | "renounce_ownership";
export interface DropRewardsManagerSchema {
    responses: ArrayOfHandlerConfig | OwnershipForString | PauseInfoResponse;
    execute: AddHandlerArgs | RemoveHandlerArgs | ExchangeRewardsArgs | UpdateOwnershipArgs;
    instantiate?: InstantiateMsg;
    [k: string]: unknown;
}
export interface HandlerConfig {
    address: string;
    denom: string;
    min_rewards: Uint128;
}
/**
 * The contract's ownership info
 */
export interface OwnershipForString {
    /**
     * The contract's current owner. `None` if the ownership has been renounced.
     */
    owner?: string | null;
    /**
     * The deadline for the pending owner to accept the ownership. `None` if there isn't a pending ownership transfer, or if a transfer exists and it doesn't have a deadline.
     */
    pending_expiry?: Expiration | null;
    /**
     * The account who has been proposed to take over the ownership. `None` if there isn't a pending ownership transfer.
     */
    pending_owner?: string | null;
}
export interface AddHandlerArgs {
    config: HandlerConfig;
}
export interface RemoveHandlerArgs {
    denom: string;
}
export interface ExchangeRewardsArgs {
    denoms: string[];
}
export interface InstantiateMsg {
    owner: string;
}
export declare class Client {
    private readonly client;
    contractAddress: string;
    constructor(client: CosmWasmClient | SigningCosmWasmClient, contractAddress: string);
    mustBeSigningClient(): Error;
    static instantiate(client: SigningCosmWasmClient, sender: string, codeId: number, initMsg: InstantiateMsg, label: string, fees: StdFee | 'auto' | number, initCoins?: readonly Coin[]): Promise<InstantiateResult>;
    static instantiate2(client: SigningCosmWasmClient, sender: string, codeId: number, salt: number, initMsg: InstantiateMsg, label: string, fees: StdFee | 'auto' | number, initCoins?: readonly Coin[]): Promise<InstantiateResult>;
    queryHandlers: () => Promise<ArrayOfHandlerConfig>;
    queryOwnership: () => Promise<OwnershipForString>;
    queryPauseInfo: () => Promise<PauseInfoResponse>;
    addHandler: (sender: string, args: AddHandlerArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
    removeHandler: (sender: string, args: RemoveHandlerArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
    exchangeRewards: (sender: string, args: ExchangeRewardsArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
    updateOwnership: (sender: string, args: UpdateOwnershipArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
    pause: (sender: string, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
    unpause: (sender: string, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]) => Promise<ExecuteResult>;
}