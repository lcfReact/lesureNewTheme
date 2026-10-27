(function () {
  const boot = (section) => {
    if (!section || !section.classList.contains("social-feed-section")) return;
    const root = section.querySelector("[data-ugc-stage]");
    if (!root || root.dataset.bound === "true") return;
    if (typeof Swiper === "undefined") return;
    const slider = root.querySelector(".ugc-stage__slider");
    if (!slider) return;
    root.dataset.bound = "true";
    root.querySelectorAll("video").forEach((video) => {
      video.muted = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    });

    const pauseOthers = (current) => {
      root.querySelectorAll(".ugc-card").forEach((card) => {
        const video = card.querySelector("video");
        if (!video || video === current) return;
        video.pause();
        card.classList.remove("is-playing");
      });
    };

    root.addEventListener("click", (event) => {
      const button = event.target.closest(".ugc-card__play");
      if (!button || !root.contains(button)) return;
      const slide = button.closest(".swiper-slide");
      if (!slide || !slide.classList.contains("swiper-slide-active")) return;
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest(".ugc-card");
      const video = card?.querySelector("video");
      if (!video) return;
      pauseOthers(video);
      video.muted = false;
      const play = video.play();
      const markPlaying = () => card.classList.add("is-playing");
      if (play && play.then) {
        play.then(markPlaying).catch(() => {
          video.muted = true;
          const retry = video.play();
          if (retry && retry.then) retry.then(markPlaying).catch(() => {});
          else markPlaying();
        });
      } else {
        markPlaying();
      }
    });

    root.addEventListener(
      "pointerdown",
      (event) => {
        if (event.target.closest(".ugc-card__play, .quick-buy-open, .ugc-product a")) {
          event.stopPropagation();
        }
      },
      true
    );

    const slideCount = slider.querySelectorAll(".swiper-slide").length;
    const mobileQuery = window.matchMedia("(max-width: 749px)");
    const fanConfig = () =>
      mobileQuery.matches
        ? { step: 0.183, innerTilt: 8, outerTilt: 6, hideAfter: 1.15, arrowSlots: 1, arrowScale: 0.044 }
        : { step: 0.197, innerTilt: 8, outerTilt: 6, hideAfter: 2.2, arrowSlots: 2, arrowScale: 0.036 };
    const placeArrows = (prevCenter, nextCenter, sliderRect, size) => {
      const main = root.querySelector(".ugc-stage__main");
      const prev = root.querySelector(".ugc-stage__arrow--prev");
      const next = root.querySelector(".ugc-stage__arrow--next");
      if (!main || !prev || !next) return;
      const mainRect = main.getBoundingClientRect();
      const y = sliderRect.top + sliderRect.height / 2 - mainRect.top;
      const pin = (button, centerX) => {
        button.style.left = `${centerX - mainRect.left}px`;
        button.style.right = "auto";
        button.style.top = `${y}px`;
        button.style.width = `${size}px`;
        button.style.height = `${size}px`;
        button.style.transform = "translate(-50%, -50%)";
      };
      pin(prev, prevCenter);
      pin(next, nextCenter);
    };
    const fan = (swiper) => {
      const stageWidth = slider.clientWidth;
      if (!stageWidth) return;
      const cfg = fanConfig();
      if (swiper.wrapperEl) swiper.wrapperEl.style.transform = "translate3d(0px, 0px, 0px)";
      swiper.slides.forEach((slide) => {
        const progress = Number.isFinite(slide.progress) ? slide.progress : 0;
        const abs = Math.abs(progress);
        const dir = Math.sign(progress) || 0;
        let tilt;
        if (abs <= 1) tilt = abs * cfg.innerTilt;
        else if (abs <= 2) tilt = cfg.innerTilt + (abs - 1) * (-cfg.outerTilt - cfg.innerTilt);
        else tilt = -cfg.outerTilt - (abs - 2) * cfg.outerTilt;
        const desired = stageWidth / 2 - dir * abs * cfg.step * stageWidth;
        const current = slide.offsetLeft + slide.offsetWidth / 2;
        const pull = desired - current;
        const opacity = abs <= cfg.hideAfter ? 1 : Math.max(0, 1 - (abs - cfg.hideAfter) / 0.45);
        slide.style.transitionProperty = "transform, opacity";
        slide.style.transformOrigin = "center center";
        slide.style.transform = `translate3d(${pull}px, 0, 0) rotate(${dir * tilt}deg)`;
        slide.style.opacity = opacity.toFixed(3);
        slide.style.zIndex = String(40 - Math.round(Math.min(abs, 5) * 8));
        slide.style.visibility = opacity < 0.02 ? "hidden" : "visible";
      });
      const sliderRect = slider.getBoundingClientRect();
      const activeCenter = sliderRect.left + stageWidth / 2;
      const arrowOffset = cfg.arrowSlots * cfg.step * stageWidth;
      const arrowSize = Math.max(28, Math.min(72, stageWidth * cfg.arrowScale));
      placeArrows(activeCenter - arrowOffset, activeCenter + arrowOffset, sliderRect, arrowSize);
    };
    let transitionTicket = 0;
    const releaseTranslate = (instance, duration) => {
      const ticket = ++transitionTicket;
      window.clearTimeout(root._ugcRelease);
      if (!duration) return;
      root._ugcRelease = window.setTimeout(() => {
        if (ticket !== transitionTicket || instance.destroyed || !instance.animating) return;
        instance.transitionEnd();
      }, duration);
    };
    const swiper = new Swiper(slider, {
      centeredSlides: true,
      slidesPerView: "auto",
      spaceBetween: 0,
      loop: slideCount > 4,
      loopPreventsSliding: false,
      speed: 700,
      grabCursor: true,
      watchSlidesProgress: true,
      virtualTranslate: true,
      preventClicks: false,
      preventClicksPropagation: false,
      navigation: {
        prevEl: root.querySelector(".ugc-stage__arrow--prev"),
        nextEl: root.querySelector(".ugc-stage__arrow--next"),
        disabledClass: "is-disabled",
      },
      on: {
        init(instance) {
          fan(instance);
        },
        setTranslate(instance) {
          fan(instance);
        },
        setTransition(instance, duration) {
          instance.slides.forEach((slide) => {
            slide.style.transitionProperty = "transform, opacity";
            slide.style.transitionDuration = `${duration}ms`;
            slide.style.transitionTimingFunction = "cubic-bezier(0.22, 0.61, 0.36, 1)";
          });
          releaseTranslate(instance, duration);
        },
        resize(instance) {
          fan(instance);
        },
        slideChange() {
          pauseOthers();
        },
      },
    });
    root._ugcSwiper = swiper;
    const onBreakpoint = () => {
      swiper.update();
      fan(swiper);
    };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onBreakpoint);
    else if (mobileQuery.addListener) mobileQuery.addListener(onBreakpoint);
  };

  const start = () => {
    document.querySelectorAll(".social-feed-section").forEach(boot);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  document.addEventListener("shopify:section:load", (event) => {
    boot(event.target);
  });

  document.addEventListener("shopify:section:unload", (event) => {
    const root = event.target.querySelector?.("[data-ugc-stage]");
    window.clearTimeout(root?._ugcRelease);
    if (root?._ugcSwiper) {
      root._ugcSwiper.destroy(true, true);
      root._ugcSwiper = null;
      delete root.dataset.bound;
    }
  });
})();
