# bitUSD Webapp

A modern web interface for the bitUSD protocol - a decentralized, Bitcoin-backed stablecoin protocol built on Starknet, inspired by Liquity v2.

## Overview

bitUSD is a decentralized stablecoin protocol that enables users to mint stablecoins backed by Bitcoin collateral. As Bitcoin represents digital gold, bitUSD aims to become the digital cash equivalent, creating a truly decentralized and unstoppable stablecoin system.

## Features

- **Bitcoin-Backed Collateral**: Secure your stablecoin with the most trusted cryptocurrency
- **User-Defined Interest Rates**: Borrowers set their own interest rates, creating a free market for borrowing costs
- **Native Yield**: bitUSD holders can earn yield by depositing in the staking pool
- **Protocol Incentivized Liquidity**: Protocol fees are distributed to liquidity providers
- **Interest Rate Delegation**: Ecosystem for managers and liquidation bots to operate on Starknet
- **Price Oracle Integration**: Powered by Pragma.xyz for reliable price feeds
- **Sustainable Fee Model**: Protocol fees are paid by borrowers, ensuring long-term sustainability

## Related Links

- [Smart Contracts Repository](https://github.com/BBY-Labs/bitUSD)
- [Video Demo](https://www.loom.com/share/5082d26f870f4e63be925bf695c7714d?sid=86e8bbd8-5996-4e59-bdf9-c69260a63625)

## Running Locally

1. Clone the repository:

```bash
git clone https://github.com/your-username/bitusd-webapp.git
cd bitusd-webapp
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
NODE_URL=your_starknet_rpc_url
```

4. Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
pnpm build
```

## Deployment

The application is configured to deploy to Cloudflare Workers:

```bash
pnpm deploy
```

## Tech Stack

- React 19
- TypeScript
- TailwindCSS
- tRPC
- Starknet.js
- Cloudflare Workers
- Vite

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- A Starknet wallet (Argent X or Braavos)

## Security

The protocol is currently in development and should only be used for testing purposes. Please do not use with real funds until the security audit is completed.
