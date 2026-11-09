import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLineItems, shippingFor, SHIPPING_CENTS } from "../lib/checkout.js";
import { cleanName } from "../public/design.js";

const custom = (over = {}) => ({
  id: "custom-name-pyr",
  options: { style: "Hoodie", color: "Black", size: "L" },
  text: "moose",
  qty: 1,
  ...over,
});

test("uses catalog prices, not anything from the browser", () => {
  const [li] = buildLineItems([{ id: "dog-hair-mug", qty: 2, price: 1 }]);
  assert.equal(li.price_data.unit_amount, 2000);
  assert.equal(li.quantity, 2);
});

test("custom name items are priced by style and carry choices + name to Stripe", () => {
  const [hoodie] = buildLineItems([custom()]);
  assert.equal(hoodie.price_data.unit_amount, 5800);
  assert.deepEqual(hoodie.price_data.product_data.metadata, {
    product_id: "custom-name-pyr",
    style: "Hoodie",
    color: "Black",
    size: "L",
    name: "MOOSE",
  });
  const [tee] = buildLineItems([custom({ options: { style: "Tee", color: "White", size: "S" } })]);
  assert.equal(tee.price_data.unit_amount, 3400);
});

test("name rules", () => {
  assert.equal(cleanName("  o’malley  jr "), "O'MALLEY JR");
  assert.equal(cleanName("Moose-2"), "MOOSE-2");
  assert.equal(cleanName(""), "");
  assert.equal(cleanName("THIRTEENCHARS"), null);
  assert.equal(cleanName("<b>"), null);
  assert.equal(cleanName("Moose!"), null);
});

test("rejects bad custom items", () => {
  assert.throws(() => buildLineItems([custom({ text: "" })]), /Add a name/);
  assert.throws(() => buildLineItems([custom({ text: "TOO LONG A NAME" })]), /can't be printed/);
  assert.throws(() => buildLineItems([custom({ options: { style: "Tank", color: "Black", size: "L" } })]), /style/);
  assert.throws(() => buildLineItems([custom({ options: { style: "Tee", color: "Pink", size: "L" } })]), /color/);
  assert.throws(() => buildLineItems([custom({ options: { style: "Tee", color: "Black" } })]), /size/);
  assert.throws(() => buildLineItems([custom({ options: { style: "Tee", color: "Black", size: "L", x: 1 } })]), /Unexpected/);
});

test("optional sleeve name on the Mom / Dad sweatshirt", () => {
  const base = { id: "pyr-parent-sweatshirt", options: { text: "Pyr Dad", size: "XL" }, qty: 1 };
  assert.equal(buildLineItems([base])[0].price_data.product_data.metadata.name, undefined);
  assert.equal(buildLineItems([{ ...base, text: "Luna" }])[0].price_data.product_data.metadata.name, "LUNA");
});

test("rejects bad carts", () => {
  assert.throws(() => buildLineItems([]));
  assert.throws(() => buildLineItems([{ id: "nope", qty: 1 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", qty: 0 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", qty: 1.5 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", qty: 99 }]));
  assert.throws(() => buildLineItems([{ id: "dog-hair-mug", text: "MOOSE", qty: 1 }]), /personalized/);
  assert.throws(() => buildLineItems([{ id: "moose-vintage-tee", qty: 1 }]), /size/);
});

test("free shipping over threshold", () => {
  assert.equal(shippingFor(buildLineItems([{ id: "pyr-on-board-decal", qty: 1 }])), SHIPPING_CENTS);
  assert.equal(shippingFor(buildLineItems([custom({ qty: 2 })])), 0);
});
