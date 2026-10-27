# Pyr and Co

Storefront for **pyrandco.com**: a static shop page with a cart, and Stripe Checkout for payment. Hosted on Vercel, domain on GoDaddy.

## How it works

- `public/` is the website (plain HTML, CSS and JS, no build step).
- `public/products.js` is the catalog: names, prices (in cents), choices (style, color, size) and images. Both the page and checkout use this one file. Everything is print-on-demand through Printful.
- `public/design.js` draws the custom name artwork (Pyr silhouette + name). The live preview on the page and the print file sent to Printful come from the same code, so what customers see is what gets printed.
- `api/checkout.js` checks the cart against the catalog, creates a Stripe Checkout Session, and sends the customer to Stripe's payment page. Every choice and the name are saved on the Stripe line items.
- `api/stripe-webhook.js` runs when a payment completes. It ignores other sales on the shared Stripe account and creates the Printful order: custom name items get a print file from `api/print-file.js`, and fixed designs are matched by External ID (below). Orders land in Printful as **drafts** so you can review them, until you set `PRINTFUL_CONFIRM_ORDERS=true`.

## Setup

1. **Stripe** (downtowndigitalden account): copy the secret key from Developers > API keys. Start with the `sk_test_...` key.
2. **Stripe webhook**: Developers > Webhooks > Add endpoint, URL `https://pyrandco.com/api/stripe-webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret.
3. **Printful**: create a private token under Developers > Your tokens (orders scope).
4. **Printful products** for the fixed designs (vintage tee, night barker tee, Pyr Mom/Dad sweatshirt, Christmas sweatshirt, calendar, mug, bandana, hat, decal): create them in Printful and set each variant's **External ID** to the product id from `products.js` plus the choices, separated by colons. For example `moose-vintage-tee:M`, `pyr-parent-sweatshirt:Pyr Mom:L`, `dog-hair-mug`. Custom name shirts need no setup: they use the Bella+Canvas 3001 tee, Gildan 18000 crewneck and Gildan 18500 hoodie from the Printful catalog (see `lib/printful.js`).
5. **Vercel**: import this repo (framework preset "Other") and add the variables from `.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PRINTFUL_API_KEY`, `SITE_URL=https://pyrandco.com`.
6. **GoDaddy**: add `pyrandco.com` and `www.pyrandco.com` in Vercel under Settings > Domains, then create the DNS records Vercel shows you in GoDaddy's DNS manager.
7. In Stripe, turn on **Settings > Emails > Successful payments** so customers get receipts.

Sleeve names on the Pyr Mom / Dad sweatshirt aren't automated yet: the name shows on the draft order item in Printful, and you add the sleeve text there before confirming.

## Local development

```bash
npm install
cp .env.example .env   # add your sk_test_ key
npm run dev            # http://localhost:3000
npm test
```

Test card: `4242 4242 4242 4242`, any future date, any CVC.
