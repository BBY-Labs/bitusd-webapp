import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "workers/router";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
