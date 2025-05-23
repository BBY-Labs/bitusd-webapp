import { z } from "zod/v4";
import { publicProcedure, router } from "../trpc";

export const priceRouter = router({
  getBitcoinPrice: publicProcedure.query(async ({ ctx }) => {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = (await response.json()) as { bitcoin: { usd: number } };

    return {
      price: data.bitcoin.usd || 100000,
    };
  }),
  getBitUSDPrice: publicProcedure.query(({ ctx }) => {
    return {
      price: 1.0,
    };
  }),
});

export type PriceRouter = typeof priceRouter;
