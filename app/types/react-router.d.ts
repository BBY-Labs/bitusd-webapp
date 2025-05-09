import type { ExecutionContext } from "@cloudflare/workers-types";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    // If we need to pass other properties in the loadContext object in workers/app.ts
    // (like 'appVersion', 'db' from the GitHub example: https://github.com/remix-run/react-router/discussions/13331)
    // we can declare them here too. For example:
    // appVersion?: string;
  }
}
