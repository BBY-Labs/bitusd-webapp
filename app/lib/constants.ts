import type { Abi } from "starknet";

export const TBTC_ADDRESS =
  "0x01bf229c1217853883088ac3be9230f93688e5d64617bf439a480a4241a205da";

export const TBTC_DECIMALS = 18;

export const TBTC_SYMBOL = "TBTC";

export const TBTC_NAME = "Testnet Bitcoin";

export const TBTC_ABI = [
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
