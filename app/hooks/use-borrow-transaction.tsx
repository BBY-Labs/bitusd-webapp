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
  TBTC_ABI,
  TBTC_ADDRESS,
  BORROWER_OPERATIONS_ABI,
  BORROWER_OPERATIONS_ADDRESS,
  TM_ADDRESS,
} from "~/lib/constants";
import { useOwnerPositions } from "./use-owner-positions";

interface UseBorrowTransactionParams {
  collateralAmount?: number;
  borrowAmount?: number;
  annualInterestRate: bigint;
}

interface UseBorrowTransactionResult extends UseSendTransactionResult {
  isReady: boolean;
  isTransactionSuccess: boolean;
  isTransactionError: boolean;
  transactionError: Error | null;
}

export function useBorrowTransaction({
  collateralAmount,
  borrowAmount,
  annualInterestRate,
}: UseBorrowTransactionParams): UseBorrowTransactionResult {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { ownerIndex, isLoadingOwnerPositions } = useOwnerPositions();
  const invalidatedRef = useRef<string | null>(null);

  const { contract: tbtcContract } = useContract({
    abi: TBTC_ABI,
    address: TBTC_ADDRESS,
  });

  const { contract: borrowerContract } = useContract({
    abi: BORROWER_OPERATIONS_ABI,
    address: BORROWER_OPERATIONS_ADDRESS,
  });

  const calls = useMemo(() => {
    if (
      !tbtcContract ||
      !borrowerContract ||
      !address ||
      !collateralAmount ||
      !borrowAmount ||
      isLoadingOwnerPositions ||
      ownerIndex === undefined
    ) {
      return undefined;
    }

    return [
      // 1. Approve TBTC spending
      tbtcContract.populate("approve", [
        BORROWER_OPERATIONS_ADDRESS,
        BigInt(Math.floor(collateralAmount * 1e18)),
      ]),
      // 2. Open trove
      borrowerContract.populate("open_trove", [
        address, // owner
        ownerIndex, // owner_index (DYNAMICALLY SET)
        BigInt(Math.floor(collateralAmount * 1e18)), // coll_amount in wei
        BigInt(Math.floor(borrowAmount * 1e18)), // bitusd_amount in wei
        0n, // upper_hint
        0n, // lower_hint
        annualInterestRate, // annual_interest_rate
        BigInt(2) ** BigInt(256) - BigInt(1), // max_upfront_fee (1 token max)
        "0x0", // add_manager (none)
        "0x0", // remove_manager (none)
        "0x0", // receiver (none)
      ]),
    ];
  }, [
    tbtcContract,
    borrowerContract,
    address,
    collateralAmount,
    borrowAmount,
    isLoadingOwnerPositions,
    ownerIndex,
    annualInterestRate,
  ]);

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
    address && // Ensure address is defined
    chainId // Ensure chainId is defined
  ) {
    invalidatedRef.current = transaction.data.transaction_hash;
    queryClient.invalidateQueries({
      queryKey: ["ownerPositions", address, TM_ADDRESS],
    });
    queryClient.invalidateQueries({
      queryKey: [
        {
          entity: "balance",
          chainId: chainId,
          token: TBTC_ADDRESS,
          address: address,
          blockIdentifier: "latest",
        },
      ],
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
