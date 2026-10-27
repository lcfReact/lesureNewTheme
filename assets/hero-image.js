(function () {
  const initHeroCarousel = (section) => {
    if (!section) return;
    const slider = section.querySelector("[data-hero-slider]");
    if (!slider || slider.dataset.heroReady === "true" || typeof Swiper === "undefined") return;
    const slides = slider.querySelectorAll(".swiper-slide");
    if (slides.length < 2) return;
    slider.dataset.heroReady = "true";
    const delay = (Number(slider.dataset.delay) || 5) * 1000;
    const autoplay = slider.dataset.autoplay === "true";
    new Swiper(slider, {
      slidesPerView: 1,
      speed: 700,
      loop: true,
      autoHeight: true,
      autoplay: autoplay
        ? { delay: delay, disableOnInteraction: false, pauseOnMouseEnter: true }
        : false,
      pagination: {
        el: slider.querySelector(".hero-image__pagination"),
        clickable: true,
      },
    });
  };

  const start = (section) => {
    if (typeof Swiper === "undefined") {
      window.addEventListener("load", () => initHeroCarousel(section), { once: true });
      return;
    }
    initHeroCarousel(section);
  };

  start(document.currentScript && document.currentScript.parentElement);
  document.addEventListener("shopify:section:load", (event) => start(event.target));
})();
