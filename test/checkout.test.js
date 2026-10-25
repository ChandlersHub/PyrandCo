import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLineItems, shippingFor, SHIPPING_CENTS } from "../lib/checkout.js";
import { products } from "../public/products.js";

test("uses catalog prices, not anything from the browser", () => {
  const [li] = buildLineItems([{ id: products[0].id, qty: 2, price: 1 }]);
  assert.equal(li.price_data.unit_amount, products[0].price);
  assert.equal(li.quantity, 2);
});

test("rejects bad carts", () => {
  assert.throws(() => buildLineItems([]));
  assert.throws(() => buildLineItems([{ id: "nope", qty: 1 }]));
  assert.throws(() => buildLineItems([{ id: products[0].id, qty: 0 }]));
  assert.throws(() => buildLineItems([{ id: products[0].id, qty: 1.5 }]));
  assert.throws(() => buildLineItems([{ id: products[0].id, qty: 99 }]));
});

test("free shipping over threshold", () => {
  const cheap = buildLineItems([{ id: "pyr-brush", qty: 1 }]);
  const big = buildLineItems([{ id: "pyr-blanket", qty: 2 }]);
  assert.equal(shippingFor(cheap), SHIPPING_CENTS);
  assert.equal(shippingFor(big), 0);
});
