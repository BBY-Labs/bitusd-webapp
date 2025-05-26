import { Button } from "~/components/ui/button";
import { NumericFormat, type NumberFormatValues } from "react-number-format";
import { z } from "zod/v4";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  RefreshCw,
  HelpCircle,
  ArrowDown,
  Check,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import {
  computeBorrowAmountFromLTV,
  computeDebtLimit,
  computeHealthFactor,
  computeLiquidationPrice,
  computeLTVFromBorrowAmount,
  MAX_LIMIT,
  MAX_LTV,
  getAnnualInterestRate,
} from "~/lib/utils/calc";
import type { Route } from "./+types/dashboard";
import { useAccount, useBalance } from "@starknet-react/core";
import {
  INTEREST_RATE_SCALE_DOWN_FACTOR,
  TBTC_ADDRESS,
  TBTC_SYMBOL,
} from "~/lib/constants";
import { useBorrowTransaction } from "~/hooks/use-borrow-transaction";
import { getLtvColor } from "~/lib/utils";
import { getBorrowButtonText } from "~/lib/utils/form";
import { toast } from "sonner";

const createBorrowFormSchema = (
  currentBitcoinPrice: number | undefined,
  currentBitUSDPrice: number | undefined,
  bitcoinBalance: { value: bigint | number; formatted: string } | undefined
) =>
  z
    .object({
      collateralAmount: z
        .number()
        .positive({ message: "Collateral amount must be greater than 0." })
        .optional(),
      borrowAmount: z
        .number()
        .positive({ message: "Borrow amount must be greater than 0." })
        .optional(),
    })
    .refine(
      (data) => {
        // Refinement 1: Ensure collateral is present if borrow amount is entered
        if (data.borrowAmount && data.borrowAmount > 0) {
          return data.collateralAmount && data.collateralAmount > 0;
        }
        return true;
      },
      {
        message:
          "Please enter a valid collateral amount before specifying a borrow amount.",
        path: ["borrowAmount"],
      }
    )
    .refine(
      (data) => {
        // Refinement 2: Check max borrow amount based on collateral, price and Minimum Collateral Ratio
        if (
          data.collateralAmount &&
          data.collateralAmount > 0 &&
          data.borrowAmount &&
          data.borrowAmount > 0 &&
          currentBitcoinPrice &&
          currentBitcoinPrice > 0
        ) {
          const maxBorrowable = computeDebtLimit(
            data.collateralAmount,
            currentBitcoinPrice
          );
          return data.borrowAmount <= maxBorrowable;
        }
        return true; // Pass if not all conditions for this specific check are met
      },
      {
        message: "Not enough collateral to borrow this amount.",
        path: ["borrowAmount"],
      }
    )
    .refine(
      (data) => {
        // Refinement 3: Check minimum borrow amount
        if (
          data.borrowAmount &&
          data.borrowAmount > 0 &&
          currentBitUSDPrice &&
          currentBitUSDPrice > 0
        ) {
          const borrowValue = data.borrowAmount * currentBitUSDPrice;
          if (borrowValue < 2000) {
            return false; // Invalid if borrow value is less than $100
          }
        }
        return true;
      },
      {
        message: "Minimum borrow amount is $2000.",
        path: ["borrowAmount"], // Error associated with the borrow amount field
      }
    )
    .refine(
      (data) => {
        // Refinement 4: Check collateral amount doesn't exceed balance
        if (data.collateralAmount && data.collateralAmount > 0) {
          if (!bitcoinBalance || !bitcoinBalance.value) {
            return false; // No balance available
          }
          return data.collateralAmount <= Number(bitcoinBalance.value) / 1e18;
        }
        return true;
      },
      {
        message: "Insufficient balance.",
        path: ["collateralAmount"],
      }
    );

function Borrow() {
  const [selectedRate, setSelectedRate] = useState("fixed");
  const [selfManagedRate, setSelfManagedRate] = useState(5);
  const [collateralAmount, setCollateralAmount] = useState<number | undefined>(
    undefined
  );
  const [borrowAmount, setBorrowAmount] = useState<number | undefined>(
    undefined
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);

  const trpc = useTRPC();
  const { data: bitcoin, refetch: refetchBitcoin } = useQuery({
    ...trpc.priceRouter.getBitcoinPrice.queryOptions(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const { data: bitUSD, refetch: refetchBitUSD } = useQuery({
    ...trpc.priceRouter.getBitUSDPrice.queryOptions(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const { address } = useAccount();
  const { data: bitcoinBalance } = useBalance({
    token: TBTC_ADDRESS,
    address: address,
    watch: true,
  });

  // Store transaction details for success screen
  const [transactionDetails, setTransactionDetails] = useState<{
    collateralAmount: number;
    borrowAmount: number;
    transactionHash: string;
  } | null>(null);

  // Calculate annual interest rate
  const annualInterestRate = useMemo(() => {
    return getAnnualInterestRate(selectedRate, selfManagedRate);
  }, [selectedRate, selfManagedRate]);

  // Replace the existing useBorrowTransaction with the new hook
  const {
    send,
    isPending,
    isSuccess,
    error,
    isReady,
    isTransactionSuccess,
    isTransactionError,
    transactionError,
    data,
  } = useBorrowTransaction({
    collateralAmount,
    borrowAmount,
    annualInterestRate,
  });

  // Track when transaction is submitted
  if (isPending && !transactionSubmitted) {
    setTransactionSubmitted(true);
  }

  // Auto-updating validation based on all dependencies
  const formErrors = useMemo(() => {
    if (collateralAmount === undefined && borrowAmount === undefined) {
      return null;
    }

    const schema = createBorrowFormSchema(
      bitcoin?.price,
      bitUSD?.price,
      bitcoinBalance
    );
    const validationResult = schema.safeParse({
      collateralAmount,
      borrowAmount,
    });

    return validationResult.success ? null : validationResult.error;
  }, [
    collateralAmount,
    borrowAmount,
    bitcoin?.price,
    bitUSD?.price,
    bitcoinBalance,
  ]);

  // Auto-updating LTV calculation
  const ltvValue = useMemo(() => {
    if (
      collateralAmount &&
      collateralAmount > 0 &&
      borrowAmount !== undefined &&
      bitcoin?.price &&
      bitcoin.price > 0
    ) {
      const ltv =
        borrowAmount > 0
          ? computeLTVFromBorrowAmount(
              borrowAmount,
              collateralAmount,
              bitcoin.price
            )
          : 0;
      return Math.round(ltv * 100);
    }
    return 0;
  }, [collateralAmount, borrowAmount, bitcoin?.price]);

  // Remove the getButtonText function and use the imported one
  const buttonText = useMemo(
    () => getBorrowButtonText(formErrors),
    [formErrors]
  );

  // Handlers
  const handleCollateralChange = (values: NumberFormatValues) => {
    setCollateralAmount(Number(values.value));
  };

  const handleBorrowAmountChange = (values: NumberFormatValues) => {
    setBorrowAmount(Number(values.value));
  };

  const handleLtvSliderChange = (value: number[]) => {
    const intendedLtvPercentage = Math.min(value[0], MAX_LTV * 100);
    const newBorrowAmount = computeBorrowAmountFromLTV(
      intendedLtvPercentage,
      collateralAmount || 0,
      bitcoin?.price || 0
    );
    setBorrowAmount(newBorrowAmount);
  };

  const handlePercentageClick = (
    percentage: number,
    type: "collateral" | "borrow"
  ) => {
    if (type === "collateral") {
      const balance = bitcoinBalance?.value
        ? Number(bitcoinBalance.value) / 1e18
        : 0;
      setCollateralAmount(balance * percentage);
    } else {
      const maxBorrowable = computeDebtLimit(
        collateralAmount || 0,
        bitcoin?.price || 0
      );
      setBorrowAmount(maxBorrowable * percentage);
    }
  };

  // Handle success
  if (isTransactionSuccess && data?.transaction_hash && !showSuccessScreen) {
    toast.success("Transaction Successful! 🎉", {
      description: `Successfully borrowed ${borrowAmount?.toLocaleString()} bitUSD`,
      action: {
        label: "View",
        onClick: () =>
          window.open(
            `https://voyager.online/tx/${data.transaction_hash}`,
            "_blank"
          ),
      },
    });

    setTransactionDetails({
      collateralAmount: collateralAmount || 0,
      borrowAmount: borrowAmount || 0,
      transactionHash: data.transaction_hash,
    });
    setShowSuccessScreen(true);
    setTransactionSubmitted(false); // Reset for next transaction
  }

  // Handle error (including user rejection)
  if (isTransactionError && transactionError && !showSuccessScreen) {
    const errorMessage =
      transactionError.message || "The transaction failed. Please try again.";
    const isUserRejection =
      errorMessage.toLowerCase().includes("reject") ||
      errorMessage.toLowerCase().includes("cancel") ||
      errorMessage.toLowerCase().includes("denied") ||
      errorMessage.toLowerCase().includes("user abort");

    if (isUserRejection) {
      toast.info("Transaction Cancelled", {
        description: "You cancelled the transaction.",
      });
    } else {
      toast.error("Transaction Failed", {
        description: errorMessage,
      });
    }

    setTransactionSubmitted(false); // Reset on error
  }

  const handleBorrowClick = () => {
    if (isReady && !formErrors) {
      send();
    }
  };

  const handleNewBorrow = () => {
    setShowSuccessScreen(false);
    setTransactionSubmitted(false);
    setCollateralAmount(undefined);
    setBorrowAmount(undefined);
    setSelectedRate("fixed");
    setSelfManagedRate(5);
    setTransactionDetails(null);
  };

  // Show loading only when transaction is pending (after wallet approval)
  // If user rejects, isPending becomes false and isTransactionError becomes true
  const shouldShowLoading =
    transactionSubmitted && !showSuccessScreen && !isTransactionError;
  const shouldShowSuccess = showSuccessScreen && transactionDetails;

  // Loading/Success Screen Component
  const TransactionStatusContent = () => {
    if (shouldShowLoading) {
      // Loading state - transaction is approved and pending
      return (
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-800">
                  Processing Transaction
                </h3>
                <p className="text-sm text-slate-600">
                  Your transaction is being confirmed on the blockchain...
                </p>
                {data?.transaction_hash && (
                  <p className="text-xs text-slate-500">
                    Transaction Hash: {data.transaction_hash.slice(0, 10)}...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (shouldShowSuccess) {
      // Success state - same as before
      return (
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-800">
                  Borrow Successful!
                </h3>
                <p className="text-sm text-slate-600">
                  Your position has been created successfully.
                </p>
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Collateral Deposited
                  </span>
                  <span className="font-semibold text-slate-800">
                    <NumericFormat
                      displayType="text"
                      value={transactionDetails.collateralAmount}
                      thousandSeparator=","
                      decimalScale={7}
                      fixedDecimalScale={false}
                    />{" "}
                    {TBTC_SYMBOL}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Amount Borrowed
                  </span>
                  <span className="font-semibold text-slate-800">
                    <NumericFormat
                      displayType="text"
                      value={transactionDetails.borrowAmount}
                      thousandSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                    />{" "}
                    bitUSD
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Interest Rate (APR)
                  </span>
                  <span className="font-semibold text-slate-800">
                    {annualInterestRate / INTEREST_RATE_SCALE_DOWN_FACTOR}%
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col space-y-3">
                <a
                  href={`https://voyager.online/tx/${transactionDetails.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Transaction <ExternalLink className="h-4 w-4" />
                </a>

                <Button
                  onClick={handleNewBorrow}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create New Position
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Original form UI
  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex justify-between items-baseline">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Borrow</h1>
      </div>
      <Separator className="mb-8 bg-slate-200" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel */}
        <div className="md:col-span-2">
          {shouldShowLoading || shouldShowSuccess ? (
            <TransactionStatusContent />
          ) : (
            <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <CardContent className="pt-6 space-y-6">
                {/* Deposit Collateral Section */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 group">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="collateralAmount"
                      className="text-base md:text-lg font-medium text-slate-700"
                    >
                      You deposit
                    </Label>
                    {bitcoinBalance?.value && bitcoinBalance.value > 0 && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                          onClick={() =>
                            handlePercentageClick(0.25, "collateral")
                          }
                        >
                          25%
                        </Button>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                          onClick={() =>
                            handlePercentageClick(0.5, "collateral")
                          }
                        >
                          50%
                        </Button>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                          onClick={() =>
                            handlePercentageClick(0.75, "collateral")
                          }
                        >
                          75%
                        </Button>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors font-medium"
                          onClick={() => handlePercentageClick(1, "collateral")}
                        >
                          Max.
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-grow">
                      <NumericFormat
                        id="collateralAmount"
                        customInput={Input}
                        thousandSeparator=","
                        placeholder="0"
                        inputMode="decimal"
                        allowNegative={false}
                        decimalScale={7}
                        value={collateralAmount}
                        onValueChange={handleCollateralChange}
                        isAllowed={(values) => {
                          const { floatValue } = values;
                          if (floatValue === undefined) return true;
                          return floatValue < MAX_LIMIT;
                        }}
                        className="text-3xl md:text-4xl font-semibold h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none shadow-none tracking-tight text-slate-800"
                      />
                      <NumericFormat
                        className="text-sm text-slate-500 mt-1"
                        displayType="text"
                        value={(bitcoin?.price || 0) * (collateralAmount || 0)}
                        prefix={"≈ $"}
                        thousandSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                      />
                      {formErrors?.issues.map((issue) =>
                        issue.path.includes("collateralAmount") ? (
                          <p
                            key={issue.code + issue.path.join(".")}
                            className="text-xs text-red-500 mt-1"
                          >
                            {issue.message}
                          </p>
                        ) : null
                      )}
                    </div>
                    <div className="text-right">
                      <Select defaultValue="BTC">
                        <SelectTrigger className="w-auto min-w-[120px] rounded-full h-10 pl-2 pr-3 border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors flex items-center">
                          <SelectValue placeholder="Token" />
                        </SelectTrigger>
                        <SelectContent className="border border-slate-200 shadow-md">
                          <SelectItem value="BTC">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-1 rounded-full mr-2">
                                <img
                                  src="/bitcoin.png"
                                  alt="BTC"
                                  className="h-5 w-5 object-cover"
                                />
                              </div>
                              <span className="font-medium">{TBTC_SYMBOL}</span>
                            </div>
                          </SelectItem>
                          {/* <SelectItem value="wBTC">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-1 rounded-full mr-2">
                                <img
                                  src="/bitcoin.png"
                                  alt="wBTC"
                                  className="h-5 w-5 object-cover"
                                />
                              </div>
                              <span className="font-medium">wBTC</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="lBTC">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-1 rounded-full mr-2">
                                <img
                                  src="/bitcoin.png"
                                  alt="lBTC"
                                  className="h-5 w-5 object-cover"
                                />
                              </div>
                              <span className="font-medium">lBTC</span>
                            </div>
                          </SelectItem> */}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-slate-500 mt-1">
                        {bitcoinBalance?.value && bitcoinBalance.value > 0 && (
                          <>
                            Balance:{" "}
                            <NumericFormat
                              displayType="text"
                              value={bitcoinBalance.formatted}
                              thousandSeparator=","
                              decimalScale={3}
                              fixedDecimalScale
                            />{" "}
                            {TBTC_SYMBOL}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative flex justify-center items-center py-3">
                  <div className="w-full h-px bg-slate-200"></div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bg-white rounded-full border border-slate-200 shadow-sm hover:shadow transition-shadow z-10"
                  >
                    <ArrowDown className="h-4 w-4 text-slate-600" />
                  </Button>
                </div>

                {/* Borrow Stablecoin Section */}
                <div className="bg-slate-50 rounded-xl p-4 group">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="borrowAmount"
                      className="text-base md:text-lg font-medium text-slate-700"
                    >
                      You borrow
                    </Label>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out flex items-center space-x-1">
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={() => handlePercentageClick(0.25, "borrow")}
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={() => handlePercentageClick(0.5, "borrow")}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={() => handlePercentageClick(0.75, "borrow")}
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors font-medium"
                        onClick={() => handlePercentageClick(1, "borrow")}
                      >
                        Max.
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between space-x-2 mt-2">
                    <div className="flex-grow">
                      <NumericFormat
                        id="borrowAmount"
                        customInput={Input}
                        thousandSeparator=","
                        placeholder="0"
                        inputMode="decimal"
                        allowNegative={false}
                        decimalScale={7}
                        value={borrowAmount}
                        onValueChange={handleBorrowAmountChange}
                        isAllowed={(values) => {
                          const { floatValue } = values;
                          if (floatValue === undefined) return true;
                          return floatValue < MAX_LIMIT;
                        }}
                        className="text-3xl md:text-4xl font-semibold h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none shadow-none tracking-tight text-slate-800"
                      />
                      <NumericFormat
                        className="text-sm text-slate-500 mt-1"
                        displayType="text"
                        value={(bitUSD?.price || 0) * (borrowAmount || 0)}
                        prefix={"≈ $"}
                        thousandSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                      />
                      {formErrors?.issues.map((issue) =>
                        issue.path.includes("borrowAmount") ? (
                          <p
                            key={issue.code + issue.path.join(".")}
                            className="text-xs text-red-500 mt-1"
                          >
                            {issue.message}
                          </p>
                        ) : null
                      )}
                    </div>
                    <div className="text-right">
                      <div className="w-auto rounded-full h-10 px-4 border border-slate-200 bg-white shadow-sm flex items-center justify-start">
                        <div className="bg-blue-100 p-1 rounded-full mr-2">
                          <img
                            src="/bitusd.png"
                            alt="BTC"
                            className="h-5 w-5 object-cover"
                          />
                        </div>
                        <span className="font-medium">bitUSD</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LTV Slider and Borrow Button */}
                <div className="flex flex-col items-start space-y-4 mt-6">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-700">
                          Loan to Value (LTV)
                        </span>
                        <div className="relative group ml-1">
                          <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded shadow-lg text-xs text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            Ratio of the collateral value to the borrowed value.
                            Higher values mean higher risk.
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            ltvValue <= 25
                              ? "text-green-600"
                              : ltvValue <= 50
                              ? "text-blue-600"
                              : ltvValue <= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {ltvValue}%
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          max. {(MAX_LTV * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      {/* Custom colored track background */}
                      <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full overflow-hidden">
                        {/* Gray background for the entire track */}
                        <div className="absolute left-0 top-0 h-full w-full bg-slate-200"></div>

                        {/* Colored portion based on current value (max 90% of width) */}
                        <div
                          className={`absolute left-0 top-0 h-full ${getLtvColor(
                            ltvValue
                          )} transition-all duration-300`}
                          style={{ width: `${ltvValue * MAX_LTV}%` }}
                        ></div>

                        {/* Forbidden zone (last 20%) */}
                        <div className="absolute left-[80%] top-0 h-full w-[20%] bg-slate-300"></div>
                      </div>

                      {/* Slider component */}
                      <Slider
                        disabled={!collateralAmount || collateralAmount <= 0}
                        value={[ltvValue]}
                        onValueChange={handleLtvSliderChange}
                        max={100}
                        step={1}
                        className="z-10"
                      />
                    </div>
                  </div>

                  <Button
                    disabled={
                      !!formErrors ||
                      !collateralAmount ||
                      !borrowAmount ||
                      borrowAmount <= 0 ||
                      isPending // Disable while transaction is pending
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap"
                    onClick={handleBorrowClick}
                  >
                    {isPending ? "Confirming..." : buttonText}
                  </Button>
                </div>

                {/* Interest Rate Options */}
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-medium text-slate-700">
                    Interest Rate
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Fixed Rate Option */}
                    <div
                      className={`relative ${
                        selectedRate === "fixed"
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                      } rounded-lg p-3 cursor-pointer transition-all min-h-[60px]`}
                      onClick={() => setSelectedRate("fixed")}
                    >
                      {selectedRate === "fixed" && (
                        <>
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 rounded-full p-1">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-8">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center mb-1">
                        <h4 className="text-base font-semibold text-slate-800">
                          Fixed (5%)
                        </h4>
                      </div>
                      <p
                        className={`text-xs text-slate-600 ${
                          selectedRate === "fixed" ? "" : "invisible"
                        }`}
                      >
                        Lock in a stable 5% interest rate for the duration of
                        your loan. Perfect for those who prefer predictable
                        payments.
                      </p>
                    </div>

                    {/* Variable Rate Option */}
                    <div
                      className={`relative ${
                        selectedRate === "variable"
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                      } rounded-lg p-3 cursor-pointer transition-all min-h-[60px]`}
                      onClick={() => setSelectedRate("variable")}
                    >
                      {selectedRate === "variable" && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-blue-500 rounded-full p-1">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center mb-1">
                        <h4 className="text-base font-semibold text-slate-800">
                          Variable (4-6%)
                        </h4>
                      </div>
                      <p
                        className={`text-xs text-slate-600 ${
                          selectedRate === "variable" ? "" : "invisible"
                        }`}
                      >
                        Interest rate adjusts based on market conditions.
                        Currently averaging 4.5%. May offer lower rates than
                        fixed options.
                      </p>
                    </div>

                    {/* Self Managed Option */}
                    <div
                      className={`relative ${
                        selectedRate === "selfManaged"
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                      } rounded-lg p-3 cursor-pointer transition-all min-h-[60px]`}
                      onClick={() => setSelectedRate("selfManaged")}
                    >
                      {selectedRate === "selfManaged" && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-blue-500 rounded-full p-1">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center mb-1">
                        <h4 className="text-base font-semibold text-slate-800">
                          Self Managed ({selfManagedRate}%)
                        </h4>
                      </div>
                      <p
                        className={`text-xs text-slate-600 mb-3 ${
                          selectedRate === "selfManaged" ? "" : "invisible"
                        }`}
                      >
                        Take control of your interest rate by actively managing
                        your position.
                      </p>

                      {/* Interest Rate Slider */}
                      {selectedRate === "selfManaged" && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-slate-700">
                              Interest Rate
                            </span>
                            <span className="text-xs font-bold text-blue-600">
                              {selfManagedRate}%
                            </span>
                          </div>

                          <div className="relative">
                            {/* Custom colored track background */}
                            <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full overflow-hidden">
                              {/* Gray background for the entire track */}
                              <div className="absolute left-0 top-0 h-full w-full bg-slate-200"></div>

                              {/* Colored portion based on current value */}
                              <div
                                className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
                                style={{
                                  width: `${
                                    ((selfManagedRate - 0.5) / 19.5) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>

                            {/* Slider component */}
                            <Slider
                              value={[selfManagedRate]}
                              onValueChange={(value) =>
                                setSelfManagedRate(value[0])
                              }
                              min={0.5}
                              max={20}
                              step={0.1}
                              className="z-10"
                            />
                          </div>

                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0.5%</span>
                            <span>20%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="md:col-span-1 space-y-6">
          {/* Vault Summary Card */}
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-800">
                  Position Summary
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-slate-100 transition-colors"
                  onClick={() => {
                    setIsRefreshing(true);
                    refetchBitcoin();
                    refetchBitUSD();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-slate-600 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                    style={
                      isRefreshing ? { animationDuration: "2s" } : undefined
                    }
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-3">
              {/* Health Factor and Liquidation Price */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center text-slate-700 font-medium">
                    Debt Limit
                    <div className="relative group">
                      <HelpCircle className="h-3 w-3 ml-1 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded shadow-lg text-xs text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        The maximum amount you can borrow.
                      </div>
                    </div>
                  </span>
                  <NumericFormat
                    className="font-medium"
                    displayType="text"
                    value={computeDebtLimit(
                      collateralAmount || 0,
                      bitcoin?.price || 0
                    )}
                    prefix={"$"}
                    thousandSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                  />
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center text-slate-700 font-medium">
                    Health Factor
                    <div className="relative group">
                      <HelpCircle className="h-3 w-3 ml-1 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded shadow-lg text-xs text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        Health factor indicates the safety of your position.
                        Higher is better.
                      </div>
                    </div>
                  </span>
                  <div className="flex items-center justify-between">
                    <NumericFormat
                      className="text-green-600 font-semibold"
                      displayType="text"
                      value={computeHealthFactor(
                        collateralAmount || 0,
                        borrowAmount || 0,
                        bitcoin?.price || 0
                      )}
                      thousandSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center text-slate-700 font-medium">
                    Liquidation Price
                    <div className="relative group">
                      <HelpCircle className="h-3 w-3 ml-1 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded shadow-lg text-xs text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        Your position will be liquidated if the price reaches
                        this level.
                      </div>
                    </div>
                  </span>

                  <NumericFormat
                    className="font-medium"
                    displayType="text"
                    value={computeLiquidationPrice(
                      collateralAmount || 0,
                      borrowAmount || 0,
                      bitUSD?.price || 0
                    )}
                    prefix={"$"}
                    thousandSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                  />
                </div>
              </div>

              <Separator className="bg-slate-200" />
            </CardContent>
            <CardFooter className="pt-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="text-sm font-medium text-slate-600 hover:text-slate-800 py-2">
                    Transaction Details
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {/* Placeholder for transaction details */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gas Fee (est.)</span>
                        <span>$0.001</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Time</span>
                        <span>~2 seconds</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Borrow;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BitUSD" },
    { name: "This is bitUSD", content: "Welcome to bitUSD!" },
  ];
}
