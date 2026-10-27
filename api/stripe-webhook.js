import Stripe from "stripe";
import { buildOrder, createOrder, findVariantId } from "../lib/printful.js";

// POST /api/stripe-webhook
// Stripe calls this when a checkout finishes. Pyr and Co orders are sent to
// Printful for printing; other sales on the shared Stripe account are ignored.
export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Not configured" }, { status: 503 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature"), secret);
  } catch (err) {
    return Response.json({ error: `Bad signature: ${err.message}` }, { status: 400 });
  }

  const relevant = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  const session = event.data.object;
  if (!relevant.includes(event.type) || session.metadata?.store !== "pyrandco" || session.payment_status !== "paid") {
    return Response.json({ ignored: true });
  }
  if (!process.env.PRINTFUL_API_KEY) {
    console.warn(`Order ${session.id} paid, but PRINTFUL_API_KEY is not set. Fulfill it by hand.`);
    return Response.json({ skipped: "printful not configured" });
  }

  try {
    const { data: lineItems } = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });
    const siteUrl = process.env.SITE_URL || new URL(request.url).origin;
    const order = await buildOrder(session, lineItems, { siteUrl, findVariantId });
    const result = await createOrder(order);
    console.log(`Printful order for ${session.id}`, result);
    return Response.json(result);
  } catch (err) {
    // A 500 makes Stripe retry for up to three days.
    console.error(`Printful order for ${session.id} failed`, err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
