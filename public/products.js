// Single source of truth for the catalog. The browser imports this to render
// the shop, and the checkout function imports it to look up real prices, so a
// customer can never change what they pay from the browser.
//
// Everything is print-on-demand (Printful / Printify), so there is no stock to
// track. Prices are in cents (USD). Product photos are Higgsfield mockups; swap
// in the real Printful mockups once the Moose designs are final. `sizes` makes the customer pick one before adding to cart.
const APPAREL_SIZES = ["S", "M", "L", "XL", "2XL"];

export const products = [
  {
    id: "moose-tee",
    name: "Moose Line-Art Tee",
    description: "Soft Bella+Canvas tee with Moose in clean line art.",
    price: 3000,
    image: "/img/tee.jpg",
    sizes: APPAREL_SIZES,
    tag: "Bestseller",
  },
  {
    id: "night-barker-hoodie",
    name: "Professional Night Barker Hoodie",
    description: "Heavyweight hoodie for the 2 a.m. patrol shift.",
    price: 6000,
    image: "/img/hoodie.jpg",
    sizes: APPAREL_SIZES,
    tag: "New",
  },
  {
    id: "pyr-dad-hat",
    name: "Embroidered Dad Hat",
    description: "Small embroidered Moose silhouette. One size, adjustable.",
    price: 3200,
    image: "/img/hat.jpg",
  },
  {
    id: "dog-hair-mug",
    name: "Coffee and Dog Hair Mug",
    description: "15 oz mug. \"Fueled by coffee and dog hair.\"",
    price: 2000,
    image: "/img/mug.jpg",
  },
  {
    id: "pyr-bandana",
    name: "Pyr and Co Dog Bandana",
    description: "For the Pyr themselves. Tag us when they wear it.",
    price: 2200,
    image: "/img/bandana.jpg",
    sizes: ["M", "L", "XL"],
  },
  {
    id: "pyr-on-board-decal",
    name: "\"Pyr on Board\" Decal",
    description: "Weatherproof vinyl decal for your car or cooler.",
    price: 700,
    image: "/img/decal.jpg",
  },
];

export const MAX_QTY = 10;

export function findProduct(id) {
  return products.find((p) => p.id === id);
}

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
