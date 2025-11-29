# Deploy Shingru Stealth Contract to Aptos (PowerShell)
# Usage: .\deploy.ps1 [testnet|mainnet] [profile_name]

param(
    [string]$Network = "testnet",
    [string]$Profile = "default"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Shingru Stealth Contract to Aptos $Network..." -ForegroundColor Cyan

# Set network-specific configuration
if ($Network -eq "mainnet") {
    $AptosNetwork = "mainnet"
    $AptosProfile = "mainnet"
} else {
    $AptosNetwork = "testnet"
    $AptosProfile = "testnet"
}

# Check if Aptos CLI is installed
try {
    $null = aptos --version
} catch {
    Write-Host "❌ Aptos CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3" -ForegroundColor Yellow
    exit 1
}

# Check if profile exists, if not create it
$profiles = aptos config show-profiles 2>&1
if ($profiles -notmatch $AptosProfile) {
    Write-Host "📝 Creating new Aptos profile: $AptosProfile" -ForegroundColor Yellow
    aptos init --profile $AptosProfile --network $AptosNetwork
}

# Get the account address
$profileInfo = aptos config show-profiles --profile $AptosProfile 2>&1
$accountAddress = ""
if ($profileInfo -match 'account["\s]*[:=]["\s]*([0-9a-fA-Fx]+)') {
    $accountAddress = $matches[1]
} elseif ($profileInfo -match 'account_address["\s]*[:=]["\s]*([0-9a-fA-Fx]+)') {
    $accountAddress = $matches[1]
}

if ([string]::IsNullOrEmpty($accountAddress)) {
    Write-Host "❌ Could not find account address. Please check your Aptos profile." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Account Address: $accountAddress" -ForegroundColor Green

# Check account balance
Write-Host "💰 Checking account balance..." -ForegroundColor Cyan
aptos account list --profile $AptosProfile

# Update Move.toml with the account address
Write-Host "📝 Updating Move.toml with account address..." -ForegroundColor Cyan
$moveTomlContent = Get-Content Move.toml -Raw
$moveTomlContent = $moveTomlContent -replace 'shingru_stealth = "0x0"', "shingru_stealth = `"$accountAddress`""
Set-Content Move.toml -Value $moveTomlContent -NoNewline

# Compile the contract
Write-Host "🔨 Compiling contract..." -ForegroundColor Cyan
aptos move compile --package-dir . --named-addresses "shingru_stealth=$accountAddress"

# Publish the contract
Write-Host "📦 Publishing contract..." -ForegroundColor Cyan
aptos move publish `
    --package-dir . `
    --named-addresses "shingru_stealth=$accountAddress" `
    --profile $AptosProfile `
    --assume-yes

Write-Host ""
Write-Host "✅ Contract deployed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 Package Address: $accountAddress" -ForegroundColor Yellow
Write-Host "🌐 Network: $Network" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Add this to your .env.local file:" -ForegroundColor Cyan
if ($Network -eq "mainnet") {
    Write-Host "NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_MAINNET=$accountAddress" -ForegroundColor Yellow
} else {
    Write-Host "NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_TESTNET=$accountAddress" -ForegroundColor Yellow
}
Write-Host ""







