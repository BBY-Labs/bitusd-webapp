import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BitUSD" },
    { name: "This is bitUSD", content: "Welcome to bitUSD!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  return redirect("/");
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <></>;
}
