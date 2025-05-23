import { Button } from "~/components/ui/button";
import { NumericFormat, type NumberFormatValues } from "react-number-format";
import { z, ZodError } from "zod/v4";
import {
  Card,
  CardContent,
  CardDescription,
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
import { RefreshCw, HelpCircle, ArrowDown, Check } from "lucide-react";
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
} from "~/lib/utils/calc";
import type { Route } from "./+types/dashboard";
import { useAccount, useBalance } from "@starknet-react/core";
import { TBTC_ADDRESS, TBTC_SYMBOL } from "~/lib/constants";

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
          if (borrowValue < 100) {
            return false; // Invalid if borrow value is less than $100
          }
        }
        return true;
      },
      {
        message: "Minimum borrow amount is $100.",
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
  const [collateralAmount, setCollateralAmount] = useState<number | undefined>(
    undefined
  );
  const [borrowAmount, setBorrowAmount] = useState<number | undefined>(
    undefined
  );

  const trpc = useTRPC();
  const { data: bitcoin } = useQuery(
    trpc.priceRouter.getBitcoinPrice.queryOptions()
  );
  const { data: bitUSD } = useQuery(
    trpc.priceRouter.getBitUSDPrice.queryOptions()
  );

  const { address } = useAccount();

  const { data: bitcoinBalance } = useBalance({
    token: TBTC_ADDRESS,
    address: address,
  });

  const { data: bitUSDBalance } = useBalance({
    address:
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  });

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

  // Function to determine the color based on LTV value
  const getLtvColor = () => {
    if (ltvValue <= 25) return "bg-green-500";
    if (ltvValue <= 50) return "bg-blue-500";
    if (ltvValue <= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

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

  const handlePercentageClick = (percentage: number) => {
    const balance = bitcoinBalance?.value
      ? Number(bitcoinBalance.value) / 1e18
      : 0;
    setCollateralAmount(balance * percentage);
  };

  const getButtonText = () => {
    if (formErrors) {
      const isCollateralTooSmallErrorPresent = formErrors.issues.some(
        (issue) =>
          issue.path.includes("borrowAmount") &&
          issue.message === "Minimum borrow amount is $100."
      );
      if (isCollateralTooSmallErrorPresent) {
        return "Borrow amount is too small";
      }
      // TODO: Add logic to check if collateral balance in wallet is too low
      // if (isCollateralBalanceTooLow) {
      //   return "Insufficient collateral balance";
      // }
    }

    return "Borrow";
  };

  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex justify-between items-baseline">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Borrow</h1>
      </div>
      <Separator className="mb-8 bg-slate-200" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel */}
        <div className="md:col-span-2">
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
                        onClick={() => handlePercentageClick(0.25)}
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={() => handlePercentageClick(0.5)}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={() => handlePercentageClick(0.75)}
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors font-medium"
                        onClick={() => handlePercentageClick(1)}
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
                    <NumericFormat
                      className="text-xs text-slate-500 mt-1"
                      displayType="text"
                      value={
                        bitcoinBalance?.value && bitcoinBalance.value > 0
                          ? `Balance: ${bitcoinBalance?.formatted} ${TBTC_SYMBOL}`
                          : ""
                      }
                      thousandSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                    />
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
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors font-medium"
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
                        <span className="text-blue-600 font-bold text-xs">
                          $
                        </span>
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
                        className={`absolute left-0 top-0 h-full ${getLtvColor()} transition-all duration-300`}
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
                    borrowAmount <= 0
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap"
                >
                  {getButtonText()}
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
                      Lock in a stable 5% interest rate for the duration of your
                      loan. Perfect for those who prefer predictable payments.
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
                      Currently averaging 4.5%. May offer lower rates than fixed
                      options.
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
                        Self Managed
                      </h4>
                    </div>
                    <p
                      className={`text-xs text-slate-600 ${
                        selectedRate === "selfManaged" ? "" : "invisible"
                      }`}
                    >
                      Take control of your interest rate by actively managing
                      your position.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
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
