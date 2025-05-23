import type { Abi } from "starknet";

export const TBTC_ADDRESS =
  "0x01bf229c1217853883088ac3be9230f93688e5d64617bf439a480a4241a205da";

export const BITUSD_ADDRESS =
  "0x3a4f7d95d4f5ad3c4bad8f0db881b91910b8fa74c60358e2a5337d251c4c248";

export const TBTC_DECIMALS = 18;

export const TBTC_SYMBOL = "TBTC";

export const TBTC_NAME = "Testnet Bitcoin";

export const TBTC_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      {
        name: "spender",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "amount",
        type: "core::integer::u256",
      },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "mint",
    state_mutability: "external",
    inputs: [
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "amount",
        type: "core::integer::u256",
      },
    ],
    outputs: [],
  },
] as const satisfies Abi;

export const BORROWER_OPERATIONS_ADDRESS =
  "0x541433b595c390ea1b9878676889dcdc8d8d9ea593a5933b2a5c795e68a0d73";
export const AP_ADDRESS =
  "0x154275f72a5395ae53433b2bf75529fd19b0249d873eb97b5b0de7d128cdde8";
export const COLL_SURPLUS_ADDRESS =
  "0x2d4af701d070c1790873f45408ed05b51ccdb48c00184e66aa6345d2b16119b";
export const DEFAULT_POOL_ADDRESS =
  "0x559bce2315dfa245051bacf3bd9fcf8e4f9127d7689840647960e39791d0858";
export const SORTED_TROVES_ADDRESS =
  "0x1bd344775c2186ce12e01716d012cb1edb91914715302b8ae576a2057fc863d";
export const TM_ADDRESS =
  "0x267a0b64078156347fefc7e20c5446457a948d36affce2bfbdbf07a4dee7f83";
export const TROVE_NFT_ADDRESS = "0xb6151205dd1417059949c6845eef2ad4b64a6c8";

export const BORROWER_OPERATIONS_ABI = [
  {
    type: "impl",
    name: "BorrowerOperationsImpl",
    interface_name: "bit_usd::BorrowerOperations::IBorrowerOperations",
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "struct",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::OpenTroveAndJoinInterestBatchManagerParams",
    members: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "owner_index", type: "core::integer::u256" },
      { name: "coll_amount", type: "core::integer::u256" },
      { name: "bitusd_amount", type: "core::integer::u256" },
      { name: "upper_hint", type: "core::integer::u256" },
      { name: "lower_hint", type: "core::integer::u256" },
      {
        name: "interest_batch_manager",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "max_upfront_fee", type: "core::integer::u256" },
      {
        name: "add_manager",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "remove_manager",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "receiver",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "struct",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::InterestIndividualDelegate",
    members: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "min_interest_rate", type: "core::integer::u128" },
      { name: "max_interest_rate", type: "core::integer::u128" },
      { name: "min_interest_rate_change_period", type: "core::integer::u256" },
    ],
  },
  {
    type: "interface",
    name: "bit_usd::BorrowerOperations::IBorrowerOperations",
    items: [
      {
        type: "function",
        name: "open_trove",
        inputs: [
          {
            name: "owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "owner_index", type: "core::integer::u256" },
          { name: "coll_amount", type: "core::integer::u256" },
          { name: "bitusd_amount", type: "core::integer::u256" },
          { name: "upper_hint", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "annual_interest_rate", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
          {
            name: "add_manager",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "remove_manager",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "receiver",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "open_trove_and_join_interest_batch_manager",
        inputs: [
          {
            name: "params",
            type: "bit_usd::BorrowerOperations::BorrowerOperations::OpenTroveAndJoinInterestBatchManagerParams",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "add_coll",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "coll_amount", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "withdraw_coll",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "coll_withdrawal", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "withdraw_bitusd",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "bitusd_amount", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "repay_bitusd",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "bitusd_amount", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "close_trove",
        inputs: [{ name: "trove_id", type: "core::integer::u256" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "adjust_trove",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "coll_change", type: "core::integer::u256" },
          { name: "is_coll_increase", type: "core::bool" },
          { name: "debt_change", type: "core::integer::u256" },
          { name: "is_debt_increase", type: "core::bool" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "adjust_zombie_trove",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "coll_change", type: "core::integer::u256" },
          { name: "is_coll_increase", type: "core::bool" },
          { name: "debt_change", type: "core::integer::u256" },
          { name: "is_debt_increase", type: "core::bool" },
          { name: "upper_hint", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "adjust_trove_interest_rate",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "new_annual_interest_rate", type: "core::integer::u256" },
          { name: "upper_hint", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "apply_pending_debt",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "upper_hint", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "on_liquidate_trove",
        inputs: [{ name: "trove_id", type: "core::integer::u256" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "claim_collateral",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "has_been_shutdown",
        inputs: [],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "shutdown",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "shutdown_from_oracle_failure",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "check_batch_manager_exists",
        inputs: [
          {
            name: "batch_manager",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_interest_individual_delegate_of",
        inputs: [{ name: "trove_id", type: "core::integer::u256" }],
        outputs: [
          {
            type: "bit_usd::BorrowerOperations::BorrowerOperations::InterestIndividualDelegate",
          },
        ],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "set_interest_individual_delegate",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          {
            name: "delegate",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "min_interest_rate", type: "core::integer::u128" },
          { name: "max_interest_rate", type: "core::integer::u128" },
          { name: "new_annual_interest_rate", type: "core::integer::u256" },
          { name: "upper_hint", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
          {
            name: "min_interest_rate_change_period",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "set_interest_batch_manager",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          {
            name: "new_batch_manager",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "upper_hint", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "remove_from_batch",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "new_annual_interest_rate", type: "core::integer::u256" },
          { name: "upper_hint", type: "core::integer::u256" },
          { name: "lower_hint", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "switch_batch_manager",
        inputs: [
          { name: "trove_id", type: "core::integer::u256" },
          { name: "remove_upper_hint", type: "core::integer::u256" },
          { name: "remove_lower_hint", type: "core::integer::u256" },
          {
            name: "new_batch_manager",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "add_upper_hint", type: "core::integer::u256" },
          { name: "add_lower_hint", type: "core::integer::u256" },
          { name: "max_upfront_fee", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "impl",
    name: "LiquityBaseImpl",
    interface_name: "bit_usd::dependencies::LiquityBase::ILiquityBase",
  },
  {
    type: "interface",
    name: "bit_usd::dependencies::LiquityBase::ILiquityBase",
    items: [
      {
        type: "function",
        name: "get_entire_branch_coll",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_entire_branch_debt",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "addresses_registry",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::TroveManagerAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_trove_manager_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::GasPoolAddressChanged",
    kind: "struct",
    members: [
      {
        name: "gas_pool_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::CollSurplusPoolAddressChanged",
    kind: "struct",
    members: [
      {
        name: "coll_surplus_pool_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::SortedTrovesAddressChanged",
    kind: "struct",
    members: [
      {
        name: "sorted_troves_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::BitUSDTokenAddressChanged",
    kind: "struct",
    members: [
      {
        name: "bitusd_token_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::ShutDown",
    kind: "struct",
    members: [{ name: "tcr", type: "core::integer::u256", kind: "data" }],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::ActivePoolAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_active_pool_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::DefaultPoolAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_default_pool_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::PriceFeedAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_price_feed_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "ActivePoolAddressChanged",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::ActivePoolAddressChanged",
        kind: "nested",
      },
      {
        name: "DefaultPoolAddressChanged",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::DefaultPoolAddressChanged",
        kind: "nested",
      },
      {
        name: "PriceFeedAddressChanged",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::PriceFeedAddressChanged",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::BorrowerOperations::BorrowerOperations::Event",
    kind: "enum",
    variants: [
      {
        name: "TroveManagerAddressChanged",
        type: "bit_usd::BorrowerOperations::BorrowerOperations::TroveManagerAddressChanged",
        kind: "nested",
      },
      {
        name: "GasPoolAddressChanged",
        type: "bit_usd::BorrowerOperations::BorrowerOperations::GasPoolAddressChanged",
        kind: "nested",
      },
      {
        name: "CollSurplusPoolAddressChanged",
        type: "bit_usd::BorrowerOperations::BorrowerOperations::CollSurplusPoolAddressChanged",
        kind: "nested",
      },
      {
        name: "SortedTrovesAddressChanged",
        type: "bit_usd::BorrowerOperations::BorrowerOperations::SortedTrovesAddressChanged",
        kind: "nested",
      },
      {
        name: "BitUSDTokenAddressChanged",
        type: "bit_usd::BorrowerOperations::BorrowerOperations::BitUSDTokenAddressChanged",
        kind: "nested",
      },
      {
        name: "ShutDown",
        type: "bit_usd::BorrowerOperations::BorrowerOperations::ShutDown",
        kind: "nested",
      },
      {
        name: "LiquityBaseEvent",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::Event",
        kind: "flat",
      },
    ],
  },
] as const satisfies Abi;

export const STABILITY_POOL_ABI = [
  {
    type: "impl",
    name: "StabilityPoolImpl",
    interface_name: "bit_usd::StabilityPool::IStabilityPool",
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "interface",
    name: "bit_usd::StabilityPool::IStabilityPool",
    items: [
      {
        type: "function",
        name: "get_coll_balance",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_total_bitusd_deposits",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_yield_gains_owed",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_yield_gains_pending",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "provide_to_sp",
        inputs: [
          { name: "top_up", type: "core::integer::u256" },
          { name: "do_claim", type: "core::bool" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "withdraw_from_sp",
        inputs: [
          { name: "amount", type: "core::integer::u256" },
          { name: "do_claim", type: "core::bool" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "claim_all_coll_gains",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "trigger_bitusd_rewards",
        inputs: [{ name: "bold_yield", type: "core::integer::u256" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "offset",
        inputs: [
          { name: "debt_to_offset", type: "core::integer::u256" },
          { name: "coll_to_add", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_depositor_coll_gain",
        inputs: [
          {
            name: "depositor",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_depositor_yield_gain",
        inputs: [
          {
            name: "depositor",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_compounded_bitusd_deposit",
        inputs: [
          {
            name: "depositor",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_depositor_yield_gain_with_pending",
        inputs: [
          {
            name: "depositor",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "LiquityBaseImpl",
    interface_name: "bit_usd::dependencies::LiquityBase::ILiquityBase",
  },
  {
    type: "interface",
    name: "bit_usd::dependencies::LiquityBase::ILiquityBase",
    items: [
      {
        type: "function",
        name: "get_entire_branch_coll",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_entire_branch_debt",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "addresses_registry",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::StabilityPoolCollBalanceUpdated",
    kind: "struct",
    members: [
      { name: "new_balance", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::StabilityPoolBitUSDBalanceUpdated",
    kind: "struct",
    members: [
      { name: "new_balance", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::P_Updated",
    kind: "struct",
    members: [{ name: "P", type: "core::integer::u256", kind: "data" }],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::S_Updated",
    kind: "struct",
    members: [
      { name: "S", type: "core::integer::u256", kind: "data" },
      { name: "scale", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::B_Updated",
    kind: "struct",
    members: [
      { name: "B", type: "core::integer::u256", kind: "data" },
      { name: "scale", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::ScaleUpdated",
    kind: "struct",
    members: [
      { name: "current_scale", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::DepositUpdated",
    kind: "struct",
    members: [
      {
        name: "depositor",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      { name: "new_deposit", type: "core::integer::u256", kind: "data" },
      { name: "stashed_coll", type: "core::integer::u256", kind: "data" },
      { name: "snapshot_p", type: "core::integer::u256", kind: "data" },
      { name: "snapshot_s", type: "core::integer::u256", kind: "data" },
      { name: "snapshot_b", type: "core::integer::u256", kind: "data" },
      { name: "snapshot_scale", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "enum",
    name: "bit_usd::StabilityPool::StabilityPool::Operation",
    variants: [
      { name: "provide_to_sp", type: "()" },
      { name: "withdraw_from_sp", type: "()" },
      { name: "claim_all_coll_gains", type: "()" },
    ],
  },
  {
    type: "struct",
    name: "bit_usd::i257::i257",
    members: [
      { name: "abs", type: "core::integer::u256" },
      { name: "is_negative", type: "core::bool" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::DepositOperation",
    kind: "struct",
    members: [
      {
        name: "depositor",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "operation",
        type: "bit_usd::StabilityPool::StabilityPool::Operation",
        kind: "data",
      },
      {
        name: "deposit_loss_since_last_operation",
        type: "core::integer::u256",
        kind: "data",
      },
      {
        name: "top_up_or_withdrawal",
        type: "bit_usd::i257::i257",
        kind: "data",
      },
      {
        name: "yield_gain_since_last_operation",
        type: "core::integer::u256",
        kind: "data",
      },
      { name: "yield_gain_claimed", type: "core::integer::u256", kind: "data" },
      {
        name: "eth_gain_since_last_operation",
        type: "core::integer::u256",
        kind: "data",
      },
      { name: "eth_gain_claimed", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::TroveManagerAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_trove_manager_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::BitUSDTokenAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_bitusd_token_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::ActivePoolAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_active_pool_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::DefaultPoolAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_default_pool_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::PriceFeedAddressChanged",
    kind: "struct",
    members: [
      {
        name: "new_price_feed_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "ActivePoolAddressChanged",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::ActivePoolAddressChanged",
        kind: "nested",
      },
      {
        name: "DefaultPoolAddressChanged",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::DefaultPoolAddressChanged",
        kind: "nested",
      },
      {
        name: "PriceFeedAddressChanged",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::PriceFeedAddressChanged",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "bit_usd::StabilityPool::StabilityPool::Event",
    kind: "enum",
    variants: [
      {
        name: "StabilityPoolCollBalanceUpdated",
        type: "bit_usd::StabilityPool::StabilityPool::StabilityPoolCollBalanceUpdated",
        kind: "nested",
      },
      {
        name: "StabilityPoolBitUSDBalanceUpdated",
        type: "bit_usd::StabilityPool::StabilityPool::StabilityPoolBitUSDBalanceUpdated",
        kind: "nested",
      },
      {
        name: "P_Updated",
        type: "bit_usd::StabilityPool::StabilityPool::P_Updated",
        kind: "nested",
      },
      {
        name: "S_Updated",
        type: "bit_usd::StabilityPool::StabilityPool::S_Updated",
        kind: "nested",
      },
      {
        name: "B_Updated",
        type: "bit_usd::StabilityPool::StabilityPool::B_Updated",
        kind: "nested",
      },
      {
        name: "ScaleUpdated",
        type: "bit_usd::StabilityPool::StabilityPool::ScaleUpdated",
        kind: "nested",
      },
      {
        name: "DepositUpdated",
        type: "bit_usd::StabilityPool::StabilityPool::DepositUpdated",
        kind: "nested",
      },
      {
        name: "DepositOperation",
        type: "bit_usd::StabilityPool::StabilityPool::DepositOperation",
        kind: "nested",
      },
      {
        name: "TroveManagerAddressChanged",
        type: "bit_usd::StabilityPool::StabilityPool::TroveManagerAddressChanged",
        kind: "nested",
      },
      {
        name: "BitUSDTokenAddressChanged",
        type: "bit_usd::StabilityPool::StabilityPool::BitUSDTokenAddressChanged",
        kind: "nested",
      },
      {
        name: "LiquityBaseEvent",
        type: "bit_usd::dependencies::LiquityBase::LiquityBaseComponent::Event",
        kind: "flat",
      },
    ],
  },
] as const satisfies Abi;
