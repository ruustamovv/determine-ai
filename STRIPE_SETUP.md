# How to Connect Stripe and Receive Payments

## Step 1: Create a Stripe Account
1. Go to https://stripe.com
2. Click "Start now" and create an account
3. Complete the verification process
4. You'll get access to the Stripe Dashboard

## Step 2: Get Your API Keys
1. In Stripe Dashboard, go to **Developers > API Keys**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy the **Secret key**

## Step 3: Add Keys to Your Project
Open your `.env` file and add:

```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
SUCCESS_URL=http://localhost:8000
CANCEL_URL=http://localhost:8000
```

## Step 4: Set Up Webhooks (for automatic subscription activation)
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set the URL to: `https://yourdomain.com/api/premium/webhook`
   - For local testing, use Stripe CLI: `stripe listen --forward-to localhost:8000/api/premium/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook signing secret** and add it to `.env`

## Step 5: Install Stripe Python Package
```bash
pip install stripe
```

## How It Works
1. User clicks "Upgrade" on a pricing card
2. Backend creates a Stripe Checkout Session
3. User is redirected to Stripe's secure payment page
4. User enters card details and pays
5. Stripe sends a webhook to your server
6. Your server activates the user's plan
7. User is redirected back to your app

## Test Mode vs Live Mode
- **Test mode**: Use test cards (4242 4242 4242 4242) - no real money
- **Live mode**: Real payments - requires Stripe account activation

## Test Card Numbers
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Auth required: `4000 0025 0000 3155`

## Important Notes
- Without Stripe keys configured, plans are activated directly (demo mode)
- All payment data goes through Stripe - you never see card numbers
- Stripe takes 2.9% + 30¢ per transaction
- You receive payouts to your bank account every 2 weeks
