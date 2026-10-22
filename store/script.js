(() => {
  "use strict";

  const config = window.STORE_CONFIG || {};
  const products = Array.isArray(window.STORE_PRODUCTS) ? window.STORE_PRODUCTS : [];
  const money = new Intl.NumberFormat(config.locale || "en-ZM", {
    style: "currency", currency: config.currency || "ZMW",
    maximumFractionDigits: 2
  });
  const $ = (selector) => document.querySelector(selector);
  const productGrid = $("#product-grid");
  const emptyState = $("#empty-state");
  const cartDrawer = $("#cart-drawer");
  const cartBackdrop = $("#cart-backdrop");
  const checkoutDialog = $("#checkout-dialog");
  let activeCategory = "All";
  let searchTerm = "";
  let sortMode = "featured";
  let toastTimer;
  let cart = loadCart();

  function formatPrice(value) {
    return money.format(Number(value) || 0).replace("ZMW", "K").replace(/\u00a0/g, " ");
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem("crighteous-store-cart") || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(row => products.some(p => p.id === row.id) && Number.isInteger(row.qty) && row.qty > 0)
        .map(row => ({ id: row.id, qty: Math.min(99, row.qty) }));
    } catch (_) { return []; }
  }

  function saveCart() {
    try { localStorage.setItem("crighteous-store-cart", JSON.stringify(cart)); } catch (_) {}
  }

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function getProduct(id) { return products.find(p => p.id === id); }
  function cartQuantity() { return cart.reduce((sum, row) => sum + row.qty, 0); }
  function subtotal() {
    return cart.reduce((sum, row) => {
      const product = getProduct(row.id);
      return sum + (product ? Number(product.price) * row.qty : 0);
    }, 0);
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function productImage(product, className = "product-image") {
    if (product.image && /^https:\/\/|^http:\/\//i.test(product.image)) {
      return `<img class="${className}" src="${safeText(product.image)}" alt="${safeText(product.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` +
        `<div class="product-placeholder" hidden aria-hidden="true">CR</div>`;
    }
    return `<div class="product-placeholder" aria-hidden="true">CR</div>`;
  }

  function filteredProducts() {
    let list = products.filter(product => {
      const categoryMatch = activeCategory === "All" || product.category === activeCategory;
      const text = `${product.name} ${product.category} ${product.description} ${product.options || ""}`.toLowerCase();
      return categoryMatch && text.includes(searchTerm);
    });
    if (sortMode === "low-high") list.sort((a, b) => a.price - b.price);
    if (sortMode === "high-low") list.sort((a, b) => b.price - a.price);
    if (sortMode === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderProducts() {
    const list = filteredProducts();
    productGrid.innerHTML = list.map(product => `
      <article class="product-card">
        <div class="product-image-wrap">
          ${productImage(product)}
          ${product.badge ? `<span class="product-badge">${safeText(product.badge)}</span>` : ""}
        </div>
        <div class="product-info">
          <p class="product-category">${safeText(product.category)}</p>
          <h3>${safeText(product.name)}</h3>
          <p class="product-description">${safeText(product.description)}</p>
          <div class="product-bottom">
            <span class="product-price">${formatPrice(product.price)}</span>
            <button class="add-button" type="button" data-add="${safeText(product.id)}">+ Add to cart</button>
          </div>
        </div>
      </article>`).join("");
    emptyState.hidden = list.length !== 0;
  }

  function renderCart() {
    $("#cart-count").textContent = cartQuantity();
    $("#cart-subtotal").textContent = formatPrice(subtotal());
    $("#checkout-subtotal").textContent = formatPrice(subtotal());
    if (!cart.length) {
      $("#cart-items").innerHTML = `<div class="empty-state">Your cart is empty. Add something you like from the store.</div>`;
      $("#checkout-button").disabled = true;
      $("#checkout-button").style.opacity = ".5";
      return;
    }
    $("#checkout-button").disabled = false;
    $("#checkout-button").style.opacity = "1";
    $("#cart-items").innerHTML = cart.map(row => {
      const p = getProduct(row.id);
      if (!p) return "";
      const image = p.image && /^https?:\/\//i.test(p.image)
        ? `<img class="cart-thumb" src="${safeText(p.image)}" alt="">`
        : `<div class="cart-thumb" aria-hidden="true">CR</div>`;
      return `<div class="cart-line">
        ${image}
        <div><h3>${safeText(p.name)}</h3><p>${formatPrice(p.price)} each</p>
          <div class="qty-controls">
            <button type="button" data-qty="${safeText(p.id)}" data-delta="-1" aria-label="Remove one ${safeText(p.name)}">−</button>
            <span>${row.qty}</span>
            <button type="button" data-qty="${safeText(p.id)}" data-delta="1" aria-label="Add one ${safeText(p.name)}">+</button>
          </div>
          <button class="remove-button" type="button" data-remove="${safeText(p.id)}">Remove</button>
        </div>
        <span class="cart-line-total">${formatPrice(p.price * row.qty)}</span>
      </div>`;
    }).join("");
  }

  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;
    const existing = cart.find(row => row.id === id);
    if (existing) existing.qty = Math.min(99, existing.qty + 1);
    else cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    showToast(`${product.name} added to cart`);
  }

  function changeQuantity(id, delta) {
    const row = cart.find(item => item.id === id);
    if (!row) return;
    row.qty += delta;
    if (row.qty <= 0) cart = cart.filter(item => item.id !== id);
    if (row.qty > 99) row.qty = 99;
    saveCart();
    renderCart();
  }

  function openCart() {
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    cartBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    $("#close-cart").focus();
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function openCheckout() {
    if (!cart.length) return;
    closeCart();
    $("#checkout-subtotal").textContent = formatPrice(subtotal());
    if (typeof checkoutDialog.showModal === "function") checkoutDialog.showModal();
    else checkoutDialog.setAttribute("open", "");
  }

  function buildOrderMessage(formData) {
    const lines = [
      `Hello ${config.storeName || "CRighteous Store"}, I would like to place an order:`,
      "",
      ...cart.map(row => {
        const p = getProduct(row.id);
        return p ? `• ${p.name} x${row.qty} — ${formatPrice(p.price * row.qty)}\n  Options: ${p.options || "Please confirm"}` : "";
      }),
      "",
      `Subtotal (delivery not included): ${formatPrice(subtotal())}`,
      `Name: ${formData.get("customerName")}`,
      `Phone: ${formData.get("phone")}`,
      `Delivery area/address: ${formData.get("address")}`,
      `Preferred payment: ${formData.get("payment")}`,
      `Extra notes: ${formData.get("notes") || "None"}`,
      "",
      "Please confirm availability, total cost including delivery, and payment instructions before I pay."
    ];
    return lines.join("\n");
  }

  productGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
  });

  $("#cart-items").addEventListener("click", event => {
    const qtyButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");
    if (qtyButton) changeQuantity(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
    if (removeButton) {
      cart = cart.filter(row => row.id !== removeButton.dataset.remove);
      saveCart();
      renderCart();
    }
  });

  document.querySelectorAll(".category-tab").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      document.querySelectorAll(".category-tab").forEach(tab => tab.classList.toggle("active", tab === button));
      renderProducts();
    });
  });

  $("#search-input").addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderProducts();
  });
  $("#sort-select").addEventListener("change", event => {
    sortMode = event.target.value;
    renderProducts();
  });
  $("#open-cart").addEventListener("click", openCart);
  $("#close-cart").addEventListener("click", closeCart);
  $("#continue-shopping").addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);
  $("#checkout-button").addEventListener("click", openCheckout);
  $("#close-checkout").addEventListener("click", () => checkoutDialog.close());
  checkoutDialog.addEventListener("click", event => {
    if (event.target === checkoutDialog) checkoutDialog.close();
  });

  $("#checkout-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!cart.length) {
      checkoutDialog.close();
      showToast("Your cart is empty");
      return;
    }
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    if (!number || /X/i.test(number) || number.length < 10) {
      showToast("Store owner: set your WhatsApp number in products.js first.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const url = `https://wa.me/${number}?text=${encodeURIComponent(buildOrderMessage(formData))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    checkoutDialog.close();
    showToast("WhatsApp opened. Send the prepared order to confirm it.");
  });

  const number = String(config.whatsappNumber || "").replace(/\D/g, "");
  $("#contact-whatsapp").href = number && !/X/i.test(config.whatsappNumber) && number.length >= 10
    ? `https://wa.me/${number}?text=${encodeURIComponent("Hello CRighteous Store, I have a question about your products.")}`
    : "#contact";
  $("#contact-whatsapp").addEventListener("click", event => {
    if (!number || /X/i.test(config.whatsappNumber) || number.length < 10) {
      event.preventDefault();
      showToast("Store owner: set your WhatsApp number in products.js first.");
    }
  });

  $("#year").textContent = new Date().getFullYear();
  renderProducts();
  renderCart();
})();
