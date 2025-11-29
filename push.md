# Vault Project Git Commits - 30 Batch Plan

## Batch 1
- .gitignore
- package.json

## Batch 2
- .vscode/settings.json
- nixpacks.toml

## Batch 3
- package-lock.json
- bun.lockb

## Batch 4
- README.md

## Batch 5
- packages/shingru-stealth-program-aptos/Move.toml
- packages/shingru-stealth-program-aptos/package.json

## Batch 6
- packages/shingru-stealth-program-aptos/deploy.ps1
- packages/shingru-stealth-program-aptos/deploy.sh

## Batch 7
- packages/shingru-stealth-program-aptos/README.md

## Batch 8
- packages/shingru-stealth-program-aptos/scripts/*

## Batch 9
- packages/shingru-stealth-program-aptos/sources/*.move

## Batch 10
- packages/shingru-stealth-program-aptos/build/*

## Batch 11
- packages/shingru-web-aptos/.env
- packages/shingru-web-aptos/components.json

## Batch 12
- packages/shingru-web-aptos/next.config.ts
- packages/shingru-web-aptos/tsconfig.json

## Batch 13
- packages/shingru-web-aptos/next-env.d.ts
- packages/shingru-web-aptos/eslint.config.mjs

## Batch 14
- packages/shingru-web-aptos/postcss.config.mjs
- packages/shingru-web-aptos/vercel.json

## Batch 15
- packages/shingru-web-aptos/.gitignore
- packages/shingru-web-aptos/nixpacks.toml

## Batch 16
- packages/shingru-web-aptos/README.md
- packages/shingru-web-aptos/PHOTON_INTEGRATION.md

## Batch 17
- packages/shingru-web-aptos/public/*

## Batch 18
- packages/shingru-web-aptos/src/app/*
- packages/shingru-web-aptos/src/pages/*

## Batch 19
- packages/shingru-web-aptos/src/components/*

## Batch 20
- packages/shingru-web-aptos/src/lib/*

## Batch 21
- packages/shingru-web-aptos/src/utils/*

## Batch 22
- packages/shingru-web-aptos/src/types/*

## Batch 23
- packages/shingru-web-aptos/src/hooks/*

## Batch 24
- packages/shingru-web-aptos/src/services/*

## Batch 25
- packages/shingru-web-aptos/src/styles/*

## Batch 26
- packages/shingru-web-aptos/supabase-migrations/*

## Batch 27
- packages/shingru-web-aptos/.vscode/*

## Batch 28
- packages/shingru-web-aptos/.next/*

## Batch 29
- packages/shingru-web-aptos/fix-imports.js
- packages/shingru-web-aptos/req.md

## Batch 30
- packages/shingru-web-aptos/kt.md
- Final cleanup and verification files

## Instructions for committing:
1. Create a new branch for the vault project
2. Commit each batch separately with descriptive commit messages
3. Push each batch individually to maintain a clean git history
4. Verify each commit before proceeding to the next batch

## Automated Commit Process:
1. Run the PowerShell script: `powershell -ExecutionPolicy Bypass -File commit_script.ps1`
   - This will:
     - Initialize the git repository
     - Add the remote origin: https://github.com/Sumeet138/Vault.git
     - Create 30 commits with timestamps from 4 PM to 8:30 PM IST on Nov 29, 2025
     - Use appropriate commit messages for each batch