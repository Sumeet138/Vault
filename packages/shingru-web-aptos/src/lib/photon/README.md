# Photon SDK Integration

This directory contains the Photon SDK integration for the Shingru payment application.

## Overview

Photon provides unified identity, embedded wallet, engagement, and rewards functionality. This integration enables:

- Passwordless authentication with automatic wallet creation
- Reward tracking for user actions (PAT tokens)
- Attribution tracking for analytics

## Files

- `types.ts` - TypeScript type definitions for Photon API
- `client.ts` - Core Photon API client with HTTP methods
- `rewards.ts` - Helper functions for reward tracking
- `attribution.ts` - Helper functions for attribution tracking
- `index.ts` - Main exports

## Configuration

Environment variables required (already set in `.env`):

```env
NEXT_PUBLIC_PHOTON_API_KEY=your_api_key
NEXT_PUBLIC_PHOTON_BASE_URL=https://stage-api.getstan.app/identity-service/api/v1
NEXT_PUBLIC_PHOTON_CAMPAIGN_ID=your_campaign_id
```

## Usage

### Initialize the client

```typescript
import { getPhotonClient, initializePhotonClient } from '@/lib/photon';

// Get singleton instance (uses env vars)
const client = getPhotonClient();

// Or initialize with custom config
const client = initializePhotonClient({
  apiKey: 'your_key',
  baseUrl: 'https://api.example.com',
  campaignId: 'your_campaign_id'
});
```

### Register a user

```typescript
import { getPhotonClient } from '@/lib/photon';

const client = getPhotonClient();
const response = await client.register(jwtToken);

// Response includes user data, tokens, and wallet address
console.log(response.data.wallet.walletAddress);
```

### Track rewards

```typescript
import { trackPaymentLinkCreation, trackPaymentCompletion } from '@/lib/photon';

// Track payment link creation
await trackPaymentLinkCreation(userId, linkId, { metadata });

// Track payment completion
await trackPaymentCompletion(userId, paymentId, amount, { metadata });
```

### Track attribution

```typescript
import { trackAttribution, trackPageView } from '@/lib/photon';

// Track generic action
await trackAttribution(userId, 'button_click', { buttonId: 'create-link' });

// Track page view
await trackPageView(userId, '/app/dashboard');
```

## Error Handling

All tracking functions handle errors silently to avoid blocking user functionality:

- Errors are logged to console
- Functions return `null` or `false` on failure
- User actions continue normally even if tracking fails

## API Reference

See the [Photon API documentation](../../photon.md) for detailed API information.
