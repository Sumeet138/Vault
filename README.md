# Vault - Get Paid, Stay Private
### Aptos Hackathon IBW Edition 2025

**A privacy-first payment platform using stealth addresses that enables users to receive payments without exposing their main wallet. Maintains full self-custody while protecting financial privacy.**

---

## 🔧 Key Features
- **Stealth Address Payments** - Fresh, untraceable addresses generated for every payment
- **Real World Assets (RWA)** - Fractional real estate investment with privacy
- **AI Investment Assistant** - AI-powered guidance for RWA investments with live data
- **NFC Tap-to-Pay** - Share payment links instantly with NFC tags
- **Dual Meta Keys (Spend/View)** - Enhanced privacy with separate keys for spending and viewing
- **Payment Link Management** - Create, customize, and track payment links with QR codes
- **Self-Custodial Wallet** - Full control of funds, zero platform access to private keys
- **Portfolio Tracking** - Monitor RWA holdings and transaction history
- **Ephemeral Key Encryption** - One-time encryption keys for payment notes and labels
- **Cross-Platform Compatibility** - Mobile-first responsive design with desktop support

---

## 🚀 Quick Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to start using Vault and protect your financial privacy!

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Aptos, @aptos-labs/ts-sdk, Wagmi/RainbowKit
- **Database**: Supabase (PostgreSQL), MongoDB
- **Security**: @noble/secp256k1, AES-256-GCM encryption, PBKDF2
- **AI Integration**: Groq AI with real-time MongoDB data
- **Animation**: Framer Motion, GSAP
- **Architecture**: Next.js App Router with API routes

---

## 🏗️ Architecture Overview

### Core Technologies
- **Next.js 15** - Full-stack React framework with App Router for modern web development
- **Aptos Blockchain** - Secure, scalable Layer-1 blockchain supporting stealth addresses
- **TypeScript** - Type-safe development across frontend and backend
- **Supabase** - Real-time PostgreSQL database for user accounts and payments
- **MongoDB** - Document database for RWA assets and portfolio management

### Privacy Infrastructure
- **Stealth Address Protocol** - Advanced cryptographic system using secp256k1 elliptic curve cryptography
- **Dual Meta Keys** - Separate spend and view keys for enhanced privacy and functionality
- **Ephemeral Keys** - One-time keys ensuring unlinkability between transactions
- **End-to-End Encryption** - ChaCha20-Poly1305 for secure payment communication
- **Client-Side Key Management** - AES-256-GCM encrypted storage with PIN protection

### Feature Systems
- **RWA Investment Platform** - Fractional real estate tokenization with Mumbai/Pune focus
- **AI Investment Assistant** - Groq-powered AI with live asset and portfolio data access
- **NFC Integration** - Tap-to-pay functionality for seamless physical payment sharing
- **Payment Link Generation** - Dynamic payment links with customizable options
- **Event Scanning** - Real-time blockchain event monitoring for payment detection

---

## 🧩 Feature Deep Dive

### Stealth Address Technology
The core innovation of Vault lies in its implementation of stealth address protocols specifically designed for the Aptos blockchain. Each payment generates a unique stealth address that can only be accessed by the intended recipient using their meta keys, ensuring complete transaction privacy.

### Real World Assets (RWA)
Users can invest in fractional shares of tokenized real estate properties located in major Indian cities like Mumbai and Pune. The platform provides live asset availability, portfolio tracking, and AI-powered investment guidance.

### AI Investment Assistant
Powered by Groq AI, the assistant provides real-time investment advice based on live MongoDB data including current asset availability and user portfolio information. Features include property recommendations, city-based queries, and automatic payment link generation.

### Security & Privacy
The platform implements multiple layers of security including client-side encryption, PIN-protected key storage, and time-limited session keys. Users maintain complete self-custody without exposing their keys to the platform.

---

## 🎯 Use Cases

### For Freelancers
Create client-specific payment addresses to maintain financial privacy and avoid address reuse across different projects.

### For Content Creators  
Accept payments for digital products while keeping your main wallet address private, protecting against financial doxxing.

### For Small Businesses
Keep financial transactions private from competitors by using different payment addresses for different purposes.

### For Investors
Participate in fractional real estate investment with complete privacy, knowing that your investment activities remain confidential.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Aptos wallet (Petra, Martian, etc.) for development

### Development Setup
1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables with the required configuration for Aptos, Supabase, MongoDB, and AI services.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` to begin using Vault's privacy-focused payment system.

---

## 🏆 Competition Track Alignment

Vault directly addresses the "Payments, RWA & Money Infrastructure" track by providing:
- **Privacy-Preserving Payments** using stealth address technology
- **RWA Marketplace** for fractional real estate investment
- **Merchant Payment Solutions** with QR codes and NFC integration
- **Photon Integration** for rewarding user actions and onboarding
- **Aptos-Native Infrastructure** for fast, programmable, global money movement

---

## 🤝 Contributing

We welcome contributions to make financial privacy accessible to everyone! Check out our architecture to understand how the stealth address system works, and consider improvements to privacy protocols, user experience, or RWA features.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.