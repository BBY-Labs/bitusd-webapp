import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
import { createCaller } from "workers/router"; // This line was causing the server-side code to be pulled into the client
import { useTRPC } from "~/lib/trpc";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BitUSD" },
    { name: "This is bitUSD", content: "Welcome to bitUSD!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const caller = createCaller({
    env: context.cloudflare.env,
    executionCtx: context.cloudflare.ctx,
  });

  const { env, test } = await caller.testRouter.getWorkerInfo();

  return { env, test };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const trpc = useTRPC();
  const greetingQuery = useQuery(trpc.testRouter.hello.queryOptions("Bro"));
  const workerInfoQuery = useQuery(
    trpc.testRouter.getWorkerInfo.queryOptions()
  );

  return (
    <div>
      <p>{greetingQuery.data}</p>
      <p>{loaderData.env}</p>
      <p>{loaderData.test}</p>
      <p>{workerInfoQuery.data?.env}</p>
      <p>{workerInfoQuery.data?.test}</p>
    </div>
  );
}
