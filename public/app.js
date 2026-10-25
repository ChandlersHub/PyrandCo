import { products, findProduct, formatPrice, MAX_QTY } from "/products.js";

const FREE_SHIPPING_OVER = 7500;
const KEY = "pyr-cart";
const $ = (id) => document.getElementById(id);

let cart = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    return Object.fromEntries(Object.entries(saved).filter(([id, q]) => findProduct(id) && q > 0));
  } catch {
    return {};
  }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {}
}

function setQty(id, qty) {
  qty = Math.max(0, Math.min(MAX_QTY, qty));
  if (qty === 0) delete cart[id];
  else cart[id] = qty;
  save();
  renderCart();
}

function renderGrid() {
  $("grid").innerHTML = products
    .map(
      (p) => `
      <article class="card">
        <div class="thumb">
          ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
          <img src="${p.image}" alt="${p.name}" loading="lazy" width="400" height="400" />
        </div>
        <div class="card-body">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div class="card-foot">
            <span class="price">${formatPrice(p.price)}</span>
            <button class="btn btn-sm" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function renderCart() {
  const ids = Object.keys(cart);
  const count = ids.reduce((n, id) => n + cart[id], 0);
  const subtotal = ids.reduce((s, id) => s + findProduct(id).price * cart[id], 0);

  $("cart-count").textContent = count;
  $("empty").hidden = ids.length > 0;
  $("foot").hidden = ids.length === 0;
  $("subtotal").textContent = formatPrice(subtotal);
  $("ship-note").textContent =
    subtotal >= FREE_SHIPPING_OVER
      ? "You've got free shipping."
      : `Add ${formatPrice(FREE_SHIPPING_OVER - subtotal)} more for free shipping.`;

  $("lines").innerHTML = ids
    .map((id) => {
      const p = findProduct(id);
      return `
      <li class="line">
        <img src="${p.image}" alt="" width="64" height="64" />
        <div class="line-info">
          <strong>${p.name}</strong>
          <span>${formatPrice(p.price)}</span>
          <div class="stepper" role="group" aria-label="Quantity for ${p.name}">
            <button data-dec="${id}" aria-label="Remove one">−</button>
            <span>${cart[id]}</span>
            <button data-inc="${id}" aria-label="Add one" ${cart[id] >= MAX_QTY ? "disabled" : ""}>+</button>
          </div>
        </div>
        <button class="link" data-remove="${id}">Remove</button>
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

function notice(text) {
  $("notice").textContent = text;
  $("notice").hidden = false;
}

async function checkout() {
  const btn = $("checkout");
  btn.disabled = true;
  btn.textContent = "Opening secure checkout…";
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) }),
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

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.add) { setQty(t.dataset.add, (cart[t.dataset.add] || 0) + 1); openCart(); }
  else if (t.dataset.inc) setQty(t.dataset.inc, cart[t.dataset.inc] + 1);
  else if (t.dataset.dec) setQty(t.dataset.dec, cart[t.dataset.dec] - 1);
  else if (t.dataset.remove) setQty(t.dataset.remove, 0);
});
$("open-cart").addEventListener("click", openCart);
$("close-cart").addEventListener("click", closeCart);
$("scrim").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());
$("checkout").addEventListener("click", checkout);
// Safari restores pages from cache on Back from Stripe; reset the button.
window.addEventListener("pageshow", () => { $("checkout").disabled = false; $("checkout").textContent = "Checkout"; });

if (new URLSearchParams(location.search).has("canceled")) {
  notice("Checkout canceled. Your cart is still here whenever you're ready.");
}
$("year").textContent = new Date().getFullYear();
renderGrid();
renderCart();
