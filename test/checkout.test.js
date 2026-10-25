import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLineItems, shippingFor, SHIPPING_CENTS } from "../lib/checkout.js";
import { findProduct } from "../public/products.js";

test("uses catalog prices, not anything from the browser", () => {
  const [li] = buildLineItems([{ id: "dog-hair-mug", qty: 2, price: 1 }]);
  assert.equal(li.price_data.unit_amount, findProduct("dog-hair-mug").price);
  assert.equal(li.quantity, 2);
});

test("sized items carry the size to Stripe", () => {
  const [li] = buildLineItems([{ id: "moose-tee", size: "L", qty: 1 }]);
  assert.match(li.price_data.product_data.name, /\(L\)$/);
  assert.equal(li.price_data.product_data.metadata.size, "L");
});

test("rejects bad carts", () => {
  assert.throws(() => buildLineItems([]));
  assert.throws(() => buildLineItems([{ id: "nope", qty: 1 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", qty: 0 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", qty: 1.5 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", qty: 99 }]));
  assert.throws(() => buildLineItems([{ id: "moose-tee", qty: 1 }]), /size/);
  assert.throws(() => buildLineItems([{ id: "moose-tee", size: "XXXXL", qty: 1 }]), /size/);
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", size: "L", qty: 1 }]), /size/);
});

test("free shipping over threshold", () => {
  const cheap = buildLineItems([{ id: "pyr-on-board-decal", qty: 1 }]);
  const big = buildLineItems([{ id: "night-barker-hoodie", size: "M", qty: 2 }]);
  assert.equal(shippingFor(cheap), SHIPPING_CENTS);
  assert.equal(shippingFor(big), 0);
});
