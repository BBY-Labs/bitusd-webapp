import type { Route } from "./+types/home";
import { usePrefetchQuery, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/utils/trpc";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  // const trpc = useTRPC();

  // const workerInfoQuery = useQuery(trpc.getWorkerInfo.queryOptions());

  // return { message: workerInfoQuery?.data?.env };

  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const trpc = useTRPC();
  const greetingQuery = useQuery(trpc.hello.queryOptions("Bro"));
  const workerInfoQuery = useQuery(trpc.getWorkerInfo.queryOptions());

  return (
    <div>
      <p>{greetingQuery.data}</p>
      <p>{loaderData.message}</p>
      <p>{workerInfoQuery.data?.env}</p>
    </div>
  );
}
