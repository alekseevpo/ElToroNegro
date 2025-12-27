# El Toro Negro Frontend

Modern, minimalist frontend for El Toro Negro investment platform built with Next.js 14, React, and Tailwind CSS.

## Features

- 🎨 **Minimalist Design** - Clean, Apple-inspired UI
- 💼 **El Toro Negro** - Invest in tokenized assets from €10
- 🎰 **Lottery** - Decentralized lottery with Chainlink VRF
- 📈 **BTC Bets** - Predict Bitcoin price for weekly prizes
- 🔗 **Web3 Integration** - MetaMask wallet connection
- 📱 **Responsive** - Mobile-first design

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Ethers.js v6** - Ethereum library for Web3 integration
- **React Hooks** - Custom hooks for wallet and contract interactions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask browser extension (for testing)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_INVESTMENT_POOL_ADDRESS=0x...
NEXT_PUBLIC_LOTTERY_ADDRESS=0x...
NEXT_PUBLIC_BTC_BET_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── my-investments/           # My Investments page
│   ├── lottery/                  # Lottery page
│   └── btc-bets/                 # BTC bets page
├── components/                    # React components
│   ├── Header.tsx                # Navigation header
│   ├── Footer.tsx                # Footer
│   ├── WalletButton.tsx          # Web3 wallet connection
│   ├── Hero.tsx                  # Hero section
│   ├── InvestmentOptionsWithContract.tsx  # Investment UI with contract integration
│   ├── MyInvestmentsSection.tsx  # User investments management
│   ├── Features.tsx              # Features section
│   ├── Stats.tsx                 # Statistics
│   ├── LotterySection.tsx        # Lottery UI
│   └── BTCBetsSection.tsx        # BTC bets UI
├── hooks/                         # Custom React hooks
│   ├── useWallet.ts              # Wallet connection hook
│   └── useInvestmentPool.ts      # Investment pool contract hook
├── lib/                           # Utilities
│   └── contracts.ts              # Contract ABIs and helper functions
└── public/                        # Static assets
```

## Web3 Integration

The frontend uses Ethers.js v6 to interact with Ethereum smart contracts:

### Hooks

- **useWallet** - Manages MetaMask wallet connection
  - `connect()` - Connect wallet
  - `disconnect()` - Disconnect wallet
  - `account` - Current connected address
  - `isConnected` - Connection status

- **useInvestmentPool** - Manages InvestmentPool contract interactions
  - `invest(amount)` - Make investment
  - `withdraw(index)` - Withdraw specific investment
  - `withdrawAll()` - Withdraw all available investments
  - `getUserStats(address)` - Get user statistics
  - `getUserInvestments(address)` - Get user investments list
  - `poolStats` - Pool statistics
  - `minInvestment` - Minimum investment amount

### Contract Addresses

Contract addresses are configured via environment variables:
- `NEXT_PUBLIC_INVESTMENT_POOL_ADDRESS`
- `NEXT_PUBLIC_LOTTERY_ADDRESS`
- `NEXT_PUBLIC_BTC_BET_ADDRESS`

## Pages

### Home (`/`)
- Investment options selection
- Investment form with contract integration
- User investment statistics
- Pool statistics

### My Investments (`/my-investments`)
- View all user investments
- Available investments ready for withdrawal
- Active investments with countdown
- Withdraw individual or all investments
- Investment history

### Lottery (`/lottery`)
- View lottery status
- Purchase lottery tickets
- View prize pool

### BTC Bets (`/btc-bets`)
- Current BTC price
- Place bet on BTC price
- View betting status

## Design Principles

- **Minimalism** - Clean, uncluttered interface
- **Accessibility** - WCAG compliant
- **Performance** - Optimized for speed
- **Responsiveness** - Works on all devices

## Development Notes

### Testing with Hardhat Local Node

1. Start Hardhat local node:
```bash
cd ..
npx hardhat node
```

2. Deploy contracts to local network:
```bash
npx hardhat run scripts/deployInvestmentPool.js --network localhost
```

3. Update `.env.local` with deployed contract addresses

4. Start frontend:
```bash
cd frontend
npm run dev
```

5. Connect MetaMask to `http://localhost:8545`
6. Import test accounts from Hardhat output

## Deployment

The frontend can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- Any static hosting service

```bash
npm run build
```

## License

MIT
