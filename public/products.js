// Single source of truth for the catalog. The browser imports this to render
// the shop, and the checkout function imports it to look up real prices, so a
// customer can never change what they pay from the browser.
//
// Prices are in cents (USD). Swap these placeholders for the real products.
export const products = [
  {
    id: "pyr-hoodie",
    name: "Gentle Giant Hoodie",
    description: "Heavyweight cotton hoodie with an embroidered Pyr crest.",
    price: 5800,
    image: "/img/hoodie.svg",
    tag: "Bestseller",
  },
  {
    id: "pyr-mug",
    name: "Night Watch Mug",
    description: "15 oz stoneware mug for the 2 a.m. barking shift.",
    price: 2400,
    image: "/img/mug.svg",
  },
  {
    id: "pyr-blanket",
    name: "Fluff Season Throw",
    description: "Sherpa-lined throw blanket. Fur-colored, conveniently.",
    price: 6900,
    image: "/img/blanket.svg",
    tag: "New",
  },
  {
    id: "pyr-leash",
    name: "Mountain Rope Leash",
    description: "6 ft climbing-rope leash rated for 150 lb pullers.",
    price: 3400,
    image: "/img/leash.svg",
  },
  {
    id: "pyr-print",
    name: "Pyr Portrait Print",
    description: "Archival 11x14 art print of a Pyr on patrol.",
    price: 2900,
    image: "/img/print.svg",
  },
  {
    id: "pyr-brush",
    name: "Undercoat Rake",
    description: "Double-row rake built for the double coat. You will need it.",
    price: 1900,
    image: "/img/brush.svg",
  },
];

export const MAX_QTY = 10;

export function findProduct(id) {
  return products.find((p) => p.id === id);
}

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
