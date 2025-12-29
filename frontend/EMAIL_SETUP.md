# Email Verification Setup

## Quick Setup with Resend (Recommended)

### 1. Sign up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### 2. Get API Key

1. Go to [API Keys](https://resend.com/api-keys) in Resend dashboard
2. Click "Create API Key"
3. Give it a name (e.g., "El Toro Negro Development")
4. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

Add to `frontend/.env.local`:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Optional: Custom sender email (must be verified in Resend)
# If not set, uses "onboarding@resend.dev" (default Resend email)
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 4. Verify Domain (Optional, for Production)

For production, you should verify your domain in Resend:

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Add your domain
3. Follow DNS setup instructions
4. Update `RESEND_FROM_EMAIL` to use your verified domain

### 5. Restart Development Server

After adding environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Development Mode

If `RESEND_API_KEY` is not set, the system will:
- Log verification URLs to the console
- Still return tokens for testing the verification flow
- Show a warning message in the console

This allows you to test the email verification flow without setting up an email service.

## Testing

1. Click "Send Verification Email" in the dashboard
2. Check your email inbox (or console if in development mode)
3. Click the verification link
4. You should be redirected to the dashboard with verified status

## Alternative Email Services

If you prefer other services, you can modify `frontend/app/api/email/send-verification/route.ts`:

### SendGrid
```bash
npm install @sendgrid/mail
```

### AWS SES
```bash
npm install @aws-sdk/client-ses
```

### Nodemailer (SMTP)
```bash
npm install nodemailer
```

## Production Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Token Storage**: Store tokens in database (not just localStorage)
3. **Token Expiration**: Tokens should expire after 24 hours
4. **Email Templates**: Use professional email templates
5. **Email Validation**: Validate email format before sending
6. **Error Handling**: Handle email service errors gracefully
7. **Monitoring**: Monitor email delivery rates

