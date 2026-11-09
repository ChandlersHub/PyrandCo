import { findProduct, optionValues, priceFor, MAX_QTY } from "../public/products.js";
import { cleanName } from "../public/design.js";

// Flat-rate shipping, free over the threshold.
export const SHIPPING_CENTS = 595;
export const FREE_SHIPPING_OVER_CENTS = 7500;

// Checks one cart line from the browser ({ id, options, text, qty }) against
// the catalog. Returns the cleaned line or throws.
export function validateLine({ id, options = {}, text, qty }) {
  const product = findProduct(id);
  if (!product) throw new Error(`Unknown product: ${id}`);

  const productOptions = product.options || [];
  const chosen = {};
  for (const option of productOptions) {
    const value = options[option.key];
    if (!optionValues(option).some((v) => v.value === value)) {
      throw new Error(`Choose a ${option.label.toLowerCase()} for ${product.name}`);
    }
    chosen[option.key] = value;
  }
  if (Object.keys(options).some((key) => !productOptions.some((o) => o.key === key))) {
    throw new Error(`Unexpected option for ${id}`);
  }

  let name = "";
  if (product.text) {
    name = cleanName(text);
    if (name === null) throw new Error(`That name can't be printed on ${product.name}`);
    if (!name && product.text.required) throw new Error(`Add a name for ${product.name}`);
  } else if (text) {
    throw new Error(`${product.name} can't be personalized`);
  }

  const quantity = Number(qty);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
    throw new Error(`Invalid quantity for ${id}`);
  }
  return { product, options: chosen, name, quantity };
}

// Turns the browser's cart into Stripe line items using catalog prices only.
// Every choice and the name ride along as product metadata so the webhook can
// build the Printful order.
export function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");
  if (items.length > 50) throw new Error("Too many items");

  return items.map((item) => {
    const { product, options, name, quantity } = validateLine(item);
    const details = Object.values(options);
    const metadata = { product_id: product.id, ...options };
    if (name) metadata.name = name;
    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: priceFor(product, options),
        product_data: {
          name: details.length ? `${product.name} (${details.join(" / ")})` : product.name,
          description: name ? `Name: ${name}` : product.description,
          metadata,
        },
      },
    };
  });
}

export function shippingFor(lineItems) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);
  return subtotal >= FREE_SHIPPING_OVER_CENTS ? 0 : SHIPPING_CENTS;
}
