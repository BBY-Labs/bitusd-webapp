import { useMemo, useRef } from "react";
import {
  useAccount,
  useContract,
  useSendTransaction,
  type UseSendTransactionResult,
  useTransactionReceipt,
} from "@starknet-react/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  BITUSD_ADDRESS,
  STABILITY_POOL_ABI,
  STABILITY_POOL_ADDRESS,
} from "~/lib/constants";

interface UseStakeTransactionParams {
  stakeAmount?: number;
}

interface UseStakeTransactionResult extends UseSendTransactionResult {
  isReady: boolean;
  isTransactionSuccess: boolean;
  isTransactionError: boolean;
  transactionError: Error | null;
}

export function useStakeTransaction({
  stakeAmount,
}: UseStakeTransactionParams): UseStakeTransactionResult {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const invalidatedRef = useRef<string | null>(null);

  const { contract: bitUSDContract } = useContract({
    abi: [
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
    ] as const,
    address: BITUSD_ADDRESS,
  });

  const { contract: stabilityPoolContract } = useContract({
    abi: STABILITY_POOL_ABI,
    address: STABILITY_POOL_ADDRESS,
  });

  const calls = useMemo(() => {
    if (
      !bitUSDContract ||
      !stabilityPoolContract ||
      !address ||
      !stakeAmount ||
      stakeAmount <= 0
    ) {
      return undefined;
    }

    return [
      // 1. Approve bitUSD spending
      bitUSDContract.populate("approve", [
        STABILITY_POOL_ADDRESS,
        BigInt(Math.floor(stakeAmount * 1e18)),
      ]),
      // 2. Provide to stability pool
      stabilityPoolContract.populate("provide_to_sp", [
        BigInt(Math.floor(stakeAmount * 1e18)), // top_up amount in wei
        false, // do_claim = false
      ]),
    ];
  }, [bitUSDContract, stabilityPoolContract, address, stakeAmount]);

  const transaction = useSendTransaction({ calls });

  // Wait for transaction to be confirmed on blockchain
  const {
    data: receipt,
    isSuccess: isReceiptSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useTransactionReceipt({
    hash: transaction.data?.transaction_hash,
    watch: true,
  });

  // Determine transaction success/error states
  const isTransactionSuccess = isReceiptSuccess && !!receipt;
  const isTransactionError = transaction.isError || isReceiptError;
  const transactionError = transaction.error || receiptError || null;

  // Invalidate once when receipt is successful
  if (
    isTransactionSuccess &&
    receipt &&
    transaction.data?.transaction_hash &&
    invalidatedRef.current !== transaction.data.transaction_hash &&
    address &&
    chainId
  ) {
    invalidatedRef.current = transaction.data.transaction_hash;

    // Invalidate balance queries
    queryClient.invalidateQueries({
      queryKey: ["bitUSDBalance", address],
    });

    // Invalidate staking info queries
    queryClient.invalidateQueries({
      queryKey: ["stakedAmount", address, STABILITY_POOL_ADDRESS],
    });

    queryClient.invalidateQueries({
      queryKey: ["claimableRewards", address, STABILITY_POOL_ADDRESS],
    });
  }

  return {
    ...transaction,
    isReady: !!calls,
    isTransactionSuccess,
    isTransactionError,
    transactionError,
  };
}
