(function () {
  const updateNavPosition = (section) => {
    const nav = section.querySelector(".popular-products-nav");
    const stage = section.querySelector(".popular-products");
    const layout = section.querySelector(".popular-products-layout");
    const firstSlide = section.querySelector(".popular-products-item");
    if (!nav || !stage || !layout || !firstSlide) return;
    const prev = nav.querySelector(".popular-products-nav-button--prev");
    const next = nav.querySelector(".popular-products-nav-button--next");
    const mobile = layout.getBoundingClientRect().width < 750;
    const target = mobile
      ? firstSlide.querySelector(".card-media") || firstSlide.querySelector(".card")
      : firstSlide.querySelector(".card");
    if (!target) return;
    const anchor = mobile ? layout : stage;
    const anchorRect = anchor.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const centerY = targetRect.top - anchorRect.top + targetRect.height / 2;
    const clearButton = (button) => {
      if (!button) return;
      button.style.position = "";
      button.style.left = "";
      button.style.top = "";
      button.style.transform = "";
    };
    if (!mobile) {
      nav.style.top = `${centerY}px`;
      nav.style.height = "";
      nav.style.transform = "";
      clearButton(prev);
      clearButton(next);
      return;
    }
    const buttonSize = 36;
    nav.style.transform = "none";
    nav.style.height = `${buttonSize}px`;
    nav.style.top = `${centerY - buttonSize / 2}px`;
    const slides = section.querySelectorAll(".popular-products-item");
    const firstRect = slides[0].getBoundingClientRect();
    const stride = slides[1]
      ? slides[1].getBoundingClientRect().left - firstRect.left
      : firstRect.width;
    if (prev) {
      prev.style.position = "absolute";
      prev.style.left = "0px";
      prev.style.top = "0px";
      prev.style.transform = "rotate(180deg)";
    }
    if (next) {
      next.style.position = "absolute";
      next.style.left = `${Math.max(stride * 2 - buttonSize, 0)}px`;
      next.style.top = "0px";
      next.style.transform = "none";
    }
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
    const columns = Number(swiperEl.dataset.columns) || 3;
    const isCenteredSlides = Boolean(swiperEl.dataset.centeredSlides);
    const isLoop = Boolean(swiperEl.dataset.loop);
    const breakpointsConfig = {
      576: { slidesPerView: Math.min(columns, 2), spaceBetween: 16 },
      750: { slidesPerView: "auto", spaceBetween: 21 },
    };
    const centeredSlidesBreakpointsConfig = {
      576: { slidesPerView: 1.5, spaceBetween: 20 },
      990: { slidesPerView: 3, spaceBetween: 24 },
    };
    section._popularSwiper = new Swiper(swiperEl, {
      slidesPerView: 2.4,
      spaceBetween: 12,
      speed: 800,
      allowTouchMove: true,
      loop: isLoop,
      centeredSlides: isCenteredSlides,
      centeredSlidesBounds: isCenteredSlides,
      watchOverflow: true,
      breakpoints: isCenteredSlides ? centeredSlidesBreakpointsConfig : breakpointsConfig,
      mousewheel: {
        forceToAxis: true,
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
    });
    updateNavPosition(section);
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
