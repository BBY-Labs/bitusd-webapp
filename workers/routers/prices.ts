import { publicProcedure, router } from "../trpc";
import { getBitcoinprice } from "workers/services/utils";

export const priceRouter = router({
  getBitcoinPrice: publicProcedure.query(async ({ ctx }) => {
    return {
      price: await getBitcoinprice(),
    };
  }),
  getBitUSDPrice: publicProcedure.query(({ ctx }) => {
    return {
      price: 1.0,
    };
  }),
});

export type PriceRouter = typeof priceRouter;
