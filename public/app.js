import { products, findProduct, optionValues, priceFor, formatPrice, MAX_QTY, COLORS } from "/products.js";
import { designSvg, cleanName, NAME_MAX, INK } from "/design.js";

const FREE_SHIPPING_OVER = 7500;
const KEY = "pyr-cart-v2";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Cart lines: { id, options: { key: value }, text, qty }. Lines with the same
// product, choices and name stack.
let cart = load();

const lineKey = (l) => JSON.stringify([l.id, l.options, l.text || ""]);

function validLine(l) {
  const p = findProduct(l?.id);
  if (!p || !(l.qty > 0)) return false;
  const opts = p.options || [];
  if (!opts.every((o) => optionValues(o).some((v) => v.value === l.options?.[o.key]))) return false;
  if (!p.text) return !l.text;
  const name = cleanName(l.text);
  return name !== null && (name || !p.text.required);
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(saved) ? saved.filter(validLine) : [];
  } catch {
    return [];
  }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {}
}

function addLine(line) {
  const existing = cart.find((l) => lineKey(l) === lineKey(line));
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + 1);
  else cart.push({ ...line, qty: 1 });
  save();
  renderCart();
  openCart();
}
function setQty(index, qty) {
  qty = Math.max(0, Math.min(MAX_QTY, qty));
  if (qty === 0) cart.splice(index, 1);
  else cart[index].qty = qty;
  save();
  renderCart();
}

/* ---------- Custom name builder ---------- */

const custom = products.find((p) => p.custom);
const state = { style: "Tee", color: "Black", size: "", name: "" };

// Simple garment outlines for the preview, on a 400 x 440 canvas.
const SHAPES = {
  Tee: "M120 40 L160 26 Q200 52 240 26 L280 40 L362 96 L330 152 L296 132 L296 420 L104 420 L104 132 L70 152 L38 96 Z",
  Crewneck: "M120 40 L160 26 Q200 52 240 26 L280 40 Q322 60 336 120 L366 332 L326 340 L296 172 L296 420 L104 420 L104 172 L74 340 L34 332 L64 120 Q78 60 120 40 Z",
};
SHAPES.Hoodie = SHAPES.Crewneck;

function previewSvg() {
  const color = COLORS[state.color];
  const ink = INK[color.ink];
  const stroke = color.ink === "dark" ? "#d6d0c4" : "rgba(0,0,0,0.25)";
  const name = cleanName(state.name) || "YOUR PYR";
  const hood =
    state.style === "Hoodie"
      ? `<path d="M150 42 Q200 -12 250 42 Q200 74 150 42 Z" fill="${color.hex}" stroke="${stroke}" stroke-width="2"/>` +
        `<path d="M150 330 L250 330 L262 392 L138 392 Z" fill="none" stroke="${stroke}" stroke-width="2"/>`
      : "";
  const art = designSvg({ name, ink, attrs: `x="135" y="${state.style === "Hoodie" ? 92 : 80}" width="130" height="130"` });
  return `<svg viewBox="0 0 400 440" role="img" aria-label="Preview: ${esc(state.style)} in ${esc(state.color)} with ${esc(name)}">
    <path d="${SHAPES[state.style]}" fill="${color.hex}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>${hood}${art}</svg>`;
}

function renderCustom() {
  if (!custom) return;
  const [styleOpt, colorOpt, sizeOpt] = custom.options;
  $("custom").innerHTML = `
    <div class="custom-preview" id="custom-preview"></div>
    <div class="custom-form">
      <p class="eyebrow">Personalized</p>
      <h2>${esc(custom.name)}</h2>
      <p class="muted">${esc(custom.description)}</p>
      <label class="field">
        <span>${esc(custom.text.label)} <small id="name-count">0/${NAME_MAX}</small></span>
        <input id="custom-name" maxlength="${NAME_MAX}" placeholder="${esc(custom.text.placeholder)}" autocomplete="off" autocapitalize="characters" />
        <small class="hint" id="name-hint">Letters, numbers, spaces, ' and -</small>
      </label>
      <div class="field"><span>${esc(styleOpt.label)}</span><div class="segmented" role="radiogroup">
        ${optionValues(styleOpt).map((v) => `<button type="button" role="radio" data-style="${esc(v.value)}">${esc(v.value)} <small>${formatPrice(v.price)}</small></button>`).join("")}
      </div></div>
      <div class="field"><span>${esc(colorOpt.label)}: <b id="color-name"></b></span><div class="swatches" role="radiogroup">
        ${optionValues(colorOpt).map((v) => `<button type="button" role="radio" class="swatch" style="--swatch:${COLORS[v.value].hex}" data-color="${esc(v.value)}" aria-label="${esc(v.value)}"></button>`).join("")}
      </div></div>
      <label class="field"><span>${esc(sizeOpt.label)}</span>
        <select id="custom-size" class="size"><option value="">Choose a size</option>${sizeOpt.values.map((s) => `<option>${s}</option>`).join("")}</select>
      </label>
      <div class="custom-buy">
        <span class="price" id="custom-price"></span>
        <button class="btn" id="custom-add">Add to cart</button>
      </div>
    </div>`;
  updateCustom();
}

function updateCustom() {
  $("custom-preview").innerHTML = previewSvg();
  document.querySelectorAll("[data-style]").forEach((b) => b.setAttribute("aria-checked", b.dataset.style === state.style));
  document.querySelectorAll("[data-color]").forEach((b) => b.setAttribute("aria-checked", b.dataset.color === state.color));
  $("color-name").textContent = state.color;
  $("custom-price").textContent = formatPrice(priceFor(custom, state));
  $("name-count").textContent = `${state.name.length}/${NAME_MAX}`;
  const bad = state.name && cleanName(state.name) === null;
  $("name-hint").classList.toggle("error", bad);
  $("custom-name").classList.toggle("needs-input", bad);
}

function addCustom() {
  const name = cleanName(state.name);
  if (!name) {
    $("custom-name").classList.add("needs-input");
    $("custom-name").focus();
    return;
  }
  if (!state.size) {
    $("custom-size").classList.add("needs-input");
    $("custom-size").focus();
    return;
  }
  addLine({ id: custom.id, options: { style: state.style, color: state.color, size: state.size }, text: name });
}

/* ---------- Product grid ---------- */

function card(p) {
  const selects = (p.options || [])
    .map((o) => `<select class="size" data-option="${o.key}" aria-label="${esc(o.label)} for ${esc(p.name)}">
        <option value="">${esc(o.label)}</option>${optionValues(o).map((v) => `<option>${esc(v.value)}</option>`).join("")}
      </select>`)
    .join("");
  const text = p.text
    ? `<input class="text-input" data-text maxlength="${NAME_MAX}" placeholder="${esc(p.text.label)}" aria-label="${esc(p.text.label)}" autocapitalize="characters" />`
    : "";
  return `
    <article class="card" data-product="${p.id}">
      <div class="thumb">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}
        <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="640" height="640" />
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        ${selects || text ? `<div class="card-options">${selects}${text}</div>` : ""}
        <div class="card-foot">
          <span class="price">${formatPrice(p.price)}</span>
          <button class="btn btn-sm" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`;
}

function renderGrid() {
  $("grid").innerHTML = products.filter((p) => !p.custom && !p.addon).map(card).join("");
  $("addons").innerHTML = products.filter((p) => p.addon).map(card).join("");
}

function addFromCard(button) {
  const el = button.closest("[data-product]");
  const p = findProduct(el.dataset.product);
  const options = {};
  for (const select of el.querySelectorAll("[data-option]")) {
    if (!select.value) {
      select.classList.add("needs-input");
      select.focus();
      return;
    }
    options[select.dataset.option] = select.value;
  }
  let text = "";
  const input = el.querySelector("[data-text]");
  if (input) {
    text = cleanName(input.value);
    if (text === null) {
      input.classList.add("needs-input");
      input.focus();
      return;
    }
  }
  addLine(text ? { id: p.id, options, text } : { id: p.id, options });
}

/* ---------- Cart ---------- */

function describe(line) {
  const bits = Object.values(line.options);
  if (line.text) bits.push(`“${line.text}”`);
  return bits.join(" · ");
}

function renderCart() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + priceFor(findProduct(l.id), l.options) * l.qty, 0);

  $("cart-count").textContent = count;
  $("empty").hidden = cart.length > 0;
  $("foot").hidden = cart.length === 0;
  $("subtotal").textContent = formatPrice(subtotal);
  $("ship-note").textContent =
    subtotal >= FREE_SHIPPING_OVER
      ? "You've got free shipping."
      : `Add ${formatPrice(FREE_SHIPPING_OVER - subtotal)} more for free shipping.`;

  $("lines").innerHTML = cart
    .map((l, i) => {
      const p = findProduct(l.id);
      const thumb = p.custom
        ? `<div class="line-art" style="background:${COLORS[l.options.color].hex}">${designSvg({ name: l.text, ink: INK[COLORS[l.options.color].ink], attrs: 'width="100%" height="100%"' })}</div>`
        : `<img src="${p.image}" alt="" width="64" height="64" />`;
      return `
      <li class="line">
        ${thumb}
        <div class="line-info">
          <strong>${esc(p.name)}</strong>
          <span>${esc(describe(l))}${describe(l) ? " · " : ""}${formatPrice(priceFor(p, l.options))}</span>
          <div class="stepper" role="group" aria-label="Quantity for ${esc(p.name)}">
            <button data-dec="${i}" aria-label="Remove one">−</button>
            <span>${l.qty}</span>
            <button data-inc="${i}" aria-label="Add one" ${l.qty >= MAX_QTY ? "disabled" : ""}>+</button>
          </div>
        </div>
        <button class="link" data-remove="${i}">Remove</button>
      </li>`;
    })
    .join("");
}

function openCart() {
  $("drawer").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("scrim").hidden = false;
}
function closeCart() {
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  $("scrim").hidden = true;
}

async function checkout() {
  const btn = $("checkout");
  btn.disabled = true;
  btn.textContent = "Opening secure checkout…";
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(({ id, options, text, qty }) => ({ id, options, ...(text ? { text } : {}), qty })) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
    window.location.href = data.url;
  } catch (err) {
    alert(err.message || "Something went wrong. Please try again.");
    btn.disabled = false;
    btn.textContent = "Checkout";
  }
}

/* ---------- Events ---------- */

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.add) addFromCard(t);
  else if (t.dataset.style) { state.style = t.dataset.style; updateCustom(); }
  else if (t.dataset.color) { state.color = t.dataset.color; updateCustom(); }
  else if (t.id === "custom-add") addCustom();
  else if (t.dataset.inc) setQty(+t.dataset.inc, cart[+t.dataset.inc].qty + 1);
  else if (t.dataset.dec) setQty(+t.dataset.dec, cart[+t.dataset.dec].qty - 1);
  else if (t.dataset.remove) setQty(+t.dataset.remove, 0);
});
document.addEventListener("input", (e) => {
  e.target.classList?.remove("needs-input");
  if (e.target.id === "custom-name") { state.name = e.target.value; updateCustom(); }
});
document.addEventListener("change", (e) => {
  e.target.classList?.remove("needs-input");
  if (e.target.id === "custom-size") state.size = e.target.value;
});
$("open-cart").addEventListener("click", openCart);
$("close-cart").addEventListener("click", closeCart);
$("scrim").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());
$("checkout").addEventListener("click", checkout);
// Safari restores pages from cache on Back from Stripe; reset the button.
window.addEventListener("pageshow", () => { $("checkout").disabled = false; $("checkout").textContent = "Checkout"; });

if (new URLSearchParams(location.search).has("canceled")) {
  $("notice").textContent = "Checkout canceled. Your cart is still here whenever you're ready.";
  $("notice").hidden = false;
}
$("year").textContent = new Date().getFullYear();
renderCustom();
renderGrid();
renderCart();
