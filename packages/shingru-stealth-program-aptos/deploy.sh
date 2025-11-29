#!/bin/bash

# Deploy Shingru Stealth Contract to Aptos
# Usage: ./deploy.sh [testnet|mainnet] [profile_name]

set -e

NETWORK=${1:-testnet}
PROFILE=${2:-default}

echo "🚀 Deploying Shingru Stealth Contract to Aptos $NETWORK..."

# Set network-specific configuration
if [ "$NETWORK" = "mainnet" ]; then
    APTOS_NETWORK="mainnet"
    APTOS_PROFILE="mainnet"
else
    APTOS_NETWORK="testnet"
    APTOS_PROFILE="testnet"
fi

# Check if Aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI is not installed. Please install it first:"
    echo "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3"
    exit 1
fi

# Check if profile exists, if not create it
if ! aptos config show-profiles | grep -q "$APTOS_PROFILE"; then
    echo "📝 Creating new Aptos profile: $APTOS_PROFILE"
    aptos init --profile $APTOS_PROFILE --network $APTOS_NETWORK
fi

# Get the account address
ACCOUNT_ADDRESS=$(aptos config show-profiles --profile $APTOS_PROFILE | grep "account" | awk '{print $2}' | tr -d '"' || echo "")
if [ -z "$ACCOUNT_ADDRESS" ]; then
    ACCOUNT_ADDRESS=$(aptos config show-profiles --profile $APTOS_PROFILE | grep "account_address" | awk '{print $2}' | tr -d '"' || echo "")
fi

echo "📋 Account Address: $ACCOUNT_ADDRESS"

# Check account balance
echo "💰 Checking account balance..."
aptos account list --profile $APTOS_PROFILE

# Update Move.toml with the account address
echo "📝 Updating Move.toml with account address..."
sed -i.bak "s/shingru_stealth = \"0x0\"/shingru_stealth = \"$ACCOUNT_ADDRESS\"/" Move.toml

# Compile the contract
echo "🔨 Compiling contract..."
aptos move compile --package-dir . --named-addresses shingru_stealth=$ACCOUNT_ADDRESS

# Publish the contract
echo "📦 Publishing contract..."
aptos move publish \
    --package-dir . \
    --named-addresses shingru_stealth=$ACCOUNT_ADDRESS \
    --profile $APTOS_PROFILE \
    --assume-yes

# Get the published package address
echo "🔍 Getting published package address..."
PACKAGE_ADDRESS=$(aptos move list --profile $APTOS_PROFILE | grep "shingru_stealth" | head -1 | awk '{print $NF}' || echo "")

if [ -z "$PACKAGE_ADDRESS" ]; then
    # Try alternative method
    PACKAGE_ADDRESS=$(aptos account list --profile $APTOS_PROFILE --query resources | grep -A 5 "code" | grep "package_address" | awk '{print $2}' | tr -d '",' | head -1 || echo "")
fi

echo ""
echo "✅ Contract deployed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Package Address: $ACCOUNT_ADDRESS"
echo "🌐 Network: $NETWORK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Add this to your .env.local file:"
if [ "$NETWORK" = "mainnet" ]; then
    echo "NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_MAINNET=$ACCOUNT_ADDRESS"
else
    echo "NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_TESTNET=$ACCOUNT_ADDRESS"
fi
echo ""







