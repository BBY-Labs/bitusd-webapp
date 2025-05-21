import { z } from "zod/v4";
import { publicProcedure, router } from "../trpc";

async function getPositions(address: string) {
  //TODO: get positions from starknet

  
  const positions = ["test1", "test2", "test3"];
  return positions;
}

export const priceRouter = router({
  getBitcoinPrice: publicProcedure.query(async ({ ctx }) => {
    // const response = await fetch(
    //   "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    // ); //
    // const data = (await response.json()) as { bitcoin: { usd: number } };
    // return {
    //   price: data.bitcoin.usd,
    // };
    return {
      price: 100000,
    };
  }),
  getBitUSDPrice: publicProcedure.query(({ ctx }) => {
    return {
      price: 1.0,
    };
  }),
  getAccountsOwnedByUser: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accounts = await getPositions(input.address); // get accounts with starknet address
      return accounts;
    }),
});

export type PriceRouter = typeof priceRouter;
