# Algorithms as a Service (AAAS)

## Overview

AAAS is a decentralized platform that connects algorithm creators with users who need algorithmic solutions. The platform consists of:

1. A mobile application built with React Native and Expo
2. A Solana blockchain contract built with Anchor

Users can create algorithm challenges, vote on solutions, and interact with the platform through a modern mobile interface that integrates with Solana's blockchain ecosystem.

// this should be replaced with some 100xdevs token for minting reward and USDC for joining the challenge
MINT_OF_TOKEN_FOR_REWARD =
  "HPuw5bXXxUj8akYkscffhM92gSu9sV7Z5PDJJmPzeNEa";

## Repository Structure

- `/aaas-app` - Mobile application built with React Native and Expo
- `/aaas-contract` - Solana smart contract built with Anchor framework

## Mobile Application (aaas-app)

### Features

- Create and browse challenges
- Vote on challenges 
- User profiles and authentication
- Solana wallet integration
- Mobile-first interface

### Tech Stack

- React Native with Expo framework
- TypeScript
- Expo Router for navigation
- Solana Web3.js and Mobile Wallet Adapter
- React Hook Form for form management
- Zod for validation

### Getting Started

1. Install dependencies:
   ```bash
   cd aaas-app
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on a device or simulator:
   - Press `a` to open in Android emulator
   - Press `i` to open in iOS simulator
   - Scan QR code with Expo Go app on your physical device

## Solana Smart Contract (aaas-contract)

### Features

- Manages challenge creation and submission
- Handles voting and rewards
- Secure transaction processing

### Tech Stack

- Solana Blockchain
- Anchor Framework
- Rust programming language

### Getting Started

1. Install dependencies:
   ```bash
   cd aaas-contract
   yarn install
   ```

2. Build the contract:
   ```bash
   anchor build
   ```

3. Deploy to local network:
   ```bash
   anchor deploy
   ```

4. Run tests:
   ```bash
   anchor test
   ```

## Development Workflow

1. Make changes to the smart contract
2. Test and deploy the contract
3. Update the mobile app to interact with the new contract version
4. Test end-to-end functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[MIT License](LICENSE) 
