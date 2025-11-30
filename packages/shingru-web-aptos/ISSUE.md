# MongoDB Client-Side Bundling Issue

## Problem

When building the Next.js application, MongoDB was being bundled into client-side code, causing build failures with errors like:

```
Module not found: Can't resolve 'child_process'
Module not found: Can't resolve 'dns'
Module not found: Can't resolve 'timers/promises'
```

### Root Cause

MongoDB is a **server-only** Node.js library that uses Node.js built-in modules (`child_process`, `dns`, `timers/promises`) which are not available in the browser. The issue occurred because:

1. **Type imports in client components**: Client components (`"use client"`) were importing types directly from `@/lib/mongodb/rwa.ts`, which also exports MongoDB functions
2. **Next.js static analysis**: Next.js webpack was analyzing the import graph and attempting to bundle MongoDB for the client, even though it was only used in API routes
3. **Dynamic imports in client code**: Even dynamic imports (`await import()`) in client components were causing webpack to include MongoDB in the client bundle

### Affected Files

- `src/components/pages/(app)/rwa/RWAIndex.tsx` - Client component importing types
- `src/components/pages/(app)/rwa/AssetCard.tsx` - Client component importing types
- `src/components/pages/(app)/rwa/PortfolioCard.tsx` - Client component importing types
- `src/providers/UserProvider.tsx` - Client component with dynamic MongoDB imports

## Solution

### 1. Separated Types from Implementation

Created `src/lib/mongodb/rwa-types.ts` containing **only TypeScript types/interfaces** with no MongoDB imports:

```typescript
// rwa-types.ts - Safe for client-side imports
export interface Asset { ... }
export interface Holding { ... }
export interface Transaction { ... }
```

### 2. Updated Client Components

Changed all client components to import types from the types file:

```typescript
// ❌ Before (caused bundling issue)
import { Asset, Holding } from "@/lib/mongodb/rwa";

// ✅ After (safe for client)
import { Asset, Holding } from "@/lib/mongodb/rwa-types";
```

### 3. Moved MongoDB Operations to API Routes

Created server-side API routes for all MongoDB operations:

- `/api/rwa/assets` - Fetch assets
- `/api/rwa/portfolio` - Get user portfolio
- `/api/rwa/transactions` - Get transaction history
- `/api/rwa/purchase` - Process purchases
- `/api/rwa/process-payment` - Process RWA payments
- `/api/rwa/reserve-purchase` - Reserve purchases before payment

### 4. Updated Payment Processing

Changed `UserProvider.tsx` to call API routes instead of directly importing MongoDB:

```typescript
// ❌ Before
const { processRWAPurchase } = await import("@/lib/rwa/payment-processor");
await processRWAPurchase(...);

// ✅ After
const response = await fetch("/api/rwa/process-payment", {
  method: "POST",
  body: JSON.stringify({ ... })
});
```

## Architecture

### Server-Side (API Routes)
- ✅ Can import MongoDB directly
- ✅ Can use all Node.js built-in modules
- ✅ All database operations happen here

### Client-Side (React Components)
- ✅ Only imports TypeScript types from `rwa-types.ts`
- ✅ Makes HTTP requests to API routes
- ✅ No direct MongoDB access

## Files Changed

### Created
- `src/lib/mongodb/rwa-types.ts` - Type definitions only
- `src/app/api/rwa/process-payment/route.ts` - Server-side payment processing

### Modified
- `src/lib/mongodb/rwa.ts` - Re-exports types, MongoDB functions remain server-only
- `src/components/pages/(app)/rwa/RWAIndex.tsx` - Uses types file, calls API routes
- `src/components/pages/(app)/rwa/AssetCard.tsx` - Uses types file
- `src/components/pages/(app)/rwa/PortfolioCard.tsx` - Uses types file
- `src/providers/UserProvider.tsx` - Calls API route instead of direct MongoDB

## Verification

To verify the fix works:

```bash
npm run build
```

The build should complete successfully without MongoDB bundling errors.

## Best Practices Going Forward

1. **Always separate types from implementations** when types need to be used in client components
2. **Never import server-only libraries in client components** - use API routes instead
3. **Use `"use server"` directive** for server actions if using Next.js App Router
4. **Keep MongoDB operations in API routes** - never in client components or providers

## Additional Notes

- The MongoDB connection is cached at the module level to avoid multiple connections
- Error handling has been improved with better connection timeout settings
- The seed function is idempotent and won't duplicate assets
- All RWA operations now go through API routes for better security and separation of concerns

## Status

✅ **RESOLVED** - MongoDB is no longer bundled in client code. All database operations happen server-side through API routes.

