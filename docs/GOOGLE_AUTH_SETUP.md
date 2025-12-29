# Google Authentication Setup

This guide explains how to set up Google Sign-In for El Toro Negro.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with OAuth 2.0 enabled

## Setup Steps

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External (or Internal for G Suite)
   - App name: El Toro Negro
   - User support email: your email
   - Authorized domains: your domain (e.g., eltoronegro.com)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: El Toro Negro Web Client
   - Authorized JavaScript origins: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

### 2. Get Client ID and Secret

After creating the OAuth client, you'll receive:
- **Client ID**: A public identifier for your application
- **Client Secret**: Keep this secure (server-side only)

### 3. Configure Environment Variables

Create or update `.env.local` in the `frontend` directory:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

**Important**: 
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is used in the browser (public)
- `GOOGLE_CLIENT_SECRET` is only used in API routes (server-side, never exposed)

### 4. Verify Setup

1. Restart your development server after adding environment variables
2. Click "Continue with Google" in the login modal
3. You should see the Google Sign-In popup or redirect

## How It Works

1. User clicks "Continue with Google"
2. Google Identity Services loads (script in layout.tsx)
3. User authenticates with Google
4. Google returns a JWT token (credential)
5. Token is decoded to extract user info (email, name, picture)
6. User session is stored in sessionStorage
7. User is authenticated and can access protected routes

## Security Notes

- JWT tokens are verified client-side (for demo purposes)
- In production, verify tokens on the backend server
- Sessions expire after 7 days
- Sessions are stored in sessionStorage (cleared when browser tab closes)

## Troubleshooting

### "Google Sign-In is not configured"
- Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the development server after adding environment variables

### "Failed to load Google Sign-In"
- Check your internet connection
- Verify the Google Identity Services script is loading (check browser console)
- Check if your domain is authorized in Google Cloud Console

### Redirect URI mismatch
- Ensure the redirect URI in Google Cloud Console exactly matches your callback URL
- Check both protocol (http/https) and port numbers

