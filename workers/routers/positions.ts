import { z } from "zod/v4";
import { publicProcedure, router } from "../trpc";
import { Contract, RpcProvider } from "starknet";
import {
  TM_ADDRESS,
  TROVE_MANAGER_ABI,
  TBTC_DECIMALS,
  TBTC_SYMBOL,
} from "~/lib/constants";
import { getBitcoinprice } from "workers/services/utils";

const BITUSD_DECIMALS = 18;
const MCR_VALUE = 1.1;
const CCR_VALUE = 1.5;
const INTEREST_RATE_SCALE_DOWN_FACTOR = 10n ** 16n;

export interface Position {
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

const formatBigIntToNumber = (value: bigint, decimals: number): number => {
  if (decimals === 0) return Number(value);
  const factor = Math.pow(10, decimals);
  return Number(value.toString()) / factor;
};

const formatInterestRateForDisplay = (rawValue: bigint): number => {
  return Number(rawValue) / Number(INTEREST_RATE_SCALE_DOWN_FACTOR);
};

export const positionsRouter = router({
  getUserOnChainPositions: publicProcedure
    .input(
      z.object({
        userAddress: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userAddress } = input;

      console.log("Fetching owner positions for address:", userAddress);

      if (!process.env.NODE_URL) {
        console.error("NODE_URL environment variable is not defined");
        throw new Error("RPC node URL not configured");
      }

      const myProvider = new RpcProvider({
        nodeUrl: process.env.NODE_URL,
      });

      const troveManagerContract = new Contract(
        TROVE_MANAGER_ABI,
        TM_ADDRESS,
        myProvider
      );

      try {
        const ownerPositionsResult =
          await troveManagerContract.get_owner_to_positions(userAddress);

        console.log("Raw contract response:", ownerPositionsResult);

        let troveIds: bigint[] = [];

        if (
          ownerPositionsResult === undefined ||
          ownerPositionsResult === null
        ) {
          console.log("No positions found for user:", userAddress);
          return { positions: [] as Position[] };
        }

        if (Array.isArray(ownerPositionsResult)) {
          troveIds = ownerPositionsResult;
        } else if (
          ownerPositionsResult &&
          typeof ownerPositionsResult === "object"
        ) {
          const possibleArrayKeys = ["result", "data", "0", "positions"];
          for (const key of possibleArrayKeys) {
            if (
              key in ownerPositionsResult &&
              Array.isArray(ownerPositionsResult[key])
            ) {
              troveIds = ownerPositionsResult[key];
              break;
            }
          }
        }

        if (!Array.isArray(troveIds) || troveIds.length === 0) {
          return { positions: [] as Position[] };
        }

        const positionPromises = troveIds.map(async (troveId: bigint) => {
          const latestTroveData =
            await troveManagerContract.get_latest_trove_data(troveId);

          if (
            !latestTroveData ||
            typeof latestTroveData.entire_coll === "undefined" ||
            typeof latestTroveData.entire_debt === "undefined"
          ) {
            console.warn(
              "Incomplete or undefined latestTroveData for troveId:",
              troveId.toString()
            );
            return null;
          }

          const collateralAmount = formatBigIntToNumber(
            latestTroveData.entire_coll as bigint,
            TBTC_DECIMALS
          );
          const borrowedAmount = formatBigIntToNumber(
            latestTroveData.entire_debt as bigint,
            BITUSD_DECIMALS
          );
          const bitcoinPrice = await getBitcoinprice();

          const collateralValue =
            collateralAmount * (Number(bitcoinPrice) / 1e18);

          let healthFactor = Infinity;
          if (borrowedAmount > 0) {
            healthFactor = collateralValue / borrowedAmount / MCR_VALUE;
          }

          let liquidationPrice = 0;
          if (collateralAmount > 0) {
            liquidationPrice = (borrowedAmount * MCR_VALUE) / collateralAmount;
          }

          const debtLimit = collateralValue / CCR_VALUE;
          const interestRate = formatInterestRateForDisplay(
            latestTroveData.annual_interest_rate as bigint
          );

          return {
            id: troveId.toString(),
            collateralAsset: TBTC_SYMBOL,
            collateralAmount,
            collateralValue,
            borrowedAsset: "bitUSD",
            borrowedAmount,
            healthFactor,
            liquidationPrice,
            debtLimit,
            interestRate,
          } as Position;
        });

        const resolvedPositions = await Promise.all(positionPromises);
        const filteredPositions = resolvedPositions.filter(
          (p) => p !== null
        ) as Position[];
        return { positions: filteredPositions };
      } catch (error) {
        console.error(
          "Error fetching user positions in tRPC procedure:",
          error
        );
        throw new Error("Failed to fetch on-chain positions");
      }
    }),
});

export type PositionsRouter = typeof positionsRouter;
