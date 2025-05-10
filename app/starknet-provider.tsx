import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";
import React from "react";

import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  voyager,
  Connector,
} from "@starknet-react/core";

const connectors = [
  new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
  new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
  new InjectedConnector({ options: { id: "keplr", name: "Keplr" } }),
  new InjectedConnector({ options: { id: "okxwallet", name: "OKX" } }),
  new InjectedConnector({ options: { id: "metamask", name: "MetaMask" } }),
  new WebWalletConnector({ url: "https://web.argent.xyz" }),
];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={[mainnet, sepolia]}
      provider={publicProvider()}
      connectors={connectors as Connector[]}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
