import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
import { appRouter, createCallerFactory } from "workers/router";
import type { CloudflareBindings } from "workers/router";
import { useTRPC } from "~/lib/trpc";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const createCaller = createCallerFactory(appRouter);

  const caller = createCaller({
    env: context.cloudflare.env as CloudflareBindings,
    executionCtx: context.cloudflare.executionCtx as ExecutionContext,
  });

  const { env, test } = await caller.getWorkerInfo();

  return { env, test };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const trpc = useTRPC();
  const greetingQuery = useQuery(trpc.hello.queryOptions("Bro"));
  // const workerInfoQuery = useQuery(trpc.getWorkerInfo.queryOptions());

  return (
    <div>
      <p>{greetingQuery.data}</p>
      <p>{loaderData.env}</p>
      <p>{loaderData.test}</p>
    </div>
  );
}
