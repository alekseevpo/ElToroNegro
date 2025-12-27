# KYC Implementation Recommendations

## Overview

Know Your Customer (KYC) is essential for compliance with financial regulations, especially for platforms handling payments and investments. This document provides recommendations for implementing KYC verification in the El Toro Negro investment platform.

## Recommended KYC Providers

### 1. **Sumsub** (Recommended for Startups)
- **Pros**: 
  - Easy integration with REST API and Web SDK
  - Good pricing for startups
  - Supports 200+ countries and documents
  - Real-time verification
  - Built-in AML checks
  - Liveness detection
- **Pricing**: ~$0.50-2.00 per verification
- **Best for**: Startups and small-to-medium platforms

### 2. **Onfido**
- **Pros**:
  - Excellent UI/UX
  - High accuracy
  - Strong fraud detection
  - Document verification + biometric checks
- **Pricing**: ~$2-4 per verification
- **Best for**: Platforms prioritizing user experience

### 3. **Jumio**
- **Pros**:
  - Enterprise-grade security
  - Compliance with multiple regulations (GDPR, PCI-DSS)
  - Advanced fraud detection
- **Pricing**: Higher tier, contact for pricing
- **Best for**: Enterprise platforms with high compliance requirements

### 4. **Veriff**
- **Pros**:
  - Fast verification (often < 10 seconds)
  - Good coverage of document types
  - Competitive pricing
- **Pricing**: ~$1-3 per verification
- **Best for**: Balance of speed and cost

### 5. **Stripe Identity** (Recommended for Stripe Users)
- **Pros**:
  - Native Stripe integration (if already using Stripe)
  - Simplified setup
  - Unified dashboard
- **Pricing**: $1.50 per verification
- **Best for**: Platforms already using Stripe (like ours)

## Recommended Approach: Stripe Identity + Backend Verification

Since the platform already uses Stripe for payments, **Stripe Identity** is the recommended primary solution:

### Advantages:
1. ✅ Already integrated payment infrastructure
2. ✅ Unified dashboard for payments + KYC
3. ✅ GDPR and SOC 2 compliant
4. ✅ Competitive pricing ($1.50 per check)
5. ✅ Simple API integration
6. ✅ Supports 40+ countries
7. ✅ Real-time verification results

## Implementation Architecture

### Frontend Integration

```typescript
// frontend/components/KYCVerification.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, IdentityVerification } from '@stripe/react-stripe-js';

interface KYCVerificationProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function KYCVerification({ onComplete, onError }: KYCVerificationProps) {
  const { user } = useAuth();
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      setStripe(stripeInstance);
    };
    initializeStripe();
  }, []);

  const createVerificationSession = async () => {
    if (!user?.address) return;

    try {
      const response = await fetch('/api/kyc/create-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.address,
        }),
      });

      const { verificationSessionId: sessionId } = await response.json();
      setVerificationSessionId(sessionId);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createVerificationSession();
  }, [user]);

  if (loading || !stripe || !verificationSessionId) {
    return <div>Loading verification...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Identity Verification
        </h2>
        <p className="text-gray-600 mb-6">
          To comply with financial regulations, we need to verify your identity. 
          This process typically takes 1-2 minutes.
        </p>

        <Elements stripe={stripe}>
          <IdentityVerification
            id={verificationSessionId}
            onComplete={() => {
              onComplete?.();
            }}
            onError={(error) => {
              onError?.(error.message);
            }}
          />
        </Elements>
      </div>
    </div>
  );
}
```

### Backend API Routes

```typescript
// frontend/app/api/kyc/create-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create verification session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId,
      },
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_matching_selfie: true,
        },
      },
    });

    return NextResponse.json({
      verificationSessionId: verificationSession.id,
      clientSecret: verificationSession.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating verification session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create verification session' },
      { status: 500 }
    );
  }
}

// frontend/app/api/kyc/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { verificationSessionId } = await request.json();

    const session = await stripe.identity.verificationSessions.retrieve(
      verificationSessionId
    );

    return NextResponse.json({
      status: session.status,
      verified: session.status === 'verified',
      type: session.type,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// frontend/app/api/kyc/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle verification session completed
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.userId;

    if (userId) {
      // Update user KYC status in your database/storage
      // This is where you'd update the user's profile
      // For now, we'll use localStorage pattern (in production, use a database)
      console.log(`User ${userId} verified successfully`);
      
      // TODO: Update user profile with KYC status
      // await updateUserKYCStatus(userId, true);
    }
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    // Handle cases where additional information is needed
    console.log('Verification requires additional input:', session.id);
  }

  return NextResponse.json({ received: true });
}
```

### Profile Utilities Extension

```typescript
// Add to frontend/lib/profile-utils.ts

export interface UserProfile {
  // ... existing fields
  kycStatus?: {
    verified: boolean;
    verificationDate?: number;
    verificationId?: string;
    provider?: 'stripe' | 'sumsub' | 'onfido' | 'custom';
  };
}

export const updateKYCStatus = (
  address: string,
  status: {
    verified: boolean;
    verificationDate?: number;
    verificationId?: string;
    provider?: string;
  }
): UserProfile | null => {
  const profile = getUserProfile(address);
  if (!profile) return null;

  profile.kycStatus = {
    verified: status.verified,
    verificationDate: status.verificationDate || Date.now(),
    verificationId: status.verificationId,
    provider: status.provider as any,
  };

  saveUserProfile(address, profile);
  return profile;
};

export const isKYCVerified = (address: string): boolean => {
  const profile = getUserProfile(address);
  return profile?.kycStatus?.verified || false;
};
```

## Implementation Steps

### Phase 1: Basic Integration (Week 1-2)
1. ✅ Set up Stripe Identity in Stripe Dashboard
2. ✅ Install Stripe SDK: `npm install @stripe/stripe-js @stripe/react-stripe-js`
3. ✅ Create API routes for verification session creation
4. ✅ Add KYC status to user profile
5. ✅ Create basic KYC verification component

### Phase 2: UI Integration (Week 2-3)
1. ✅ Add KYC verification section to Profile tab
2. ✅ Add KYC status badge/indicator
3. ✅ Implement verification flow with proper error handling
4. ✅ Add loading states and user feedback

### Phase 3: Gating & Restrictions (Week 3-4)
1. ✅ Add KYC requirement check before large transactions
2. ✅ Limit features for unverified users
3. ✅ Display verification requirements clearly
4. ✅ Add reminders for incomplete verifications

### Phase 4: Webhooks & Automation (Week 4)
1. ✅ Set up Stripe webhook endpoint
2. ✅ Handle verification status updates automatically
3. ✅ Send notifications on verification completion
4. ✅ Implement retry logic for failed verifications

### Phase 5: Compliance & Testing (Week 5)
1. ✅ Test verification flow with real documents
2. ✅ Implement document type validation
3. ✅ Add admin panel for KYC management (optional)
4. ✅ Document compliance procedures

## UX Recommendations

### 1. Progressive Disclosure
- Don't require KYC immediately on signup
- Require KYC when:
  - User tries to invest > €1000
  - User tries to withdraw funds
  - User accumulates > €5000 in investments
  - User requests enhanced features

### 2. Clear Communication
```typescript
// Example KYC gate component
export function KYCGate({ children, requiredAmount }: { 
  children: React.ReactNode; 
  requiredAmount?: number;
}) {
  const { user } = useAuth();
  const isVerified = user?.address ? isKYCVerified(user.address) : false;

  if (!isVerified) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verification Required
        </h3>
        <p className="text-gray-600 mb-4">
          {requiredAmount 
            ? `To invest more than €${requiredAmount}, please verify your identity.`
            : 'Please verify your identity to continue.'
          }
        </p>
        <Link href="/profile?tab=verification">
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            Start Verification
          </button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 3. Status Indicators
- Green badge: "Verified" (checkmark icon)
- Yellow badge: "Pending Verification"
- Red badge: "Verification Failed" (with retry option)
- Gray badge: "Not Verified"

### 4. User-Friendly Messages
- ✅ "Verification usually takes 1-2 minutes"
- ✅ "We use bank-level security to protect your data"
- ✅ "You only need to verify once"
- ❌ Avoid technical jargon
- ❌ Don't make it seem invasive

## Security Considerations

1. **Data Storage**
   - Store only verification status, not actual documents
   - Use Stripe's secure storage for sensitive data
   - Encrypt any verification metadata

2. **Privacy**
   - Clearly communicate data usage
   - Comply with GDPR (delete user data on request)
   - Only request necessary information

3. **Rate Limiting**
   - Limit verification attempts (e.g., 3 per day)
   - Prevent abuse/automation
   - Monitor for suspicious patterns

## Cost Estimation

### Stripe Identity:
- €1.50 per verification attempt
- Estimated: 50-200 verifications/month = €75-300/month
- No monthly fees

### Alternative Providers:
- Sumsub: €0.50-2.00 per check
- Onfido: €2-4 per check
- Veriff: €1-3 per check

## Alternative: Self-Service KYC (Not Recommended)

You could build your own KYC, but it's **not recommended** because:
- ❌ Requires deep expertise in document verification
- ❌ Must maintain compliance with multiple jurisdictions
- ❌ High development and maintenance costs
- ❌ Risk of fraud and false positives
- ❌ Time-consuming to build and test

**Recommendation**: Use a proven third-party provider.

## Testing Checklist

- [ ] Test with valid documents from different countries
- [ ] Test with invalid/expired documents
- [ ] Test verification failure scenarios
- [ ] Test webhook delivery and processing
- [ ] Test UI flows for verified/unverified users
- [ ] Test transaction gating based on KYC status
- [ ] Verify GDPR compliance (data deletion)
- [ ] Test mobile responsiveness

## Next Steps

1. **Decide on provider**: Stripe Identity (recommended) or alternative
2. **Set up Stripe Identity** in Stripe Dashboard
3. **Create API routes** for verification session management
4. **Build KYC component** and integrate into Profile tab
5. **Implement gating logic** for transactions
6. **Set up webhooks** for status updates
7. **Test thoroughly** with real documents
8. **Deploy and monitor** verification success rates

## Resources

- [Stripe Identity Documentation](https://stripe.com/docs/identity)
- [Stripe Identity API Reference](https://stripe.com/docs/api/identity/verification_sessions)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [KYC Best Practices](https://www.fatf-gafi.org/publications/fatfrecommendations/documents/fatf-recommendations.html)

