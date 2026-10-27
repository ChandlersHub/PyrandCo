import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrder } from "../lib/printful.js";
import { renderPrintFile } from "../lib/print-file.js";
import { INK } from "../public/design.js";

const session = {
  id: "cs_test_123",
  payment_intent: "pi_3Abc1234567890abcdefghij",
  customer_details: { name: "Pat Pyr", email: "pat@example.com", phone: null },
  collected_information: {
    shipping_details: {
      name: "Pat Pyr",
      address: { line1: "1 Snow Rd", line2: null, city: "Bend", state: "OR", country: "US", postal_code: "97701" },
    },
  },
  shipping_cost: { amount_total: 595 },
};

const line = (metadata, unit_amount, quantity = 1) => ({
  quantity,
  description: "x",
  price: { unit_amount, product: { metadata } },
});

test("builds a Printful order with a rendered print file for custom names", async () => {
  const calls = [];
  const order = await buildOrder(
    session,
    [
      line({ product_id: "custom-name-pyr", style: "Hoodie", color: "Heather Gray", size: "L", name: "O'MALLEY" }, 5800),
      line({ product_id: "moose-vintage-tee", size: "M" }, 3200, 2),
    ],
    {
      siteUrl: "https://pyrandco.com",
      findVariantId: async (...args) => (calls.push(args), 999),
    }
  );
  assert.deepEqual(calls, [[146, "Sport Grey", "L"]]);
  assert.equal(order.external_id, "pi_3Abc1234567890abcdefghij");
  assert.equal(order.recipient.state_code, "OR");
  assert.equal(order.recipient.zip, "97701");
  assert.equal(order.retail_costs.shipping, "5.95");
  const [custom, fixed] = order.items;
  assert.equal(custom.variant_id, 999);
  assert.equal(custom.retail_price, "58.00");
  assert.equal(custom.files[0].url, "https://pyrandco.com/api/print-file?name=O'MALLEY&ink=dark");
  assert.deepEqual(fixed, { external_variant_id: "moose-vintage-tee:M", quantity: 2, retail_price: "32.00" });
});

test("print file renders the silhouette and the name", () => {
  const png = renderPrintFile({ name: "MOOSE", ink: INK.dark });
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.ok(png.length > 10000, `png is ${png.length} bytes`);
});

test("webhook verifies the signature and ignores other stores' sales", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const { default: Stripe } = await import("stripe");
  const { POST } = await import("../api/stripe-webhook.js");
  const stripe = new Stripe("sk_test_dummy");
  const send = (payload, secret = "whsec_test") => {
    const body = JSON.stringify(payload);
    const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
    return POST(new Request("https://pyrandco.com/api/stripe-webhook", { method: "POST", body, headers: { "stripe-signature": sig } }));
  };
  const event = (metadata) => ({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", payment_status: "paid", metadata } },
  });

  assert.equal((await send(event({ store: "pyrandco" }), "whsec_wrong")).status, 400);
  assert.deepEqual(await (await send(event({}))).json(), { ignored: true });
  delete process.env.PRINTFUL_API_KEY;
  assert.deepEqual(await (await send(event({ store: "pyrandco" }))).json(), { skipped: "printful not configured" });
});
