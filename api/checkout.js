import Stripe from "stripe";
import { buildLineItems, shippingFor } from "../lib/checkout.js";

// POST /api/checkout  body: { items: [{ id, qty }] }  ->  { url }
// Creates a Stripe Checkout Session and returns the hosted payment page URL.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: "Checkout is not configured yet" });
  }

  let lineItems;
  try {
    lineItems = buildLineItems(req.body?.items);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const origin = process.env.SITE_URL || `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
  const shipping = shippingFor(lineItems);

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shipping === 0 ? "Free shipping" : "Standard shipping",
            fixed_amount: { amount: shipping, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      allow_promotion_codes: true,
      phone_number_collection: { enabled: false },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    return res.status(502).json({ error: "Could not start checkout. Please try again." });
  }
}
