(function () {
  const popupSliderInit = (section) => {
    const sliderWrapper = document.querySelector(".js-popup-slider");
    if (sliderWrapper) {
      const buttonPrev = document.querySelector(
        ".product-media-modal__slider-nav-button--prev"
      );
      const buttonNext = document.querySelector(
        ".product-media-modal__slider-nav-button--next"
      );
      new Swiper(sliderWrapper, {
        slidesPerView: 1,
        speed: 500,
        zoom: {
          maxRatio: 2,
        },
        mousewheel: {
          forceToAxis: true,
        },
        navigation: {
          nextEl: buttonNext,
          prevEl: buttonPrev,
        },
        pagination: {
          el: ".product-media-modal .swiper-pagination",
          type: "bullets",
          clickable: true,
        },
        breakpoints: {
          990: {
            speed: 750,
          },
        },
        on: {
          afterInit: function () {
            const activeGalleryItem = section.querySelector(
              ".product-media__list .product-media-item.active"
            );
            if (activeGalleryItem) {
              const rawMediaId = String(
                activeGalleryItem.dataset.mediaId || ""
              ).replace(/^.*-/, "");
              const popupSlides = [
                ...sliderWrapper.querySelectorAll(".product-media-modal__item"),
              ];
              const targetIdx = popupSlides.findIndex((slide) =>
                slide.querySelector(`[data-media-id="${rawMediaId}"]`)
              );
              if (targetIdx > 0) {
                sliderWrapper.swiper.slideTo(targetIdx, 0);
              }
            }
            section
              .querySelectorAll(".product-media__list .product-media-item")
              .forEach((elem) => {
                elem.addEventListener("click", () => {
                  if (sliderWrapper.swiper) {
                    const rawMediaId = String(
                      elem.dataset.mediaId || ""
                    ).replace(/^.*-/, "");
                    const popupSlides = [
                      ...sliderWrapper.querySelectorAll(
                        ".product-media-modal__item"
                      ),
                    ];
                    const targetIdx = popupSlides.findIndex((slide) =>
                      slide.querySelector(`[data-media-id="${rawMediaId}"]`)
                    );
                    if (targetIdx >= 0) {
                      sliderWrapper.swiper.slideTo(targetIdx, 0);
                      sliderWrapper.swiper.update();
                    }
                  }
                });
              });
          },
          slideChange: function () {
            window.pauseAllMedia();
            this.params.noSwiping = false;
            sliderWrapper.classList.remove("zoom");
          },
          touchMove: function () {
            sliderWrapper.classList.remove("zoom");
          },
          slideChangeTransitionEnd: function () {
            if (this.slides[this.activeIndex].querySelector("model-viewer")) {
              this.slides[this.activeIndex]
                .querySelector(".shopify-model-viewer-ui__button--poster")
                .removeAttribute("hidden");
            }
          },
          touchStart: function () {
            if (this.slides[this.activeIndex].querySelector("model-viewer")) {
              if (
                !this.slides[this.activeIndex]
                  .querySelector("model-viewer")
                  .classList.contains("shopify-model-viewer-ui__disabled")
              ) {
                this.params.noSwiping = true;
                this.params.noSwipingClass = "swiper-slide";
              } else {
                this.params.noSwiping = false;
              }
            }
          },
        },
      });
    }
  };
  function swiperInit(section) {
    if (!section) return;
    subSliderInit(section); // from global.js
    sliderInit(section); // from global.js
    popupSliderInit(section);
  }
  document.addEventListener("shopify:section:load", function (e) {
    swiperInit(e.target);
  });
  swiperInit(document.currentScript?.parentElement);
})();
