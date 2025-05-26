import {
  useAccount,
  useBalance,
  useContract,
  useSendTransaction,
} from "@starknet-react/core";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { TBTC_ABI, TBTC_ADDRESS } from "~/lib/constants";

export function GetTestBtc() {
  const queryClient = useQueryClient();

  const { address, chainId } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: TBTC_ADDRESS,
  });
  const { contract } = useContract({
    abi: TBTC_ABI,
    address: TBTC_ADDRESS,
  });

  const { send, isPending } = useSendTransaction({
    calls:
      contract && address
        ? [contract.populate("mint", [address, 1000000000000000000n])] // Mint 1 testBTC (1 * 10^18)
        : undefined,
    onSuccess: () => {
      // Invalidate the balance query to refresh the balance
      queryClient.invalidateQueries({
        queryKey: [
          {
            entity: "balance",
            chainId: chainId,
            token: TBTC_ADDRESS,
            address: address,
            blockIdentifier: "latest",
          },
        ],
      });
      toast.success("Successfully minted 1 testBTC");
    },
    onError: (error) => {
      toast.error("Failed to mint testBTC");
    },
  });

  const handleMint = () => {
    if (contract && address) {
      send();
    }
  };

  if (!address) {
    return null;
  }

  // Don't show button if user has 1 TBTC or more
  const hasEnoughBalance = balance && balance.value >= 1000000000000000000n;
  if (hasEnoughBalance) {
    return null;
  }

  return (
    <Button
      onClick={handleMint}
      disabled={!contract || isPending}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isPending ? "Minting..." : "Mint TBTC"}
    </Button>
  );
}
