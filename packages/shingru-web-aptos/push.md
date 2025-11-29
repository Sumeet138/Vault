# Vault Project - Git Commit Batches

## Batch 1: Project Configuration Files
- package.json
- package-lock.json
- tsconfig.json
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- components.json
- .gitignore
- vercel.json

## Batch 2: Documentation Files
- README.md
- kt.md
- req.md
- PHOTON_INTEGRATION.md
- nixpacks.toml

## Batch 3: Root Assets and Static Files
- public/favicon.ico
- public/favicon-16x16.png
- public/favicon-32x32.png
- public/android-chrome-192x192.png
- public/android-chrome-512x512.png
- public/apple-touch-icon.png
- public/robots.txt
- public/sitemap.xml

## Batch 4: Global Application Files
- src/app/globals.css
- src/app/layout.tsx
- src/app/not-found.tsx

## Batch 5: Landing Page Components
- src/app/(landing)/page.tsx
- src/components/pages/(landing)/LandingIndex.tsx
- src/components/pages/(landing)/LandingHero.tsx
- src/components/pages/(landing)/LandingFeatures.tsx

## Batch 6: Main Application Layout
- src/app/(main)/layout.tsx
- src/app/(main)/(app)/layout.tsx
- src/app/(main)/(auth)/layout.tsx

## Batch 7: Authentication Components
- src/app/(main)/(auth)/page.tsx
- src/components/pages/(auth)/AuthPage.tsx
- src/components/pages/(auth)/WalletAuthSection.tsx

## Batch 8: Home Dashboard Components
- src/app/(main)/(app)/(home)/page.tsx
- src/components/pages/(app)/home/HomePage.tsx
- src/components/pages/(app)/home/BalanceOverview.tsx

## Batch 9: Payment Links Components
- src/app/(main)/(app)/(home)/links/page.tsx
- src/components/pages/(app)/links/LinksPage.tsx
- src/components/pages/(app)/links/LinkList.tsx

## Batch 10: Create Link Components
- src/app/(main)/(app)/(home)/links/create/page.tsx
- src/components/pages/(app)/links/CreateLinkPage.tsx
- src/components/pages/(app)/links/CreateLinkForm.tsx

## Batch 11: Payment Receive Components
- src/app/(pay)/[username]/page.tsx
- src/components/pages/(pay)/PayPage.tsx
- src/components/pages/(pay)/PaymentForm.tsx

## Batch 12: Payment Success Components
- src/app/(pay)/[username]/success/page.tsx
- src/components/pages/(pay)/PaymentSuccessPage.tsx

## Batch 13: Settings Components
- src/app/(main)/(app)/(settings)/page.tsx
- src/components/pages/(app)/settings/SettingsPage.tsx
- src/components/pages/(app)/settings/ProfileSettings.tsx

## Batch 14: User Profile Components
- src/app/(main)/(app)/(profile)/page.tsx
- src/components/pages/(app)/profile/ProfilePage.tsx
- src/components/pages/(app)/profile/UserInfo.tsx

## Batch 15: Activities and Transactions
- src/app/(main)/(app)/(app)/activities/page.tsx
- src/components/pages/(app)/activities/ActivitiesPage.tsx
- src/components/pages/(app)/activities/TransactionList.tsx

## Batch 16: Withdraw Components
- src/app/(main)/(app)/(app)/withdraw/page.tsx
- src/components/pages/(app)/withdraw/WithdrawPage.tsx
- src/components/pages/(app)/withdraw/WithdrawForm.tsx

## Batch 17: Common UI Components
- src/components/ui/button.tsx
- src/components/ui/input.tsx
- src/components/ui/label.tsx
- src/components/ui/skeleton.tsx
- src/components/ui/popover.tsx
- src/components/ui/dropdown-menu.tsx
- src/components/ui/tooltip.tsx

## Batch 18: Custom Common Components
- src/components/common/CuteButton.tsx
- src/components/common/CuteCard.tsx
- src/components/common/MainButton.tsx
- src/components/common/EmojiRain.tsx
- src/components/common/RewardToast.tsx
- src/components/common/FullscreenLoader.tsx

## Batch 19: Layout Components
- src/components/layouts/MainLayout.tsx
- src/components/layouts/AuthLayout.tsx
- src/components/layouts/MobileLayout.tsx

## Batch 20: Icons and Assets
- src/components/icons/*.tsx
- src/assets/fonts/*.css
- src/assets/fonts/*.woff2
- src/assets/tokens/*.png

## Batch 21: Configuration Files
- src/config/chains.ts
- src/config/styling.ts
- src/config/constants.ts

## Batch 22: Custom Hooks
- src/hooks/useAuth.ts
- src/hooks/useMetaKeys.ts
- src/hooks/useUser.ts
- src/hooks/useWallet.ts
- src/hooks/useStealth.ts

## Batch 23: Zustand Stores
- src/store/authStore.ts
- src/store/userStore.ts
- src/store/stealthStore.ts

## Batch 24: Core Cryptographic Libraries
- src/lib/@shingru/core/shingru-stealth-aptos.ts
- src/lib/@shingru/core/secure-meta-keys-storage.ts

## Batch 25: Aptos Integration Libraries
- src/lib/aptos/event-scanner.ts
- src/lib/aptos/transaction-builder.ts
- src/lib/aptos/wallet-adapter.ts

## Batch 26: Supabase Integration Libraries
- src/lib/supabase/client.ts
- src/lib/supabase/users.ts
- src/lib/supabase/payments.ts
- src/lib/supabase/balances.ts
- src/lib/supabase/payment-handler.ts

## Batch 27: Utility Functions
- src/lib/utils.ts
- src/utils/formatting.ts
- src/utils/validation.ts
- src/utils/helpers.ts

## Batch 28: Context Providers
- src/providers/RootProvider.tsx
- src/providers/AppProvider.tsx
- src/providers/AuthProvider.tsx
- src/providers/MetaKeysProvider.tsx
- src/providers/UserProvider.tsx
- src/providers/AptosWalletProvider.tsx
- src/providers/SoundProvider.tsx
- src/providers/PhotonProvider.tsx

## Batch 29: API Routes
- src/app/api/withdraw/route.ts
- src/app/api/encrypt/route.ts
- src/app/api/decrypt/route.ts
- src/app/api/auth/[...nextauth]/route.ts

## Batch 30: Supabase Migration Files
- supabase-migrations/create_stealth_payments_table.sql
- supabase-migrations/fix_users_rls_policies.sql
- supabase-migrations/fix_wallets_rls_policies.sql
- supabase-migrations/fix_stealth_payments_rls_policies.sql
- supabase-migrations/create_user_balances_table.sql
- supabase-migrations/add_balance_tracking_to_payments.sql
- src/lib/empty.js