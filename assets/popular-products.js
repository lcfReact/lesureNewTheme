(function () {
  const updateProgress = (section, swiper) => {
    const wrap = section.querySelector(".popular-products-progress");
    const bar = section.querySelector(".popular-products-progress__bar");
    if (!wrap || !bar || !swiper) return;
    const view = swiper.slidesPerViewDynamic ? swiper.slidesPerViewDynamic() : 1;
    const locked = swiper.isLocked || swiper.slides.length <= view + 0.05;
    section.classList.toggle("popular-products-section--locked", locked);
    wrap.hidden = locked;
    if (locked) return;
    const ratio = Math.min(0.92, Math.max(0.12, view / swiper.slides.length));
    const travel = (1 - ratio) / ratio;
    bar.style.width = `${ratio * 100}%`;
    bar.style.transform = `translateX(${(swiper.progress || 0) * travel * 100}%)`;
  };
  const updateNavPosition = (section) => {
    const nav = section.querySelector(".popular-products-nav");
    const layout = section.querySelector(".popular-products-layout");
    const firstSlide = section.querySelector(".popular-products-item");
    if (!nav || !layout || !firstSlide) return;
    nav.querySelectorAll(".slider-button").forEach((button) => {
      button.style.position = "";
      button.style.left = "";
      button.style.top = "";
      button.style.transform = "";
    });
    if (window.matchMedia("(max-width: 749px)").matches) {
      nav.style.top = "";
      nav.style.height = "";
      nav.style.transform = "";
      return;
    }
    const media = firstSlide.querySelector(".card-media") || firstSlide;
    const layoutRect = layout.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    nav.style.height = "";
    nav.style.transform = "translateY(-50%)";
    nav.style.top = `${mediaRect.top - layoutRect.top + mediaRect.height / 2}px`;
  };
  const initSlider = (section) => {
    if (!section || !section.classList.contains("popular-products-section")) return;
    const swiperEl = section.querySelector(".popular-products-layout");
    const swiperWrapper = section.querySelector(".popular-products-list");
    const slides = section.querySelectorAll(".popular-products-item");
    if (!swiperEl || !swiperWrapper || !slides.length) return;
    if (section._popularSwiper) {
      section._popularSwiper.destroy(true, true);
      section._popularSwiper = null;
    }
    swiperEl.classList.add("swiper");
    swiperWrapper.classList.add("swiper-wrapper");
    slides.forEach((slide) => slide.classList.add("swiper-slide"));
    const prevBtn = section.querySelector(".popular-products-nav-button--prev");
    const nextBtn = section.querySelector(".popular-products-nav-button--next");
    const isCenteredSlides = Boolean(swiperEl.dataset.centeredSlides);
    const isLoop = Boolean(swiperEl.dataset.loop);
    section._popularSwiper = new Swiper(swiperEl, {
      slidesPerView: 2.15,
      spaceBetween: 12,
      speed: 550,
      allowTouchMove: true,
      grabCursor: true,
      loop: isLoop,
      centeredSlides: isCenteredSlides,
      centeredSlidesBounds: isCenteredSlides,
      watchOverflow: true,
      roundLengths: true,
      breakpoints: {
        750: { slidesPerView: 2.4, spaceBetween: 16 },
        990: { slidesPerView: 3.25, spaceBetween: 20 },
        1200: { slidesPerView: 3.6, spaceBetween: 20 },
      },
      a11y: {
        scrollOnFocus: false,
      },
      preventClicks: true,
      navigation:
        nextBtn && prevBtn
          ? {
              nextEl: nextBtn,
              prevEl: prevBtn,
              disabledClass: "swiper-button-disabled",
            }
          : false,
      on: {
        init(swiper) {
          updateProgress(section, swiper);
        },
        setTranslate(swiper) {
          updateProgress(section, swiper);
        },
        resize(swiper) {
          updateProgress(section, swiper);
        },
      },
    });
    updateNavPosition(section);
    updateProgress(section, section._popularSwiper);
    const nav = section.querySelector(".popular-products-nav");
    if (nav) nav.classList.add("popular-products-nav--visible");
  };
  const destroySlider = (section) => {
    if (!section?._popularSwiper) return;
    const swiperEl = section.querySelector(".popular-products-layout");
    const swiperWrapper = section.querySelector(".popular-products-list");
    const slides = section.querySelectorAll(".popular-products-item");
    section._popularSwiper.destroy(true, true);
    section._popularSwiper = null;
    swiperEl?.classList.remove("swiper");
    swiperWrapper?.classList.remove("swiper-wrapper");
    slides.forEach((slide) => slide.classList.remove("swiper-slide"));
  };
  const initPopularProducts = (section) => {
    if (!section || !section.classList.contains("popular-products-section")) return;
    const mainContainer = section.querySelector(".popular-products");
    if (!mainContainer) return;
    const desktopLayout = mainContainer.dataset.layout;
    const mobileLayout = mainContainer.dataset.layoutMobile;
    let currentLayout = null;
    if (section._popularObserver) section._popularObserver.disconnect();
    section._popularObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      const newLayout = entry.contentRect.width < 576 ? mobileLayout : desktopLayout;
      if (newLayout !== currentLayout) {
        destroySlider(section);
        if (newLayout === "slider") initSlider(section);
        currentLayout = newLayout;
      }
      if (currentLayout === "slider") updateNavPosition(section);
    });
    section._popularObserver.observe(section);
  };
  const initHeadingAnimation = (section) => {
    if (!section || !section.classList.contains("popular-products-section")) return;
    const enableAnimation = section.querySelector("[data-enable-header-animation]");
    if (!enableAnimation) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("anim-active");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -25% 0px",
      }
    );
    observer.observe(section);
  };
  initPopularProducts(document.currentScript.parentElement);
  initHeadingAnimation(document.currentScript.parentElement);
  document.addEventListener("shopify:section:load", function (event) {
    initPopularProducts(event.target);
    initHeadingAnimation(event.target);
  });
})();
