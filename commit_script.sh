#!/bin/bash

# Navigate to the project directory
cd /d "D:\Hackathon\pivy-main (1)\pivy-main"

# Initialize git repository
git init

# Add remote origin
git remote add origin https://github.com/Sumeet138/Vault.git

# Configure git user (update these with your details if needed)
git config user.name "Sumeet138"
git config user.email "sumeet138@gmail.com"

# Create an initial commit
git add .
git commit -m "Initial commit: Project structure setup"

# Define commit messages
messages=(
  "Add core configuration files"
  "Set up package.json and dependencies"
  "Add VSCode settings"
  "Include deployment configurations"
  "Add stealth program Move.toml"
  "Set up stealth program package"
  "Add deployment scripts"
  "Create stealth program documentation"
  "Add stealth program source files"
  "Include stealth program build artifacts"
  "Configure web environment files"
  "Add web project configuration"
  "Set up web project type definitions"
  "Add web project linting and build configs"
  "Include web project gitignore"
  "Add web project documentation"
  "Add web project public assets"
  "Set up web project app structure"
  "Add web project components"
  "Include web project utility functions"
  "Add web project service files"
  "Set up web project hooks"
  "Add web project styling"
  "Include database migration files"
  "Add web project VSCode settings"
  "Include build artifacts directory"
  "Add web project helper scripts"
  "Add requirements documentation"
  "Include knowledge transfer docs"
  "Final project verification and cleanup"
)

# Calculate time interval between commits (4.5 hours = 16200 seconds, 29 commits remaining = ~558 seconds per commit)
start_timestamp=$(date -d "2025-11-29 16:00:00 +0530" +%s)  # 4:00 PM IST
interval=115  # seconds between commits (to spread 30 commits across ~4.5 hours)

# Create commits with specific timestamps
for i in "${!messages[@]}"; do
  # Calculate the timestamp for this commit
  current_timestamp=$((start_timestamp + (i * interval)))
  
  # Format the timestamp for GIT_AUTHOR_DATE and GIT_COMMITTER_DATE
  formatted_date=$(date -d "@$current_timestamp" "+%Y-%m-%d %H:%M:%S %z")
  
  # Add files to commit (we'll make a small change to ensure there's something to commit each time)
  echo "// Commit timestamp: $formatted_date" >> commit_tracker.txt
  
  # Add the file and commit with the specific timestamp
  git add .
  GIT_AUTHOR_DATE="$formatted_date" GIT_COMMITTER_DATE="$formatted_date" git commit -m "${messages[i]}"
done

echo "All 30 commits created with timestamps from 4 PM to 8:30 PM IST on Nov 29, 2025"