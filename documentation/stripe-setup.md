# Stripe Connect Setup Guide

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your app URL
```

## Stripe Dashboard Setup

### 1. Create a Stripe Account
- Go to [stripe.com](https://stripe.com) and create an account
- Complete the onboarding process

### 2. Get API Keys
- Go to Developers > API keys in your Stripe dashboard
- Copy your publishable key and secret key
- Use test keys for development

### 3. Enable Connect
- Go to Connect in your Stripe dashboard
- Enable Stripe Connect for your account
- Configure your Connect settings

### 4. Set up Webhooks
- Go to Developers > Webhooks
- Create a new endpoint with URL: `https://yourdomain.com/api/webhooks/stripe`
- Select the following events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `account.updated`
  - `transfer.created`
  - `transfer.updated`
- Copy the webhook secret

## Testing

### Test Cards
Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Bank Accounts
For Connect payouts, use these test bank accounts:
- **Success**: `000123456789`
- **Decline**: `000000000000`

## Connect Account Onboarding

Users will need to complete Connect onboarding to receive payments:

1. Create Connect account via API
2. Redirect to onboarding URL
3. Complete business verification
4. Add bank account for payouts

## Security Considerations

- Never expose secret keys in client-side code
- Always verify webhook signatures
- Use HTTPS in production
- Implement proper error handling
- Monitor webhook events for failures

## Production Checklist

- [ ] Switch to live API keys
- [ ] Update webhook endpoint URL
- [ ] Configure proper error monitoring
- [ ] Set up webhook retry logic
- [ ] Test end-to-end payment flow
- [ ] Verify Connect account onboarding
- [ ] Set up proper logging
- [ ] Configure webhook monitoring 


proven-cheery-affirm-breeze