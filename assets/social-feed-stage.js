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
    const placeArrows = (prevCenter, nextCenter, sliderRect) => {
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
        button.style.transform = "translate(-50%, -50%)";
      };
      pin(prev, prevCenter);
      pin(next, nextCenter);
    };
    const fan = (swiper) => {
      const sample = swiper.slides[0];
      const slideWidth = sample ? sample.offsetWidth : 0;
      const slideHeight = sample ? sample.offsetHeight : 0;
      const sideScale = 300 / 368;
      const innerTilt = 8;
      const outerTilt = 6;
      const aspect = slideWidth ? slideHeight / slideWidth : 490 / 368;
      const theta = (outerTilt * Math.PI) / 180;
      const halfRatio =
        (sideScale * Math.abs(Math.cos(theta)) + aspect * sideScale * Math.abs(Math.sin(theta))) / 2;
      const stepRatio = (1 / (2 * 0.48) - halfRatio) / 2;
      const visualStep = slideWidth * stepRatio;
      const innerPull = slideWidth - visualStep;
      const outerPull = 2 * (slideWidth - visualStep);
      if (slideWidth) {
        const sliderRect = slider.getBoundingClientRect();
        const activeCenter = sliderRect.left + sliderRect.width / 2;
        placeArrows(activeCenter - 2 * visualStep, activeCenter + 2 * visualStep, sliderRect);
      }
      swiper.slides.forEach((slide) => {
        const progress = slide.progress || 0;
        const abs = Math.abs(progress);
        const side = Math.sign(progress) || 1;
        const t = Math.min(abs, 2.6);
        let tilt;
        let pullMag;
        let scale;
        if (t <= 1) {
          tilt = t * innerTilt;
          pullMag = t * innerPull;
          scale = 1 - t * (1 - sideScale);
        } else if (t <= 2) {
          const u = t - 1;
          tilt = innerTilt + u * (-outerTilt - innerTilt);
          pullMag = innerPull + u * (outerPull - innerPull);
          scale = sideScale;
        } else {
          const u = t - 2;
          tilt = -outerTilt - u * outerTilt;
          pullMag = outerPull - u * slideWidth * 0.9;
          scale = sideScale;
        }
        const pull = side * pullMag;
        const rotate = side * tilt;
        slide.style.transitionProperty = "transform";
        slide.style.transformOrigin = "center center";
        slide.style.transform = `translate3d(${pull}px, 0, 0) rotate(${rotate}deg) scale(${scale})`;
        slide.style.zIndex = String(30 - Math.round(Math.min(abs, 3) * 8));
      });
    };
    const swiper = new Swiper(slider, {
      centeredSlides: true,
      slidesPerView: "auto",
      spaceBetween: 0,
      loop: slideCount > 4,
      speed: 700,
      grabCursor: true,
      watchSlidesProgress: true,
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
            slide.style.transitionProperty = "transform";
            slide.style.transitionDuration = `${duration}ms`;
            slide.style.transitionTimingFunction = "cubic-bezier(0.22, 0.61, 0.36, 1)";
          });
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
    if (root?._ugcSwiper) {
      root._ugcSwiper.destroy(true, true);
      root._ugcSwiper = null;
      delete root.dataset.bound;
    }
  });
})();
