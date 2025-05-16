import { priceRouter } from "./routers/prices";
import { testRouter } from "./routers/test";
import { createCallerFactory, router } from "./trpc";

// Define our app's router
export const appRouter = router({
  testRouter,
  priceRouter,
});

// Export type of AppRouter for client-side use
export type AppRouter = typeof appRouter;

// Create and export the caller factory instance.
export const createCaller = createCallerFactory(appRouter);
