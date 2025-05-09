import { initTRPC } from "@trpc/server";
import type { Bindings } from "hono/types";
import { z } from "zod";

export interface CloudflareBindings extends Bindings {
  VALUE_FROM_CLOUDFLARE: string;
  // Add other specific environment variables as needed
}

// Define the shape of our tRPC context.
type HonoContext = {
  env: CloudflareBindings;
  executionCtx: ExecutionContext;
  // honoReq: import('hono').Context['req']; // could also include the raw Hono request if needed
};

// Initialize tRPC with the defined context type
const t = initTRPC.context<HonoContext>().create();

// Export the router and procedure helpers
export const publicProcedure = t.procedure;
export const { createCallerFactory, router } = t;

// Define your app's router
export const appRouter = router({
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

// Export type of AppRouter for client-side use
export type AppRouter = typeof appRouter;
