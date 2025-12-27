# KYC Setup Instructions

## Environment Variables

Add the following to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Stripe Identity Setup

1. **Enable Stripe Identity** in your Stripe Dashboard:
   - Go to https://dashboard.stripe.com/settings/identity
   - Enable "Identity" if not already enabled
   - Configure verification settings

2. **Set up Webhook** (for production):
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/api/kyc/webhook`
   - Select events:
     - `identity.verification_session.verified`
     - `identity.verification_session.requires_input`
     - `identity.verification_session.canceled`
     - `identity.verification_session.processing`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

1. Use Stripe test mode keys for development
2. Test verification flow with test documents (see Stripe Identity docs)
3. Verify webhook events are received correctly

## Implementation Details

- KYC status is stored in user profile (localStorage for now)
- Verification session ID is stored when verification starts
- Status is checked via polling (every 3 seconds) and webhooks
- KYC is required for:
  - Investments over €1,000
  - All withdrawals

## Next Steps

For production:
1. Move KYC status to database (not localStorage)
2. Implement proper webhook handling
3. Add email notifications on verification status change
4. Add admin panel to view/manage KYC statuses

