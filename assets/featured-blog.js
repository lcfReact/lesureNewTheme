(function () {
  const desktopQuery = window.matchMedia("(min-width: 750px)");

  const activate = (item) => {
    const list = item.closest("[data-featured-blog]");
    if (!list || item.classList.contains("is-open")) return;
    list.querySelectorAll(".fb-item.is-open").forEach((openItem) => {
      openItem.classList.remove("is-open");
    });
    item.classList.add("is-open");
  };

  const bind = (root) => {
    if (!root || root.dataset.fbBound === "true") return;
    root.dataset.fbBound = "true";

    root.addEventListener("mouseover", (event) => {
      if (!desktopQuery.matches || !window.matchMedia("(hover: hover)").matches) return;
      const item = event.target.closest(".fb-item");
      if (!item || !root.contains(item)) return;
      activate(item);
    });

    root.addEventListener("click", (event) => {
      if (event.target.closest(".fb-item__arrow")) return;
      if (desktopQuery.matches) return;
      const item = event.target.closest(".fb-item");
      if (!item || !root.contains(item)) return;
      const link = event.target.closest("a");
      if (link && link.closest(".fb-item") === item) event.preventDefault();
      activate(item);
    });
  };

  const bindAll = (scope) => {
    const root = scope && scope.querySelector ? scope : document;
    root.querySelectorAll("[data-featured-blog]").forEach(bind);
  };

  const initHeadingAnimation = (section) => {
    if (!section || !section.classList.contains("section-blog-posts")) return;
    const enableAnimation = section.querySelector("[data-enable-header-animation]");
    if (!enableAnimation || section.dataset.fbHeadingBound === "true") return;
    section.dataset.fbHeadingBound = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("anim-active");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -25% 0px" }
    );
    observer.observe(section);
  };

  bindAll(document);
  document.querySelectorAll(".section-blog-posts").forEach(initHeadingAnimation);

  if (!window.__featuredBlogInit) {
    window.__featuredBlogInit = true;
    document.addEventListener("shopify:section:load", (event) => {
      bindAll(event.target);
      initHeadingAnimation(event.target);
    });
    document.addEventListener("shopify:block:select", (event) => {
      const item = event.target.closest(".fb-item");
      if (item) activate(item);
    });
  }
})();
