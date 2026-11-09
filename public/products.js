// Single source of truth for the catalog. The browser imports this to render
// the shop, and the checkout function imports it to look up real prices and
// validate choices, so a customer can never change what they pay from the
// browser.
//
// Everything is print-on-demand (Printful), so there is no stock to track.
// Prices are in cents (USD).
//
// options: choices the customer must make. A value can carry its own price
//          (used for the tee / crewneck / hoodie styles).
// text:    a personalization field (the name). Rules live in design.js.
const APPAREL_SIZES = ["S", "M", "L", "XL", "2XL"];

// Shirt colors for the custom name products. `ink` picks the print color:
// white ink on dark shirts, charcoal on light ones.
export const COLORS = {
  Black: { hex: "#1d1f20", ink: "light" },
  Navy: { hex: "#1f2a44", ink: "light" },
  "Forest Green": { hex: "#2c4a3a", ink: "light" },
  "Heather Gray": { hex: "#b9b9b6", ink: "dark" },
  White: { hex: "#f7f7f5", ink: "dark" },
};

export const products = [
  {
    id: "custom-name-pyr",
    name: "Your Pyr, Your Name",
    description: "Our Pyr silhouette with your dog's name underneath. Pick a tee, crewneck or hoodie.",
    custom: true,
    price: 3400,
    tag: "Personalized",
    options: [
      {
        key: "style",
        label: "Style",
        values: [
          { value: "Tee", price: 3400 },
          { value: "Crewneck", price: 5000 },
          { value: "Hoodie", price: 5800 },
        ],
      },
      { key: "color", label: "Color", values: Object.keys(COLORS) },
      { key: "size", label: "Size", values: APPAREL_SIZES },
    ],
    text: { key: "name", label: "Name", placeholder: "MOOSE", required: true },
  },
  {
    id: "moose-vintage-tee",
    name: "Moose Vintage Tee",
    description: "Faded black tee with a retro sunset print of Moose.",
    price: 3200,
    image: "/img/vintage-tee.jpg",
    tag: "Bestseller",
    options: [{ key: "size", label: "Size", values: APPAREL_SIZES }],
  },
  {
    id: "night-barker-tee",
    name: "Professional Night Barker Tee",
    description: "For everyone who knows about the 2 a.m. patrol shift.",
    price: 3200,
    image: "/img/night-barker-tee.jpg",
    options: [{ key: "size", label: "Size", values: APPAREL_SIZES }],
  },
  {
    id: "pyr-parent-sweatshirt",
    name: "Embroidered Pyr Mom / Dad Sweatshirt",
    description: "Embroidered on the chest, with your Pyr's name on the sleeve if you like.",
    price: 5800,
    image: "/img/pyr-mom-sweatshirt.jpg",
    options: [
      { key: "text", label: "Says", values: ["Pyr Mom", "Pyr Dad"] },
      { key: "size", label: "Size", values: APPAREL_SIZES },
    ],
    text: { key: "name", label: "Sleeve name (optional)", placeholder: "MOOSE", required: false },
  },
  {
    id: "christmas-pyr-sweatshirt",
    name: "Christmas Pyr Sweatshirt",
    description: "Forest green crewneck with a scarf-wearing Pyr. Holiday card ready.",
    price: 4800,
    image: "/img/christmas-sweatshirt.jpg",
    tag: "Holiday",
    options: [{ key: "size", label: "Size", values: APPAREL_SIZES }],
  },
  {
    id: "moose-calendar-2027",
    name: "2027 Moose Wall Calendar",
    description: "Twelve months of Moose. 11 x 8.5 in, spiral bound.",
    price: 3000,
    image: "/img/calendar.jpg",
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
    addon: true,
    options: [{ key: "size", label: "Size", values: ["M", "L", "XL"] }],
  },
  {
    id: "pyr-dad-hat",
    name: "Embroidered Dad Hat",
    description: "Small embroidered Pyr silhouette. One size, adjustable.",
    price: 3200,
    image: "/img/hat.jpg",
    addon: true,
  },
  {
    id: "pyr-on-board-decal",
    name: "\"Pyr on Board\" Decal",
    description: "Weatherproof vinyl decal for your car or cooler.",
    price: 700,
    image: "/img/decal.jpg",
    addon: true,
  },
];

export const MAX_QTY = 10;

export function findProduct(id) {
  return products.find((p) => p.id === id);
}

export function optionValues(option) {
  return option.values.map((v) => (typeof v === "string" ? { value: v } : v));
}

// Price for a product with the given choices (a priced option value wins).
export function priceFor(product, options = {}) {
  let price = product.price;
  for (const option of product.options || []) {
    const chosen = optionValues(option).find((v) => v.value === options[option.key]);
    if (chosen?.price) price = chosen.price;
  }
  return price;
}

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
