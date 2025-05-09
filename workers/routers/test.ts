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
});

export type TestRouter = typeof testRouter;
