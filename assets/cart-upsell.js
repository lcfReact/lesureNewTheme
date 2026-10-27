(function () {
  if (window.__lesureCartUpsell) return;
  window.__lesureCartUpsell = true;

  document.addEventListener("click", async (event) => {
    const arrow = event.target.closest("[data-cart-upsell-prev], [data-cart-upsell-next]");
    if (arrow) {
      event.preventDefault();
      const root = arrow.closest("[data-cart-upsell]");
      if (!root) return;
      const slides = [...root.querySelectorAll("[data-cart-upsell-slide]")];
      if (slides.length < 2) return;
      const current = Math.max(
        0,
        slides.findIndex((slide) => slide.classList.contains("is-active"))
      );
      const nextIndex = arrow.hasAttribute("data-cart-upsell-prev")
        ? (current - 1 + slides.length) % slides.length
        : (current + 1) % slides.length;
      slides[current].classList.remove("is-active");
      slides[nextIndex].classList.add("is-active");
      return;
    }

    const add = event.target.closest("[data-cart-upsell-add]");
    if (!add || add.disabled) return;
    event.preventDefault();
    const variantId = Number(add.dataset.variantId);
    if (!variantId || !window.routes?.cart_add_url) return;

    const cart = document.querySelector("cart-drawer");
    const label = add.textContent;
    add.disabled = true;
    const body = { items: [{ id: variantId, quantity: 1 }] };
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
        add.disabled = false;
        add.textContent = label;
        return;
      }
      if (!cart || !data.sections || !cart.getSectionsToRender || !cart.getSectionInnerHTML) {
        window.location.assign(window.routes.cart_url || "/cart");
        return;
      }
      cart.classList.remove("is-empty");
      cart.getSectionsToRender().forEach((section) => {
        const element = section.selector
          ? document.querySelector(section.selector)
          : document.getElementById(section.id);
        if (!element || !data.sections[section.id]) return;
        try {
          element.innerHTML = cart.getSectionInnerHTML(data.sections[section.id], section.selector);
        } catch (error) {
          return;
        }
      });
      if (window.PUB_SUB_EVENTS && typeof publish === "function") {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: "cart-upsell",
          productVariantId: variantId,
        });
      }
    } catch (error) {
      add.disabled = false;
      add.textContent = label;
    }
  });
})();
