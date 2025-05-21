import { useAccount } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";

function Positions() {
  const { address } = useAccount(); // HOOK from starknet-react

  console.log(address);

  const trpc = useTRPC();
  const { data: accounts } = useQuery(
    trpc.priceRouter.getAccountsOwnedByUser.queryOptions({
      address: address as string,
    })
  );
  return (
    <div>
      {accounts?.map((account) => (
        <div key={account}>{account}</div>
      ))}
    </div>
  );
}

export default Positions;
