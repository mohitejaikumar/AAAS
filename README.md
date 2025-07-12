




https://github.com/user-attachments/assets/f3573923-37fd-44cf-913e-abbe9a1781b7




# Algorithms as a Service (AAAS)

## IDEA

1. You will put on challenges it can be private/public .
2. Interested people can join the challenge and with some fees .
3. After the challenge is finished the winners can claim there money back, and lossers money will be divided among the winners
4. Also there can be 2 types of challenges Votebased and Monitered based
5. Votebased are those where after the challenge is finished there will be voting period of 30min in that 30min people will vote for all the users in the challenges whom they support by positive or negative vote .
6. if positive vote is >=negative vote the participant has won 
7. Monitered challenges are those like GoogleFit app integration, where app data is used for verification
8. For Votebased challenges the voter will get a reward token of our platform .

## Tests
<img width="1236" height="427" alt="image" src="https://github.com/user-attachments/assets/fec50d73-2b13-4ede-bbb4-7ea8f5ad13f7" />


## Overview

AAAS is a decentralized platform to compete with yourself, earn rewards by voting for challenges The platform consists of:

1. A mobile application built with React Native and Expo
2. A Solana blockchain contract built with Anchor

Users can create algorithm challenges, vote on solutions, and interact with the platform through a modern mobile interface that integrates with Solana's blockchain ecosystem.
```bash
// this should be replaced with some 100xdevs token for minting reward and USDC for joining the challenge
MINT_OF_TOKEN_FOR_REWARD =
  "HPuw5bXXxUj8akYkscffhM92gSu9sV7Z5PDJJmPzeNEa";
```

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
