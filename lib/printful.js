import { COLORS } from "../public/products.js";

const API = "https://api.printful.com";

// Blank garments for the custom name products, as Printful catalog products,
// with our color names mapped to Printful's. Check these in the Printful
// catalog before launch if you change blanks.
export const CUSTOM_BLANKS = {
  Tee: {
    productId: 71, // Bella+Canvas 3001
    colors: { Black: "Black", Navy: "Navy", "Forest Green": "Forest", "Heather Gray": "Athletic Heather", White: "White" },
  },
  Crewneck: {
    productId: 145, // Gildan 18000
    colors: { Black: "Black", Navy: "Navy", "Forest Green": "Forest Green", "Heather Gray": "Sport Grey", White: "White" },
  },
  Hoodie: {
    productId: 146, // Gildan 18500
    colors: { Black: "Black", Navy: "Navy", "Forest Green": "Forest Green", "Heather Gray": "Sport Grey", White: "White" },
  },
};

// Fixed-design products are set up once in Printful. Give each Printful
// variant this "External ID", e.g. "moose-vintage-tee:M" or
// "pyr-parent-sweatshirt:Pyr Mom:L", and orders find them automatically.
export function externalVariantId(productId, options) {
  return [productId, ...Object.values(options)].join(":");
}

// Builds a Printful order from a paid Stripe Checkout Session and its line
// items (with expanded products). `findVariantId(productId, color, size)`
// looks up catalog variant ids for the custom name blanks.
export async function buildOrder(session, lineItems, { siteUrl, findVariantId }) {
  const shipping = session.collected_information?.shipping_details || session.shipping_details;
  const customer = session.customer_details || {};
  const address = shipping?.address || customer.address;
  if (!address) throw new Error(`No shipping address on ${session.id}`);

  const items = [];
  for (const li of lineItems) {
    const meta = li.price?.product?.metadata || {};
    const { product_id: productId, name, ...options } = meta;
    const retail_price = (li.price.unit_amount / 100).toFixed(2);

    if (productId === "custom-name-pyr") {
      const blank = CUSTOM_BLANKS[options.style];
      const variantId = await findVariantId(blank.productId, blank.colors[options.color], options.size);
      const ink = COLORS[options.color].ink;
      const file = `${siteUrl}/api/print-file?name=${encodeURIComponent(name)}&ink=${ink}`;
      items.push({
        variant_id: variantId,
        quantity: li.quantity,
        retail_price,
        name: `Custom Pyr ${options.style}: ${name}`,
        files: [{ type: "front", url: file }],
      });
    } else {
      items.push({
        external_variant_id: externalVariantId(productId, options),
        quantity: li.quantity,
        retail_price,
        // Sleeve names are added by hand while the order is a draft.
        ...(name ? { name: `${li.description} (sleeve name: ${name})` } : {}),
      });
    }
  }

  return {
    // Printful caps external_id at 32 characters; the payment intent id fits.
    external_id: String(session.payment_intent || session.id).slice(-32),
    shipping: "STANDARD",
    recipient: {
      name: shipping?.name || customer.name,
      address1: address.line1,
      address2: address.line2 || undefined,
      city: address.city,
      state_code: address.state,
      country_code: address.country,
      zip: address.postal_code,
      email: customer.email,
      phone: customer.phone || undefined,
    },
    items,
    retail_costs: {
      shipping: ((session.shipping_cost?.amount_total ?? 0) / 100).toFixed(2),
    },
  };
}

function headers() {
  const h = { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`, "Content-Type": "application/json" };
  if (process.env.PRINTFUL_STORE_ID) h["X-PF-Store-Id"] = process.env.PRINTFUL_STORE_ID;
  return h;
}

const variantCache = new Map();

// Finds the catalog variant id for a blank in a given color and size.
export async function findVariantId(productId, color, size) {
  if (!variantCache.has(productId)) {
    const res = await fetch(`${API}/products/${productId}`, { headers: headers() });
    if (!res.ok) throw new Error(`Printful catalog ${productId}: HTTP ${res.status}`);
    variantCache.set(productId, (await res.json()).result.variants);
  }
  const variant = variantCache
    .get(productId)
    .find((v) => v.color?.toLowerCase() === color?.toLowerCase() && v.size === size);
  if (!variant) throw new Error(`No Printful variant for product ${productId} ${color} ${size}`);
  return variant.id;
}

// Creates the order. Orders stay drafts for review in Printful unless
// PRINTFUL_CONFIRM_ORDERS=true, which sends them straight to production.
export async function createOrder(order) {
  const confirm = process.env.PRINTFUL_CONFIRM_ORDERS === "true";
  const res = await fetch(`${API}/orders?confirm=${confirm}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(order),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { created: true, id: data.result?.id };
  const message = data.error?.message || data.result || `HTTP ${res.status}`;
  // A retried webhook for an order we already sent.
  if (res.status === 400 && /external.?id/i.test(String(message))) return { created: false, duplicate: true };
  throw new Error(`Printful order failed: ${message}`);
}
