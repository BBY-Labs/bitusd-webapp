import { useAccount } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { NumericFormat, type NumberFormatValues } from "react-number-format";
import { Button } from "~/components/ui/button";
import { ChevronsUpDown, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // We'll control opening manually
} from "~/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
// TODO: Import calculation functions from "~/lib/utils/calc" if needed for summary
// import { computeHealthFactor, computeLiquidationPrice, computeDebtLimit } from "~/lib/utils/calc";

import { Contract } from "starknet";
import {
  TM_ADDRESS,
  TROVE_MANAGER_ABI,
  TBTC_DECIMALS,
  TBTC_SYMBOL,
} from "~/lib/constants";

// Placeholder constants for calculations - these should ideally come from a config or Oracle
const BTC_PRICE_USD = 40000; // Placeholder: Current price of 1 BTC in USD
const BITUSD_DECIMALS = 18; // Placeholder: Decimals for bitUSD token
const MCR_VALUE = 1.1; // Minimum Collateral Ratio (e.g., 110%)
const ICR_VALUE = 1.5; // Initial Collateral Ratio for debt limit (e.g., 150% -> max LTV 1/1.5 = 66.67%)
const INTEREST_RATE_SCALE_DOWN_FACTOR = 10n ** 16n; // Assuming rate X% is stored as X * 10^16

interface RawLatestTroveData {
  entire_debt: bigint;
  entire_coll: bigint;
  // redist_bit_usd_debt_gain: bigint; // Not used in current Position interface
  // redist_coll_gain: bigint; // Not used
  // accrued_interest: bigint; // Not used
  // recorded_debt: bigint; // Not used
  annual_interest_rate: bigint;
  // weighted_recorded_debt: bigint; // Not used
  // accrued_batch_management_fee: bigint; // Not used
  // last_interest_rate_adj_time: bigint; // Not used
  // Add other fields if they become available and needed
}

interface Position {
  id: string;
  collateralAsset: string;
  collateralAmount: number;
  collateralValue: number;
  borrowedAsset: string;
  borrowedAmount: number;
  healthFactor: number;
  liquidationPrice: number;
  debtLimit: number;
  interestRate: number;
}

type SortableKey = keyof Omit<Position, "id" | "collateralAsset" | "borrowedAsset" | "debtLimit"> | "amountBorrowable";

interface SortConfig {
  key: SortableKey;
  direction: "ascending" | "descending";
}

const getHealthFactorDisplay = (hf: number) => {
  if (hf >= 2.5) return { text: "Excellent", color: "text-green-600" };
  if (hf >= 1.75) return { text: "Good", color: "text-blue-600" };
  if (hf >= 1.25) return { text: "Fair", color: "text-yellow-600" };
  return { text: "Poor", color: "text-red-600" };
};

const formatBigIntToNumber = (value: bigint, decimals: number): number => {
  // Simplified conversion. For production, consider using a robust BigNumber library
  // or string manipulation to avoid precision loss with very large u256 values.
  if (decimals === 0) return Number(value);
  const factor = Math.pow(10, decimals);
  // Dividing BigInt by a number factor; convert BigInt to Number first.
  // This can lose precision if 'value' is larger than Number.MAX_SAFE_INTEGER.
  return Number(value.toString()) / factor;
};

const formatInterestRateForDisplay = (rawValue: bigint): number => {
  // Assuming annual_interest_rate is stored as (Percentage * 10^16)
  // e.g., 5.5% is 55000000000000000
  return Number(rawValue) / Number(INTEREST_RATE_SCALE_DOWN_FACTOR);
};

function PositionsPage() {
  const { address, account } = useAccount();

  const { data: positionsData, isLoading: isLoadingPositions, isError: isErrorPositions } = useQuery<
    Position[]
  >({
    queryKey: ["userOnChainPositions", address],
    queryFn: async () => {
      console.log("queryFn started. Address:", address, "Account connected:", !!account);
      if (!address || !account) {
        console.log("Address or account not available, returning empty array.");
        return [];
      }

      const troveManagerContract = new Contract(
        TROVE_MANAGER_ABI,
        TM_ADDRESS,
        account // Use account directly as the provider
      );

      try {
        console.log("Fetching owner positions for address:", address);
        // 1. Get all trove IDs for the owner
        // The ABI for get_owner_to_positions indicates it returns Array<core::integer::u256>
        // StarkNet.js typically deserializes this to bigint[]
        const ownerPositionsResult = (await troveManagerContract.get_owner_to_positions(
          address
        )) as bigint[];
        console.log("ownerPositionsResult:", ownerPositionsResult);

        if (!ownerPositionsResult || ownerPositionsResult.length === 0) {
          console.log("No trove IDs found for owner or result is empty.");
          return [];
        }
        const troveIds: bigint[] = Array.isArray(ownerPositionsResult) ? ownerPositionsResult : [];
        console.log("Parsed troveIds:", troveIds);

        if (troveIds.length === 0) {
          console.log("troveIds array is empty after parsing.");
          return [];
        }

        // 2. For each trove ID, get its latest data
        console.log(`Fetching latest trove data for ${troveIds.length} trove(s).`);
        const positionPromises = troveIds.map(async (troveId) => {
          console.log("Fetching data for troveId:", troveId.toString());
          // The ABI for get_latest_trove_data indicates it returns LatestTroveData struct
          // StarkNet.js typically deserializes this to an object with bigint fields
          const latestTroveData = (await troveManagerContract.get_latest_trove_data(
            troveId
          )) as RawLatestTroveData; // Assuming the structure provided
          console.log("latestTroveData for troveId", troveId.toString(), ":", latestTroveData);

          if (!latestTroveData || typeof latestTroveData.entire_coll === 'undefined' || typeof latestTroveData.entire_debt === 'undefined') {
            console.warn("Incomplete or undefined latestTroveData for troveId:", troveId.toString(), latestTroveData);
            return null; // Return null if data is incomplete, will be filtered out
          }

          const collateralAmount = formatBigIntToNumber(latestTroveData.entire_coll, TBTC_DECIMALS);
          const borrowedAmount = formatBigIntToNumber(latestTroveData.entire_debt, BITUSD_DECIMALS);
          const collateralValue = collateralAmount * BTC_PRICE_USD;

          let healthFactor = Infinity;
          if (borrowedAmount > 0) {
            healthFactor = (collateralValue / borrowedAmount) / MCR_VALUE;
          }

          let liquidationPrice = 0;
          if (collateralAmount > 0) {
            liquidationPrice = (borrowedAmount * MCR_VALUE) / collateralAmount;
          }

          const debtLimit = collateralValue / ICR_VALUE;
          const interestRate = formatInterestRateForDisplay(latestTroveData.annual_interest_rate);

          const position = {
            id: troveId.toString(),
            collateralAsset: TBTC_SYMBOL,
            collateralAmount,
            collateralValue,
            borrowedAsset: "bitUSD", // Assuming borrowed asset is always bitUSD
            borrowedAmount,
            healthFactor,
            liquidationPrice,
            debtLimit,
            interestRate,
          };
          console.log("Processed position for troveId", troveId.toString(), ":", position);
          return position;
        });

        const resolvedPositions = await Promise.all(positionPromises);
        console.log("Resolved positions (before filter):", resolvedPositions);

        const filteredPositions = resolvedPositions.filter(p => p !== null) as Position[];
        console.log("Filtered positions (after filter):", filteredPositions);
        return filteredPositions;

      } catch (error) {
        console.error("Error fetching user positions inside queryFn:", error);
        // Consider re-throwing or returning an empty array to let react-query handle error state
        throw error; // Or return [] and rely on isErrorPositions
      }
    },
    enabled: !!address && !!account, // Only run query if address and account are available
    // Placeholder data removed
  });

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number | undefined>(undefined);
  // TODO: Add state for 'borrow more' amount if implementing that part fully

  const positionsToDisplay = useMemo(() => positionsData || [], [positionsData]);

  const sortedPositions = useMemo(() => {
    let sortableItems = [...positionsToDisplay];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: number;
        let bValue: number;
        if (sortConfig.key === "amountBorrowable") {
          aValue = a.debtLimit - a.borrowedAmount;
          bValue = b.debtLimit - b.borrowedAmount;
        } else {
          const key = sortConfig.key as keyof Position;
          if (typeof a[key] === 'number' && typeof b[key] === 'number') {
            aValue = a[key] as number;
            bValue = b[key] as number;
          } else { return 0; }
        }
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [positionsToDisplay, sortConfig]);

  const totals = useMemo(() => {
    let totalBorrowed = 0;
    let totalWeightedInterestProduct = 0;
    const result = positionsToDisplay.reduce(
      (acc, p) => {
        acc.borrowedAmount += p.borrowedAmount;
        acc.collateralValue += p.collateralValue;
        acc.amountBorrowable += (p.debtLimit - p.borrowedAmount);
        totalBorrowed += p.borrowedAmount;
        totalWeightedInterestProduct += p.borrowedAmount * p.interestRate;
        return acc;
      },
      { borrowedAmount: 0, collateralValue: 0, amountBorrowable: 0 }
    );
    const weightedAverageInterest = totalBorrowed > 0 ? totalWeightedInterestProduct / totalBorrowed : 0;
    return { ...result, weightedAverageInterest };
  }, [positionsToDisplay]);

  const requestSort = (key: SortableKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortConfig.direction === "ascending" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const renderHeader = (label: string, key?: SortableKey) => (
    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
      {key ? (
        <Button variant="ghost" onClick={() => requestSort(key)} className="px-1 py-1 h-auto hover:bg-slate-200 text-xs">
          {label}
          {getSortIcon(key)}
        </Button>
      ) : (
        <span>{label}</span>
      )}
    </th>
  );

  const handleManageClick = (position: Position) => {
    setSelectedPosition(position);
    setRepayAmount(undefined); // Reset repay amount each time modal opens
    setIsManageModalOpen(true);
  };

  const handleRepayAmountChange = (values: NumberFormatValues) => {
    setRepayAmount(values.floatValue); // Use floatValue for better precision
  };

  const handleRepayMax = () => {
    if (selectedPosition) {
      setRepayAmount(selectedPosition.borrowedAmount);
    }
  };

  const handleRepaySubmit = () => {
    // TODO: Implement actual repay/close transaction logic
    if (!selectedPosition || repayAmount === undefined) return;
    alert(`Repaying ${repayAmount} ${selectedPosition.borrowedAsset} for position ${selectedPosition.id}. (Not implemented)`);
    if (repayAmount === selectedPosition.borrowedAmount) {
      alert(`Closing position ${selectedPosition.id}. (Not implemented)`);
    }
    setIsManageModalOpen(false); // Close modal on submit for now
  };

  const isFullRepayment = selectedPosition && repayAmount === selectedPosition.borrowedAmount && selectedPosition.borrowedAmount > 0;


  return (
    <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Your Positions</h1>
      <Separator className="mb-6 bg-slate-200" />

      {isLoadingPositions && <p className="text-center text-slate-600 py-10">Loading positions...</p>}
      {isErrorPositions && <p className="text-center text-red-600 py-10">Error loading positions. Please try again later.</p>}

      {!isLoadingPositions && !isErrorPositions && (!sortedPositions || sortedPositions.length === 0) && (
        <Card className="border border-slate-200 shadow-sm mt-6">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">You have no open positions.</p>
          </CardContent>
        </Card>
      )}

      {!isLoadingPositions && !isErrorPositions && sortedPositions && sortedPositions.length > 0 && (
        <>
          <div className="overflow-x-auto shadow border-b border-slate-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {renderHeader("Collateral", "collateralAmount")}
                  {renderHeader("Collateral Value ($)", "collateralValue")}
                  {renderHeader("Borrowed (bitUSD)", "borrowedAmount")}
                  {renderHeader("Borrowable ($)", "amountBorrowable")}
                  {renderHeader("Health Factor", "healthFactor")}
                  {renderHeader("Liq. Price ($)", "liquidationPrice")}
                  {renderHeader("Interest Rate (%)", "interestRate")}
                  {renderHeader("Actions")} {/* Actions column */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {sortedPositions.map((position) => {
                  const amountBorrowable = position.debtLimit - position.borrowedAmount;
                  const healthDisplay = getHealthFactorDisplay(position.healthFactor);
                  return (
                    <tr key={position.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-slate-800">
                        <NumericFormat value={position.collateralAmount} displayType="text" thousandSeparator="," decimalScale={4} />
                        {" "}{position.collateralAsset}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-slate-600">
                        <NumericFormat value={position.collateralValue} displayType="text" thousandSeparator="," decimalScale={2} fixedDecimalScale />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-slate-600">
                        <NumericFormat value={position.borrowedAmount} displayType="text" thousandSeparator="," decimalScale={2} fixedDecimalScale />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-slate-600">
                        <NumericFormat value={amountBorrowable > 0 ? amountBorrowable : 0} displayType="text" thousandSeparator="," decimalScale={2} fixedDecimalScale />
                      </td>
                      <td className={`px-2 py-3 whitespace-nowrap text-sm font-semibold ${healthDisplay.color}`}>
                        {position.healthFactor.toFixed(2)} <span className="font-normal text-xs">({healthDisplay.text})</span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-slate-600">
                        <NumericFormat value={position.liquidationPrice} displayType="text" thousandSeparator="," decimalScale={2} fixedDecimalScale />
                        {" "}/ {position.collateralAsset}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-slate-600">
                        <NumericFormat value={position.interestRate} displayType="text" suffix="%" decimalScale={2} fixedDecimalScale />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-slate-600">
                        <Button variant="outline" size="sm" onClick={() => handleManageClick(position)}>Manage</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                <tr>
                  <td className="px-2 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Totals</td>
                  <td className="px-2 py-3 text-left text-sm font-semibold text-slate-700"><NumericFormat value={totals.collateralValue} displayType="text" prefix="$" thousandSeparator="," decimalScale={2} fixedDecimalScale /></td>
                  <td className="px-2 py-3 text-left text-sm font-semibold text-slate-700"><NumericFormat value={totals.borrowedAmount} displayType="text" thousandSeparator="," decimalScale={2} fixedDecimalScale /> bitUSD</td>
                  <td className="px-2 py-3 text-left text-sm font-semibold text-slate-700"><NumericFormat value={totals.amountBorrowable} displayType="text" prefix="$" thousandSeparator="," decimalScale={2} fixedDecimalScale /></td>
                  <td className="px-2 py-3"></td>
                  <td className="px-2 py-3"></td>
                  <td className="px-2 py-3 text-left text-sm font-semibold text-slate-700">
                    <div className="relative group flex items-center">
                      <NumericFormat value={totals.weightedAverageInterest} displayType="text" suffix="%" decimalScale={2} fixedDecimalScale />
                      <HelpCircle className="h-3 w-3 ml-1 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 p-2 bg-slate-800 text-white rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">Weighted average interest rate based on borrowed amount.</div>
                    </div>
                  </td>
                  <td className="px-2 py-3"></td> {/* Cell for Actions column in footer */}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {selectedPosition && (
        <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
          <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl"> {/* Wider modal */}
            <DialogHeader>
              <DialogTitle>Manage Position: {selectedPosition.collateralAsset} / {selectedPosition.borrowedAsset} (ID: {selectedPosition.id})</DialogTitle>
              <DialogDescription>
                Current Borrowed: <NumericFormat value={selectedPosition.borrowedAmount} displayType="text" thousandSeparator decimalScale={2} /> {selectedPosition.borrowedAsset}
                {' '} | Collateral: <NumericFormat value={selectedPosition.collateralAmount} displayType="text" thousandSeparator decimalScale={4} /> {selectedPosition.collateralAsset}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="repay" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="repay">Repay</TabsTrigger>
                <TabsTrigger value="borrow">Borrow More</TabsTrigger>
              </TabsList>
              <TabsContent value="repay" className="py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="repayAmount" className="text-base font-medium">Repay Amount ({selectedPosition.borrowedAsset})</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <NumericFormat
                        id="repayAmount"
                        customInput={Input}
                        placeholder="0"
                        value={repayAmount}
                        onValueChange={handleRepayAmountChange}
                        thousandSeparator
                        decimalScale={2}
                        allowNegative={false}
                        className="flex-grow"
                      />
                      <Button variant="outline" onClick={handleRepayMax}>Max</Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleRepaySubmit}
                    className="w-full"
                    disabled={
                      !selectedPosition ||
                      repayAmount === undefined ||
                      repayAmount <= 0 ||
                      repayAmount > selectedPosition.borrowedAmount
                    }
                  >
                    {isFullRepayment ? "Close Position" : "Repay"}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="borrow" className="py-4">
                <p className="text-sm text-slate-600 mb-2">Adjust your position by borrowing more {selectedPosition.borrowedAsset}.</p>
                {/* Placeholder for Borrow More UI - to be styled like borrow.tsx */}
                <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                  <div>
                    <Label className="text-base font-medium">Collateral Deposited ({selectedPosition.collateralAsset})</Label>
                    <Input disabled value={selectedPosition.collateralAmount.toLocaleString()} className="mt-1 bg-slate-100" />
                    <p className="text-xs text-slate-500 mt-1">Current collateral is fixed for this operation.</p>
                  </div>
                  <div>
                    <Label htmlFor="additionalBorrowAmount" className="text-base font-medium">Additional Borrow Amount ({selectedPosition.borrowedAsset})</Label>
                    <Input id="additionalBorrowAmount" type="number" placeholder="0" className="mt-1" />
                    {/* TODO: Add LTV slider, pre-set to current, updating with additional borrow */}
                    <p className="text-xs text-slate-500 mt-1">LTV sliders and calculations will be updated based on the new total borrowed amount. (UI/Logic TODO)</p>
                  </div>
                  <Button className="w-full" disabled>Borrow More (UI TODO)</Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Placeholder for Position Summary - to be styled like borrow.tsx */}
            <div className="mt-6 p-4 border rounded-md bg-slate-50">
              <h3 className="text-lg font-semibold mb-2 text-slate-700">Position Summary (Dynamic TODO)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>Current Health Factor: <NumericFormat value={selectedPosition.healthFactor} displayType="text" decimalScale={2} /></p>
                <p>Liquidation Price: <NumericFormat value={selectedPosition.liquidationPrice} displayType="text" prefix="$" decimalScale={2} /></p>
                <p>Debt Limit: <NumericFormat value={selectedPosition.debtLimit} displayType="text" prefix="$" decimalScale={2} /></p>
                {/* TODO: These values should update based on repay/borrow more inputs */}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsManageModalOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PositionsPage;

export function meta() {
  return [
    { title: "Your Positions - BitUSD Protocol" },
    {
      name: "description",
      content: "View, sort, and manage your open positions on BitUSD Protocol.",
    },
  ];
}
