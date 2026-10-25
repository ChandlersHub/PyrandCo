import { findProduct, MAX_QTY } from "../public/products.js";

// Flat-rate shipping, free over the threshold.
export const SHIPPING_CENTS = 595;
export const FREE_SHIPPING_OVER_CENTS = 7500;

// Turns the cart sent by the browser ([{ id, size?, qty }]) into Stripe line
// items, using catalog prices only. Throws on anything unexpected.
export function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");
  if (items.length > 50) throw new Error("Too many items");

  return items.map(({ id, size, qty }) => {
    const product = findProduct(id);
    if (!product) throw new Error(`Unknown product: ${id}`);
    if (product.sizes ? !product.sizes.includes(size) : size) {
      throw new Error(`Invalid size for ${id}`);
    }
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new Error(`Invalid quantity for ${id}`);
    }
    const metadata = { product_id: product.id };
    if (size) metadata.size = size;
    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: product.price,
        product_data: {
          name: size ? `${product.name} (${size})` : product.name,
          description: product.description,
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
