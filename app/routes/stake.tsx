import { Button } from "~/components/ui/button";
import { NumericFormat, type NumberFormatValues } from "react-number-format";
import { z, ZodError } from "zod";
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
import { Separator } from "~/components/ui/separator";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { useAccount } from "@starknet-react/core";
import { MAX_LIMIT } from "~/lib/utils/calc";

// TODO: Define a schema for stake form validation if needed
const createStakeFormSchema = (maxBalance?: number) =>
    z.object({
        stakeAmount: z
            .number()
            .positive({ message: "Stake amount must be greater than 0." })
            .max(maxBalance || Number.POSITIVE_INFINITY, {
                message: "Stake amount cannot exceed your balance.",
            })
            .optional(),
    });

function StakePage() {
    const { address } = useAccount();
    const trpc = useTRPC();

    const [stakeAmount, setStakeAmount] = useState<number | undefined>(undefined);
    const [formErrors, setFormErrors] = useState<ZodError | null>(null);

    // TODO: Replace with actual tRPC query or StarkNet call to fetch interest rate
    const { data: interestRateData } = useQuery({
        queryKey: ["stakeInterestRate"],
        queryFn: async () => ({ rate: 5.0 }), // Placeholder: 5.0% APY
    });
    const currentInterestRate = interestRateData?.rate;

    // TODO: Replace with actual tRPC query or StarkNet call to fetch user's bitUSD balance
    const { data: bitUSDBalanceData } = useQuery({
        queryKey: ["userBitUSDBalance", address],
        queryFn: async () => ({ balance: 1000 }), // Placeholder: 1000 bitUSD
        enabled: !!address,
    });
    const bitUSDBalance = bitUSDBalanceData?.balance;

    // TODO: Fetch bitUSD price if needed to show value, similar to borrow.tsx
    const { data: bitUSDPriceData } = useQuery(
        trpc.priceRouter.getBitUSDPrice.queryOptions() // Assuming this exists
    );
    const bitUSDPrice = bitUSDPriceData?.price || 1; // Default to 1 if not fetched

    const validateAndUpdateFormState = (currentStakeAmount: number | undefined) => {
        const schema = createStakeFormSchema(bitUSDBalance);
        const validationResult = schema.safeParse({
            stakeAmount: currentStakeAmount,
        });

        if (!validationResult.success) {
            setFormErrors(validationResult.error);
        } else {
            setFormErrors(null);
        }
    };

    const handleStakeAmountChange = (values: NumberFormatValues) => {
        const currentNumericStakeAmount = Number(values.value);
        setStakeAmount(currentNumericStakeAmount);
        validateAndUpdateFormState(currentNumericStakeAmount);
    };

    const handleMaxClick = () => {
        if (bitUSDBalance !== undefined) {
            setStakeAmount(bitUSDBalance);
            validateAndUpdateFormState(bitUSDBalance);
        }
    };

    const getButtonText = () => {
        if (formErrors) {
            // You can add more specific error messages if needed
            return "Check Input";
        }
        return "Stake bitUSD";
    };

    // TODO: Implement the actual staking logic
    const handleStakeSubmit = () => {
        if (!formErrors && stakeAmount && stakeAmount > 0) {
            console.log("Staking:", stakeAmount, "bitUSD for address:", address);
            // Here you would call the StarkNet contract function to stake
            // e.g., using starknet-react's useContractWrite or a tRPC mutation that handles it
            alert(`Staking ${stakeAmount} bitUSD (not implemented yet)`);
        }
    };

    return (
        <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="flex justify-between items-baseline">
                <h1 className="text-3xl font-bold mb-2 text-slate-800">
                    Stake your bitUSD
                </h1>
            </div>
            <Separator className="mb-8 bg-slate-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Panel: Staking Input */}
                <div className="md:col-span-2">
                    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="text-slate-700">
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Earn by staking your bitUSD. Current APY:{" "}
                                <span className="font-semibold text-green-600">
                                    {currentInterestRate?.toFixed(2) || "N/A"}%
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 space-y-6">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3 group">
                                {/* Row 1: Label and Balance */}
                                <div className="flex justify-between items-center">
                                    <Label
                                        htmlFor="stakeAmount"
                                        className="text-base md:text-lg font-medium text-slate-700"
                                    >
                                        You stake
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        Balance:{" "}
                                        {bitUSDBalance !== undefined
                                            ? `${bitUSDBalance.toLocaleString()} bitUSD`
                                            : "Loading..."}
                                    </p>
                                </div>

                                {/* Row 2: Input and Token Display */}
                                <div className="flex justify-between items-center space-x-4">
                                    <div className="flex-grow">
                                        <NumericFormat
                                            id="stakeAmount"
                                            customInput={Input}
                                            thousandSeparator=","
                                            placeholder="0"
                                            inputMode="decimal"
                                            allowNegative={false}
                                            decimalScale={7}
                                            value={stakeAmount}
                                            onValueChange={handleStakeAmountChange}
                                            isAllowed={(values) => {
                                                const { floatValue } = values;
                                                if (floatValue === undefined) return true;
                                                return floatValue < MAX_LIMIT;
                                            }}
                                            className="text-3xl md:text-4xl font-semibold h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none shadow-none tracking-tight text-slate-800"
                                        />
                                    </div>
                                    <div className="w-auto rounded-full h-10 px-4 border border-slate-200 bg-white shadow-sm flex items-center justify-start">
                                        <div className="bg-blue-100 p-1 rounded-full mr-2">
                                            <span className="text-blue-600 font-bold text-xs">
                                                $
                                            </span>
                                        </div>
                                        <span className="font-medium">bitUSD</span>
                                    </div>
                                </div>

                                {/* Row 3: Dollar Value and Max Button */}
                                <div className="flex justify-between items-center space-x-4">
                                    <div className="flex-grow"> {/* This div helps push the Max button to the right */}
                                        <NumericFormat
                                            className="text-sm text-slate-500 mt-1"
                                            displayType="text"
                                            value={(bitUSDPrice || 0) * (stakeAmount || 0)}
                                            prefix={"≈ $"}
                                            thousandSeparator=","
                                            decimalScale={2}
                                            fixedDecimalScale
                                        />
                                        {formErrors?.issues.map((issue) =>
                                            issue.path.includes("stakeAmount") ? (
                                                <p
                                                    key={issue.code + issue.path.join(".")}
                                                    className="text-xs text-red-500 mt-1"
                                                >
                                                    {issue.message}
                                                </p>
                                            ) : null
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handleMaxClick}
                                        className="h-6 px-2 text-xs rounded-md bg-white border-slate-200 hover:bg-slate-100 transition-colors font-medium"
                                    >
                                        Max.
                                    </Button>
                                </div>
                            </div>

                            <Button
                                onClick={handleStakeSubmit}
                                disabled={
                                    !!formErrors ||
                                    !stakeAmount ||
                                    stakeAmount <= 0 ||
                                    !address // Ensure user is connected
                                }
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow transition-all text-base"
                            >
                                {getButtonText()}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Summary or Info (Optional) */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
                        <CardHeader>
                            <CardTitle className="text-slate-800">Staking Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-600">Current APY</span>
                                <span className="font-semibold text-green-600">
                                    {currentInterestRate?.toFixed(2) || "N/A"}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-600">Your Staked Amount</span>
                                {/* TODO: Fetch and display current staked amount for the user */}
                                <span className="font-semibold text-slate-800">0 bitUSD</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-600">Claimable</span>
                                {/* TODO: Fetch and display earned rewards */}
                                <span className="font-semibold text-slate-800">0 bitUSD</span>
                            </div>
                            <Separator className="bg-slate-100 my-2" />
                        </CardContent>
                        <CardFooter className="flex flex-col items-stretch pt-4">
                            {/* TODO: Add logic to fetch actual pending rewards */}
                            <Button
                                variant="outline"
                                className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => alert("Claiming rewards (not implemented yet)")}
                            // TODO: Disable if no rewards to claim, e.g. disabled={pendingRewards <= 0}
                            >
                                Claim Pending Rewards
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default StakePage;

// Assuming Route.MetaArgs is defined similarly to borrow.tsx
// You might need to adjust this based on your actual Route type
// import type { Route } from "./+types/dashboard";
// export function meta({}: Route.MetaArgs) {
export function meta() { // Simplified if Route type is not immediately available
    return [
        { title: "Stake bitUSD - BitUSD Protocol" },
        {
            name: "description",
            content: "Stake your bitUSD to earn.",
        },
    ];
}
