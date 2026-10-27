class QuickBuyModal extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === "true") return;
    this.dataset.bound = "true";
    this.cache = new Map();
    this.dialog = this.querySelector(".quick-buy__dialog");
    this.image = this.querySelector(".quick-buy__image");
    this.titleEl = this.querySelector(".quick-buy__title");
    this.priceEl = this.querySelector(".quick-buy__price");
    this.descEl = this.querySelector(".quick-buy__desc");
    this.descText = this.querySelector(".quick-buy__desc-text");
    this.detailsEl = this.querySelector(".quick-buy__details");
    this.optionsEl = this.querySelector(".quick-buy__options");
    this.noticeEl = this.querySelector(".quick-buy__notice");
    this.qtyInput = this.querySelector(".quick-buy__qty-input");
    this.addButton = this.querySelector("[data-quick-buy-add]");
    this.checkoutButton = this.querySelector("[data-quick-buy-checkout]");
    this.prevButton = this.querySelector("[data-quick-buy-prev]");
    this.nextButton = this.querySelector("[data-quick-buy-next]");
    this.detailsEl.textContent = this.dataset.detailsLabel || "See Full Details";
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.fit = this.fit.bind(this);
    this.addEventListener("click", this.onClick);
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.target.closest(".quick-buy-open, a.button--quick-view")) event.stopPropagation();
      },
      true
    );
    document.addEventListener("click", (event) => {
      const opener = event.target.closest(".quick-buy-open");
      if (!opener) return;
      event.preventDefault();
      event.stopPropagation();
      this.openFrom(opener);
    });
    window.addEventListener("resize", () => {
      if (!this.hidden) this.fit();
    });
  }

  onClick(event) {
    if (event.target.closest("[data-quick-buy-close]")) {
      this.close();
      return;
    }
    if (event.target.closest("[data-quick-buy-prev]")) {
      this.stepImage(-1);
      return;
    }
    if (event.target.closest("[data-quick-buy-next]")) {
      this.stepImage(1);
      return;
    }
    const qtyButton = event.target.closest("[data-quick-buy-qty]");
    if (qtyButton) {
      this.changeQty(Number(qtyButton.dataset.quickBuyQty));
      return;
    }
    const optionButton = event.target.closest("[data-option-index]");
    if (optionButton && !optionButton.disabled) {
      this.selectOption(Number(optionButton.dataset.optionIndex), optionButton.dataset.optionValue);
      return;
    }
    if (event.target.closest("[data-quick-buy-add]")) {
      this.addToCart(false);
      return;
    }
    if (event.target.closest("[data-quick-buy-checkout]")) {
      this.addToCart(true);
    }
  }

  onKeyDown(event) {
    if (event.key === "Escape") {
      this.close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = this.focusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  focusable() {
    return [...this.dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')].filter(
      (el) => !el.hidden && el.getClientRects().length
    );
  }

  async openFrom(opener) {
    this.opener = opener;
    this.scrollY = window.scrollY;
    this.hidden = false;
    document.body.style.position = "fixed";
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.addEventListener("keydown", this.onKeyDown);
    this.setNotice("");
    this.titleEl.textContent = "";
    this.priceEl.textContent = "";
    this.descText.textContent = "";
    this.descEl.classList.remove("is-empty");
    this.optionsEl.innerHTML = "";
    this.image.removeAttribute("src");
    const url = opener.dataset.productUrl;
    let swatches = { options: [] };
    const swatchNode = document.getElementById(opener.dataset.swatchId);
    if (swatchNode) {
      try {
        swatches = JSON.parse(swatchNode.textContent);
      } catch (error) {
        swatches = { options: [] };
      }
    }
    this.swatches = swatches;
    try {
      let product = this.cache.get(url);
      if (!product) {
        const response = await fetch(`${url}.js`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("product");
        product = await response.json();
        this.cache.set(url, product);
      }
      this.mount(product);
      this.querySelector(".quick-buy__close").focus();
    } catch (error) {
      this.setNotice(this.dataset.unavailableLabel || "Unavailable", true);
    }
  }

  close() {
    if (this.hidden) return;
    this.hidden = true;
    document.removeEventListener("keydown", this.onKeyDown);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, this.scrollY || 0);
    this.opener?.focus({ preventScroll: true });
  }

  mount(product) {
    this.product = product;
    product.variants.forEach((variant) => {
      if (!Array.isArray(variant.options)) {
        variant.options = [variant.option1, variant.option2, variant.option3].filter((value) => value);
      }
    });
    this.images = (Array.isArray(product.images) ? product.images : [])
      .map((image) => (typeof image === "string" ? image : image?.src))
      .filter(Boolean);
    const first = product.variants.find((variant) => variant.available) || product.variants[0];
    this.selection = first ? first.options.slice() : [];
    this.variant = this.matchVariant();
    this.imageIndex = this.imageIndexFor(this.variant);
    this.qtyInput.value = "1";
    this.titleEl.textContent = product.title;
    const text = this.plainText(product.description);
    this.descText.textContent = text;
    this.descEl.classList.toggle("is-empty", text === "");
    this.detailsEl.href = product.url || this.opener.dataset.productUrl;
    this.detailsEl.textContent = this.dataset.detailsLabel || "See Full Details";
    this.renderOptions();
    this.renderMedia();
    this.renderPrice();
    this.renderActions();
    this.fit();
  }

  plainText(html) {
    const node = document.createElement("div");
    node.innerHTML = html || "";
    return (node.textContent || "").replace(/\s+/g, " ").trim();
  }

  optionName(index) {
    const option = this.product.options[index];
    return typeof option === "string" ? option : option?.name || "";
  }

  optionMeta(index) {
    const name = this.optionName(index);
    return (this.swatches.options || []).find((option) => option.name === name) || null;
  }

  isDefaultOnly() {
    return this.product.variants.length === 1 && this.product.options.length === 1 && this.optionName(0) === "Title";
  }

  valuesFor(index) {
    const meta = this.optionMeta(index);
    if (meta?.values?.length) return meta.values.map((value) => value.name);
    const seen = [];
    this.product.variants.forEach((variant) => {
      const value = variant.options[index];
      if (value && !seen.includes(value)) seen.push(value);
    });
    return seen;
  }

  isValueAvailable(index, value) {
    return this.product.variants.some((variant) => {
      if (!variant.available || variant.options[index] !== value) return false;
      return this.selection.every((selected, optionIndex) => {
        return optionIndex === index || selected == null || variant.options[optionIndex] === selected;
      });
    });
  }

  matchVariant() {
    return this.product.variants.find((variant) =>
      variant.options.every((value, index) => value === this.selection[index])
    );
  }

  missingOption() {
    return this.product.options
      .map((_, index) => this.optionName(index))
      .find((name, index) => !this.selection[index] && name !== "Title");
  }

  selectOption(index, value) {
    this.noticeEl.classList.remove("is-success", "is-error");
    this.selection[index] = value;
    let variant = this.matchVariant();
    if (!variant || !variant.available) {
      const fallback = this.product.variants.find(
        (item) => item.available && item.options[index] === value
      );
      if (fallback) {
        this.selection = fallback.options.slice();
        variant = fallback;
      }
    }
    this.variant = this.matchVariant();
    if (this.variant?.featured_image?.src || this.variant?.featured_image) {
      this.imageIndex = this.imageIndexFor(this.variant);
    }
    const max = this.maxQty();
    if (Number(this.qtyInput.value) > max) this.qtyInput.value = String(max);
    this.renderOptions();
    this.renderMedia();
    this.renderPrice();
    this.renderActions();
    this.fit();
  }

  renderOptions() {
    this.optionsEl.innerHTML = "";
    if (this.isDefaultOnly()) return;
    this.product.options.forEach((_, index) => {
      const name = this.optionName(index);
      const meta = this.optionMeta(index);
      const isColor = Boolean(meta?.isColor);
      const field = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = name.endsWith(":") ? name : `${name}:`;
      const group = document.createElement("div");
      group.className = isColor ? "quick-buy__swatches" : "quick-buy__pills";
      this.valuesFor(index).forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.optionIndex = String(index);
        button.dataset.optionValue = value;
        button.className = isColor ? "quick-buy__swatch" : "quick-buy__pill";
        button.setAttribute("aria-pressed", this.selection[index] === value ? "true" : "false");
        if (this.selection[index] === value) button.classList.add("is-selected");
        if (!this.isValueAvailable(index, value)) button.disabled = true;
        if (isColor) {
          const swatch = meta.values.find((item) => item.name === value);
          button.style.setProperty("--swatch", swatch?.swatch || "#ddd");
          button.setAttribute("aria-label", value);
        } else {
          button.textContent = value;
        }
        group.appendChild(button);
      });
      field.append(legend, group);
      this.optionsEl.appendChild(field);
    });
  }

  imageKey(src) {
    if (!src) return "";
    return String(src).split("?")[0].split("/").pop();
  }

  imageIndexFor(variant) {
    const src = variant?.featured_image?.src || variant?.featured_image;
    if (!src) return this.imageIndex || 0;
    const key = this.imageKey(src);
    const index = this.images.findIndex((image) => this.imageKey(image) === key);
    return index >= 0 ? index : 0;
  }

  renderMedia() {
    const src =
      this.images[this.imageIndex] ||
      this.variant?.featured_image?.src ||
      this.product.featured_image ||
      "";
    if (src) {
      this.image.src = src;
      this.image.alt = this.product.title;
    }
    const single = this.images.length < 2;
    this.prevButton.hidden = single;
    this.nextButton.hidden = single;
  }

  stepImage(direction) {
    if (this.images.length < 2) return;
    const count = this.images.length;
    this.imageIndex = (this.imageIndex + direction + count) % count;
    this.renderMedia();
  }

  formatMoney(cents) {
    const format = window.theme?.moneyFormat || "${{amount}}";
    const amount = (Number(cents) / 100).toFixed(2);
    return format.replace(/\{\{\s*\w+\s*\}\}/, amount);
  }

  renderPrice() {
    const variant = this.variant;
    if (!variant) {
      this.priceEl.textContent = "";
      return;
    }
    const price = this.formatMoney(variant.price);
    const compare = Number(variant.compare_at_price);
    if (compare > Number(variant.price)) {
      this.priceEl.innerHTML = `${price} <s>${this.formatMoney(compare)}</s>`;
    } else {
      this.priceEl.textContent = price;
    }
  }

  quantity() {
    const value = Math.floor(Number(this.qtyInput.value));
    if (!value || value < 1) return 1;
    return Math.min(value, this.maxQty());
  }

  maxQty() {
    const variant = this.variant;
    if (
      variant &&
      variant.inventory_management &&
      variant.inventory_policy !== "continue" &&
      typeof variant.inventory_quantity === "number" &&
      variant.inventory_quantity > 0
    ) {
      return variant.inventory_quantity;
    }
    return 99;
  }

  changeQty(delta) {
    const next = Math.min(this.maxQty(), Math.max(1, this.quantity() + delta));
    this.qtyInput.value = String(next);
  }

  renderActions() {
    const missing = this.missingOption();
    const soldOut = !this.variant || !this.variant.available;
    this.addButton.disabled = Boolean(missing) || soldOut;
    this.checkoutButton.disabled = Boolean(missing) || soldOut;
    if (missing) {
      this.addButton.textContent = this.dataset.addLabel || "Add to Cart";
      this.setNotice((this.dataset.selectLabel || "Please select [option]").replace("[option]", missing));
      return;
    }
    if (soldOut) {
      this.addButton.textContent = this.dataset.soldLabel || "Sold Out";
      this.setNotice("");
      return;
    }
    this.addButton.textContent = this.dataset.addLabel || "Add to Cart";
    if (!this.noticeEl.classList.contains("is-success") && !this.noticeEl.classList.contains("is-error")) {
      this.setNotice("");
    }
  }

  setNotice(message, isError = false) {
    this.noticeEl.classList.toggle("is-error", Boolean(isError));
    this.noticeEl.classList.toggle("is-success", Boolean(message) && !isError);
    this.noticeEl.hidden = !message;
    this.noticeEl.textContent = message || "";
  }

  fit() {
    this.dialog.classList.remove("is-compact", "is-tight");
  }

  async addToCart(goToCheckout) {
    const missing = this.missingOption();
    if (missing) {
      this.setNotice((this.dataset.selectLabel || "Please select [option]").replace("[option]", missing), true);
      return;
    }
    if (!this.variant || !this.variant.available || this.addButton.disabled) return;
    this.addButton.disabled = true;
    this.checkoutButton.disabled = true;
    const cart = document.querySelector("cart-drawer");
    const body = {
      items: [{ id: this.variant.id, quantity: this.quantity() }],
    };
    if (cart?.getSectionsToRender) {
      body.sections = cart
        .getSectionsToRender()
        .map((section) => section.id)
        .join(",");
      body.sections_url = window.location.pathname;
    }
    try {
      const response = await fetch(window.routes.cart_add_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || data.status) {
        this.setNotice(data.description || data.message || this.dataset.unavailableLabel, true);
        this.renderActions();
        return;
      }
      this.applyCartSections(cart, data.sections);
      if (goToCheckout) {
        const root = window.Shopify?.routes?.root || "/";
        window.location.assign(`${root.replace(/\/?$/, "/")}checkout`);
        return;
      }
      this.renderActions();
      this.setNotice(this.dataset.addedLabel || "Added to cart");
    } catch (error) {
      this.renderActions();
      this.setNotice(this.dataset.unavailableLabel || "Unavailable", true);
    }
  }

  applyCartSections(cart, sections) {
    if (!cart || !sections || !cart.getSectionsToRender) return;
    cart.classList.remove("is-empty");
    cart.getSectionsToRender().forEach((section) => {
      const element = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      if (!element || !sections[section.id]) return;
      try {
        element.innerHTML = cart.getSectionInnerHTML(sections[section.id], section.selector);
      } catch (error) {
        return;
      }
    });
    if (window.PUB_SUB_EVENTS && typeof publish === "function") {
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: "quick-buy",
        productVariantId: this.variant?.id,
      });
    }
  }
}

if (!customElements.get("quick-buy-modal")) {
  customElements.define("quick-buy-modal", QuickBuyModal);
}
