import React from "react";

import { sepolia, mainnet } from "@starknet-react/chains";
import { StarknetConfig, publicProvider, voyager } from "@starknet-react/core";
import { connectors } from "./lib/wallet/connectors";

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const chains = [mainnet, sepolia];
  const providers = publicProvider();

  return (
    <StarknetConfig
      chains={chains}
      provider={providers}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
