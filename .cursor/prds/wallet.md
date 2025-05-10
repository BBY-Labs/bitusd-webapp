# Product Requirements Document: Wallet Integration

## 1. Introduction

This document outlines the requirements for implementing wallet connection functionality within the application. The primary goal is to allow users to seamlessly connect their Starknet wallets, manage their connection status, and view their wallet information. This integration will leverage StarknetKit and Starknet React.

## 2. Dependencies

- **StarknetKit**: ([https://www.starknetkit.com/docs/latest/getting-started](https://www.starknetkit.com/docs/latest/getting-started)) - For providing a user-friendly wallet connection modal and managing various wallet connectors.
- **Starknet React**: ([https://www.starknet-react.com/docs/getting-started](https://www.starknet-react.com/docs/getting-started)) - For React hooks to interact with Starknet and manage wallet state within the application.

## 3. Core Features

### 3.1. Wallet Connection Button

- A clear "Connect Wallet" button will be displayed when no wallet is connected.
- Clicking this button will trigger the wallet selection process.

### 3.2. Wallet Selection Modal

- Upon clicking "Connect Wallet", a modal (provided by StarknetKit via `useStarknetkitConnectModal`) will appear, offering users a choice of available wallet providers.
- Supported wallet types should include:
  - Injected browser extension wallets (e.g., Argent X, Braavos).
  - Web Wallets.
  - Argent Mobile (with appropriate handling for different connection modes).

### 3.3. Display Connected Wallet Information

- Once a wallet is successfully connected, the UI will update to:
  - Display the connected wallet's address (e.g., a truncated version like `0x123...abc`).
  - Potentially display other profile information if available (e.g., StarkName).

### 3.4. Disconnect Wallet

- A "Disconnect" button will be available when a wallet is connected.
- Clicking this button will disconnect the wallet from the application and update the UI accordingly.

### 3.5. Auto-Reconnection

- The application should attempt to automatically reconnect to a previously connected wallet on page load, utilizing the `autoConnect={true}` option in `StarknetConfig`.

## 4. User Experience (UX) Guidelines

The implementation must adhere to the following UX guidelines derived from StarknetKit best practices:

### 4.1. Desktop Users

- Provide comprehensive connection options, including browser extensions and web wallets.

### 4.2. Mobile Web Browsers

- Prioritize options to connect with mobile apps (e.g., Argent Mobile via WalletConnect) or web wallets, as browser extensions are generally not supported.

### 4.3. In-App Mobile Browsers (e.g., Argent Mobile's dApp browser)

- Aim to auto-connect users to the mobile app when the "Connect Wallet" action is initiated, bypassing the modal if possible. This can be achieved by detecting if the user is in an in-app browser.
- Reference: Argent Mobile section of StarknetKit documentation.

## 5. Technical Considerations

- Utilize `useStarknetkitConnectModal` from StarknetKit and `useConnect` from `@starknet-react/core` for managing the connection modal and process, as demonstrated in `app/components/wallet-connector.tsx`.
- Ensure the `StarknetProvider` in `app/starknet-provider.tsx` is configured with the necessary connectors (Injected, WebWallet, ArgentMobileConnector) and the `autoConnect` prop.
- For Argent Mobile, ensure all required parameters (`dappName`, `url`, `projectId`, `icons`, `chainId`) are passed to `ArgentMobileConnector.init()` for optimal UX and to avoid the dApp being presented as "unknown."
- Handle potential TypeScript import errors by ensuring `moduleResolution` is set to `Bundler` (or `NodeNext`) and `module` to `ES2015` (or a compatible modern version) in `tsconfig.json`.
- Listen for `wallet_disconnected` events if using Argent Mobile to handle disconnections initiated from the mobile app itself.

## 6. Current Implementation Notes

- The existing `app/components/wallet-connector.tsx` already implements the modal trigger, displays the connected address, and provides a disconnect button.
- The `app/starknet-provider.tsx` initializes `StarknetConfig` with a static list of `InjectedConnector` and `WebWalletConnector`. This will need to be updated to dynamically use connectors from `useConnect` for the `useStarknetkitConnectModal` and potentially include `ArgentMobileConnector`.
