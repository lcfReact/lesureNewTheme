(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const aspectOf = (card) => {
    const image = card.querySelector("img");
    if (!image || image.naturalWidth < 1 || image.naturalHeight < 1) return 4.5;
    return Math.min(Math.max(image.naturalWidth / image.naturalHeight, 1.4), 8);
  };

  const logoHeight = () => {
    const width = window.innerWidth;
    if (width < 750) return 28;
    return Math.min(48, Math.max(32, width * 0.028));
  };

  const sizeCard = (card, height) => {
    card.style.flex = "0 0 auto";
    card.style.height = `${height}px`;
    card.style.width = `${aspectOf(card) * height}px`;
    card.style.margin = "0";
  };

  const layout = (root) => {
    const slider = root.querySelector(".js-slider-logos");
    const wrapper = root.querySelector(".js-slider-logos-wrapper");
    if (!slider || !wrapper) return;

    const gap = Number(slider.dataset.gap) || 32;
    const height = logoHeight();
    const viewport = slider.clientWidth || root.clientWidth;
    const originals = [...wrapper.children].filter(
      (node) => node.classList.contains("logo-card") && !node.hasAttribute("data-logo-clone")
    );
    const weight = originals.reduce((sum, card) => {
      const image = card.querySelector("img");
      return sum + (image ? image.naturalWidth : 0);
    }, 0);
    const key = `${height}|${gap}|${viewport}|${weight}|${reducedMotion.matches}`;
    if (key === root._logoKey && wrapper.classList.contains("is-marquee")) return;
    root._logoKey = key;

    wrapper.classList.remove("is-marquee");
    wrapper.style.animation = "none";
    wrapper.querySelectorAll("[data-logo-clone]").forEach((node) => node.remove());

    const cards = originals;
    if (!cards.length) return;

    wrapper.style.display = "flex";
    wrapper.style.flexWrap = "nowrap";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "flex-start";
    wrapper.style.width = "max-content";
    wrapper.style.gap = `${gap}px`;
    wrapper.style.transform = "none";
    cards.forEach((card) => sizeCard(card, height));

    if (reducedMotion.matches || cards.length < 2) return;

    let copies = 0;
    while (wrapper.scrollWidth < viewport * 2 && copies < 8) {
      cards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("data-logo-clone", "true");
        clone.setAttribute("aria-hidden", "true");
        clone.removeAttribute("data-shopify-editor-block");
        clone.querySelectorAll("a").forEach((link) => link.setAttribute("tabindex", "-1"));
        wrapper.appendChild(clone);
      });
      copies += 1;
    }

    const firstClone = wrapper.querySelector("[data-logo-clone]");
    const shift = firstClone ? firstClone.offsetLeft - cards[0].offsetLeft : 0;
    if (shift < 1) return;

    const speedMs = Number(slider.dataset.duration) || 4000;
    const pixelsPerSecond = (180 + gap) / (speedMs / 1000);
    wrapper.style.setProperty("--logo-shift", `${shift}px`);
    wrapper.style.setProperty("--logo-duration", `${shift / pixelsPerSecond}s`);
    wrapper.style.transform = "";
    wrapper.style.animation = "";
    wrapper.classList.add("is-marquee");
  };

  const boot = (section) => {
    const root = section && section.querySelector('[data-slider-type="slider-carousel"]');
    if (!root) return;
    const run = () => layout(root);
    run();
    root.querySelectorAll("img").forEach((image) => {
      if (!image.complete) image.addEventListener("load", run, { once: true });
    });
    if (root._logoFitObserver) root._logoFitObserver.disconnect();
    const observer = new ResizeObserver(run);
    observer.observe(root);
    root._logoFitObserver = observer;
  };

  boot(document.currentScript && document.currentScript.parentElement);
  document.addEventListener("shopify:section:load", (event) => {
    boot(event.target);
  });
  document.addEventListener("shopify:section:unload", (event) => {
    const root = event.target && event.target.querySelector('[data-slider-type="slider-carousel"]');
    if (!root) return;
    if (root._logoFitObserver) root._logoFitObserver.disconnect();
    const wrapper = root.querySelector(".js-slider-logos-wrapper");
    if (wrapper) wrapper.classList.remove("is-marquee");
  });
})();
