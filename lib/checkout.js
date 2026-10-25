import { findProduct, MAX_QTY } from "../public/products.js";

// Flat-rate shipping, free over the threshold. Placeholder numbers.
export const SHIPPING_CENTS = 795;
export const FREE_SHIPPING_OVER_CENTS = 7500;

// Turns the cart sent by the browser ([{ id, qty }]) into Stripe line items,
// using catalog prices only. Throws on anything unexpected.
export function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");
  if (items.length > 50) throw new Error("Too many items");

  return items.map(({ id, qty }) => {
    const product = findProduct(id);
    if (!product) throw new Error(`Unknown product: ${id}`);
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new Error(`Invalid quantity for ${id}`);
    }
    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: product.price,
        product_data: { name: product.name, description: product.description, metadata: { product_id: product.id } },
      },
    };
  });
}

export function shippingFor(lineItems) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);
  return subtotal >= FREE_SHIPPING_OVER_CENTS ? 0 : SHIPPING_CENTS;
}
