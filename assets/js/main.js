/* ============================================================
   BM4M — main.js
   외부 라이브러리 없음. 바닐라 JS만. localStorage 미사용.
   - 햄버거 메뉴 토글
   - STATS 카운트업 애니메이션 (숫자는 HTML에 정적 렌더; JS는 카운트업만)
   - FAQ 아코디언 (접근성: button / aria-expanded)
   - 스크롤: 진행 표시줄 / 헤더 배경·숨김 / 맨 위로 버튼
   - 현재 섹션 nav 활성표시 (IntersectionObserver)
   - 스크롤 페이드업 (IntersectionObserver, 1회)
   - nav 앵커 smooth scroll
   - prefers-reduced-motion 존중 (로딩 페이드인은 CSS 전담)
   ============================================================ */
(function () {
  "use strict";

  // JS 사용 가능 표시 (이미지 페이드인 등 점진적 향상의 가드)
  document.documentElement.classList.add("js");

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 햄버거 메뉴 ---------- */
  function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    // 메뉴 내 링크 클릭 시 닫기
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    // ESC 로 닫기
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- 2. 스크롤 연동(진행바 / 헤더 / 맨 위로) ---------- */
  function initScrollUI() {
    var bar = document.getElementById("scroll-progress");
    var header = document.querySelector(".site-header");
    var toTop = document.getElementById("to-top");
    var lastY = window.pageYOffset || 0;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var docH =
        document.documentElement.scrollHeight - window.innerHeight;
      var ratio = docH > 0 ? y / docH : 0;

      // 진행 표시줄
      if (bar) bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";

      // 헤더: 8px 이상이면 배경, 방향 따라 숨김/노출
      if (header) {
        header.classList.toggle("is-scrolled", y > 8);
        if (y > 400 && y > lastY) {
          header.classList.add("is-hidden");   // 아래로 → 숨김
        } else {
          header.classList.remove("is-hidden"); // 위로 → 노출
        }
      }

      // 맨 위로 버튼: 한 화면(600px) 이상에서 표시
      if (toTop) toTop.classList.toggle("is-shown", y > 600);

      lastY = y;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    // 맨 위로 클릭
    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      });
    }
  }

  /* ---------- 3. 현재 섹션 nav 활성표시 ---------- */
  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav a[href^="#"]')
    );
    if (!links.length) return;

    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (id) map[id] = link;
    });

    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    function setActive(id) {
      links.forEach(function (l) { l.classList.remove("is-active"); });
      if (map[id]) map[id].classList.add("is-active");
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      // 화면 중앙 밴드에 들어온 섹션을 현재로 간주
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (sec) { observer.observe(sec); });
  }

  /* ---------- 4. 스크롤 페이드업 ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    // 모션 끔 또는 IO 미지원 → 즉시 표시
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // 한 번만 트리거
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- 5. nav 앵커 smooth scroll ---------- */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id === "#") return;

        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  /* ---------- 7. STATS 카운트업 (숫자는 HTML에 정적 렌더; JS는 애니메이션만) ---------- */
  function initStats() {
    var grid = document.getElementById("stats-grid");
    if (!grid) return;

    // 1,000 단위 콤마
    function fmt(n) {
      return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // HTML에 이미 렌더된 .stat__num 들을 읽어 카운트업 대상 구성
    // (목표 숫자는 data-target, 뒤 기호는 data-suffix 속성에서 가져온다)
    var numEls = [];
    Array.prototype.forEach.call(
      grid.querySelectorAll(".stat__num"),
      function (el) {
        var target = parseFloat(el.getAttribute("data-target"));
        if (isNaN(target)) return; // data-target 없으면 정적값 유지(애니 제외)
        numEls.push({
          el: el,
          target: target,
          suffix: el.getAttribute("data-suffix") || ""
        });
      }
    );
    if (!numEls.length) return;

    // 모션 끔 또는 IO 미지원 → 최종값 그대로 고정 (리셋·재생 없음)
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    var DURATION = 1600;

    // 진행 중인 rAF 취소 (재진입 시 중복 실행 방지)
    function stopItem(item) {
      if (item.raf) {
        window.cancelAnimationFrame(item.raf);
        item.raf = null;
      }
    }

    function countUp(item) {
      stopItem(item);
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DURATION, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - p, 3);
        item.el.textContent = fmt(item.target * eased) + item.suffix;
        if (p < 1) {
          item.raf = window.requestAnimationFrame(step);
        } else {
          item.raf = null;
          item.el.textContent = fmt(item.target) + item.suffix;
        }
      }
      item.el.textContent = "0" + item.suffix; // 0에서 시작
      item.raf = window.requestAnimationFrame(step);
    }

    function resetItem(item) {
      stopItem(item);
      item.el.textContent = "0" + item.suffix; // 다음 진입 때 다시 0부터
    }

    // observer 유지(disconnect 안 함) → 진입할 때마다 재생
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            numEls.forEach(countUp);
          } else {
            numEls.forEach(resetItem);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(grid);
  }

  /* ---------- 8. FAQ 아코디언 ---------- */
  function initFaq() {
    var triggers = document.querySelectorAll(".faq__trigger");
    if (!triggers.length) return;

    triggers.forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;

      // 초기 상태: 닫힘
      panel.style.height = "0px";

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";

        if (isOpen) {
          // 닫기: 현재 높이 → 0
          panel.style.height = panel.scrollHeight + "px";
          window.requestAnimationFrame(function () {
            panel.style.height = "0px";
          });
          btn.setAttribute("aria-expanded", "false");
        } else {
          // 열기: 0 → 콘텐츠 높이, 전환 후 auto 로 고정
          btn.setAttribute("aria-expanded", "true");
          panel.style.height = panel.scrollHeight + "px";
          if (reduceMotion) {
            panel.style.height = "auto";
          } else {
            panel.addEventListener("transitionend", function onEnd(e) {
              if (e.propertyName !== "height") return;
              if (btn.getAttribute("aria-expanded") === "true") {
                panel.style.height = "auto";
              }
              panel.removeEventListener("transitionend", onEnd);
            });
          }
        }
      });
    });
  }

  /* ---------- 9. 이미지 로드 페이드인 (CLS 없이 부드럽게) ---------- */
  function initImageFade() {
    var imgs = document.querySelectorAll(".product__thumb img");
    imgs.forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("is-loaded");
      } else {
        img.addEventListener("load", function () {
          img.classList.add("is-loaded");
        });
        img.addEventListener("error", function () {
          // 실패 시에도 숨김 방지
          img.classList.add("is-loaded");
        });
      }
    });
  }

  /* ---------- init ---------- */
  function init() {
    initImageFade();
    initNavToggle();
    initStats();
    initFaq();
    initScrollUI();
    initScrollSpy();
    initReveal();
    initSmoothScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
