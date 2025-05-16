import { Button } from "~/components/ui/button";
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
import { RefreshCw, HelpCircle, ArrowDown, Info, Check } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { computeDebtLimit } from "~/lib/utils/calc";

function Borrow() {
  const [selectedRate, setSelectedRate] = useState("fixed");
  const [ltvValue, setLtvValue] = useState(60);
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);

  const trpc = useTRPC();
  const { data: bitcoin } = useQuery(
    trpc.testRouter.getBitcoinPrice.queryOptions()
  );
  const { data: bitUSD } = useQuery(
    trpc.testRouter.getBitUSDPrice.queryOptions()
  );
  const { data: ltv } = useQuery(trpc.testRouter.getLTV.queryOptions());

  // Function to determine the color based on LTV value
  const getLtvColor = () => {
    if (ltvValue <= 25) return "bg-green-500";
    if (ltvValue <= 50) return "bg-blue-500";
    if (ltvValue <= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Handler to ensure only numeric input
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setAmount: (amount: number) => void
  ) => {
    const value = e.target.value;
    // Replace any non-numeric characters with empty string
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Update the input value
    e.target.value = numericValue;
    setAmount(Number(numericValue));
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
                    You deposit (test)
                  </Label>
                  <div className="flex items-center space-x-1">
                    {/* TODO: Add logic to use e.g. 25% of balance from wallet */}
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
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex-grow">
                    <Input
                      id="collateralAmount"
                      placeholder="0"
                      pattern="[0-9.]*"
                      inputMode="numeric"
                      onChange={(e) =>
                        handleNumericInput(e, setCollateralAmount)
                      }
                      className="text-3xl md:text-4xl font-semibold h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none shadow-none tracking-tight text-slate-800"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      ≈ ${(bitcoin?.price || 0) * collateralAmount}
                    </p>
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
                            <span className="font-medium">BTC</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="wBTC">
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
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {/* TODO: Fetch balance from wallet */}
                    <p className="text-xs text-slate-500 mt-1">
                      Balance: 0 BTC
                    </p>
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
                    <Input
                      id="borrowAmount"
                      placeholder="0"
                      pattern="[0-9.]*"
                      inputMode="numeric"
                      onChange={(e) => handleNumericInput(e, setBorrowAmount)}
                      className="text-3xl md:text-4xl font-semibold h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none shadow-none tracking-tight text-slate-800"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      ≈ ${(bitUSD?.price || 0) * borrowAmount}
                    </p>
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
                    <p className="text-xs text-slate-500 mt-1">
                      Debt Limit: $
                      {computeDebtLimit(
                        collateralAmount,
                        (ltv?.ltv || 0) / 100,
                        bitcoin?.price || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* LTV Slider and Borrow Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
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
                        max. 80%
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    {/* Custom colored track background */}
                    <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full overflow-hidden">
                      {/* Gray background for the entire track */}
                      <div className="absolute left-0 top-0 h-full w-full bg-slate-200"></div>

                      {/* Colored portion based on current value (max 80% of width) */}
                      <div
                        className={`absolute left-0 top-0 h-full ${getLtvColor()} transition-all duration-300`}
                        style={{ width: `${(ltvValue / 100) * 80}%` }}
                      ></div>

                      {/* Forbidden zone (last 20%) */}
                      <div className="absolute left-[80%] top-0 h-full w-[20%] bg-slate-300"></div>
                    </div>

                    {/* Slider component */}
                    <Slider
                      value={[ltvValue]}
                      onValueChange={(value) => {
                        // Prevent the slider from exceeding 80%
                        setLtvValue(Math.min(value[0], 80));
                      }}
                      max={100}
                      step={1}
                      className="z-10"
                    />
                  </div>
                </div>

                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap">
                  Borrow
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
                    } rounded-lg ${
                      selectedRate === "fixed" ? "p-3" : "py-2 px-3"
                    } cursor-pointer transition-all min-h-[60px]`}
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
                    {selectedRate === "fixed" && (
                      <p className="text-xs text-slate-600">
                        Lock in a stable 5% interest rate for the duration of
                        your loan. Perfect for those who prefer predictable
                        payments.
                      </p>
                    )}
                  </div>

                  {/* Variable Rate Option */}
                  <div
                    className={`relative ${
                      selectedRate === "variable"
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                    } rounded-lg ${
                      selectedRate === "variable" ? "p-3" : "py-2 px-3"
                    } cursor-pointer transition-all min-h-[60px]`}
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
                    {selectedRate === "variable" && (
                      <p className="text-xs text-slate-600">
                        Interest rate adjusts based on market conditions.
                        Currently averaging 4.5%. May offer lower rates than
                        fixed options.
                      </p>
                    )}
                  </div>

                  {/* Self Managed Option */}
                  <div
                    className={`relative ${
                      selectedRate === "selfManaged"
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                    } rounded-lg ${
                      selectedRate === "selfManaged" ? "p-3" : "py-2 px-3"
                    } cursor-pointer transition-all min-h-[60px]`}
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
                    {selectedRate === "selfManaged" && (
                      <p className="text-xs text-slate-600">
                        Take control of your interest rate by actively managing
                        your position.
                      </p>
                    )}
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
                <CardTitle className="text-slate-800">Vault Summary</CardTitle>
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
              {/* Vault Collateral and Debt */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">
                    Vault Collateral
                  </span>
                  <span className="text-right font-medium">
                    0 → 10 BTC - $28.75k
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">Vault Debt</span>
                  <span className="text-right font-medium">
                    0 → 4,000 bitUSD - $4.56k
                  </span>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Health Factor and Liquidation Price */}
              <div className="space-y-3">
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
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-green-600 font-semibold">
                      ∞ → 5.02
                    </span>
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
                  <span className="font-medium">- → 1 BTC = 619.5 USD</span>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Balance Information */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">
                    bitUSD Balance
                  </span>
                  <span className="font-medium">0 → 4,000 bitUSD - $4.56k</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">
                    BTC Balance
                  </span>
                  <span className="font-medium">0 → -10 BTC</span>
                </div>
              </div>
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
                        <span>0.0012 ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Time</span>
                        <span>~30 seconds</span>
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
