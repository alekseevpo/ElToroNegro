# Stripe Integration Guide

## Setup Instructions

1. **Get Stripe API Keys:**
   - Sign up at [https://stripe.com](https://stripe.com)
   - Go to [Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
   - Copy your **Publishable key** and **Secret key** (use test keys for development)

2. **Configure Environment Variables:**
   
   Create a `.env.local` file in the `frontend` directory (or copy from `.env.local.example`):
   ```env
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

3. **Install Dependencies:**
   
   Dependencies are already installed. If you need to reinstall:
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js stripe
   ```

## How It Works

1. User selects card payment method and enters amount
2. Frontend calls `/api/stripe/create-checkout` to create a Stripe Checkout Session
3. User is redirected to Stripe's hosted checkout page
4. After payment, user is redirected back with `success=true&session_id=...`
5. Frontend verifies payment with `/api/stripe/verify-session`
6. Success message is displayed to the user

## Testing

Use Stripe test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)

## Production

1. Replace test keys with live keys from Stripe Dashboard
2. Update `success_url` and `cancel_url` in `create-checkout/route.ts` with your production domain
3. Configure webhooks (optional) for server-side payment verification
4. Add proper error handling and logging
5. Consider implementing token minting/distribution after successful payment verification

## Notes

- Stripe Checkout handles all payment processing securely
- PCI compliance is handled by Stripe
- Webhooks can be set up for more robust payment verification
- Consider adding database records for completed purchases
- Token distribution should be handled after payment verification

