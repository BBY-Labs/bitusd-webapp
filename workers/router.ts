import { testRouter } from "./routers/test";
import { createCallerFactory, publicProcedure, router } from "./trpc";

// Define our app's router
export const appRouter = router({
  testRouter,
  
});

// Export type of AppRouter for client-side use
export type AppRouter = typeof appRouter;

// Create and export the caller factory instance.
export const createCaller = createCallerFactory(appRouter);
