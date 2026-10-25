# Pyr and Co

Storefront for **pyrandco.com**: a static shop page with a cart, and Stripe Checkout for payment. Hosted on Vercel, domain on GoDaddy.

## How it works

- `public/` is the website (plain HTML, CSS and JS, no build step).
- `public/products.js` is the catalog. Edit names, prices (in cents), sizes and images here. All items are print-on-demand. Both the page and the checkout use this one file.
- `api/checkout.js` is a Vercel serverless function. It looks up real prices from the catalog, creates a Stripe Checkout Session, and sends the customer to Stripe's hosted payment page (card, Apple Pay, Google Pay, Link).
- After paying, the customer lands on `/success`. Stripe emails the receipt; orders show up in the Stripe dashboard.

## Setup

1. **Stripe** (downtowndigitalden account): copy the secret key from Developers > API keys. Start with the `sk_test_...` key.
2. **Vercel**: import this repo as a new project (framework preset "Other"). Under Settings > Environment Variables add:
   - `STRIPE_SECRET_KEY` = the Stripe secret key
   - `SITE_URL` = `https://pyrandco.com` (optional, used for redirect links)
3. **GoDaddy**: in Vercel, add `pyrandco.com` and `www.pyrandco.com` under Settings > Domains, then create the DNS records Vercel shows you in GoDaddy's DNS manager (usually an `A` record for `@` and a `CNAME` for `www`).
4. In Stripe, turn on **Settings > Emails > Successful payments** so customers get receipts, and set the public business name to Pyr and Co.

## Local development

```bash
npm install
cp .env.example .env   # add your sk_test_ key
npm run dev            # http://localhost:3000
npm test
```

Test card: `4242 4242 4242 4242`, any future date, any CVC.
