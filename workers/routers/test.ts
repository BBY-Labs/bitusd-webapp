import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const testRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input, ctx }) => {
    return `Hello ${input}, tu vas bien?`;
  }),
  getWorkerInfo: publicProcedure.query(({ ctx }) => {
    return {
      env: ctx.env.VALUE_FROM_CLOUDFLARE,
      test: "test",
    };
  }),
  getBitcoinPrice: publicProcedure.query(async ({ ctx }) => {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"); // 
    const data = await response.json() as { bitcoin: { usd: number } };
    return {
      price: data.bitcoin.usd,
    };
  }),
  getBitUSDPrice: publicProcedure.query(({ ctx }) => {
    return {
      price: 1.00,
    };
  }),
});

export type TestRouter = typeof testRouter;
