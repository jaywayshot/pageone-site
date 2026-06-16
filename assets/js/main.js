/* ============================================================
   template-03-cobalt — main.js
   바닐라 JS · 외부 의존성 0. 데이터는 HTML/CSS 에 있고 여기선 동작만.
   - 헤더 스크롤 그림자(.is-scrolled)
   - 모바일 햄버거(.nav-toggle ↔ .nav.is-open, ESC/링크클릭 닫기, aria)
   - 스크롤 fade-up(.reveal → .is-visible, IntersectionObserver)
   - 키워드 하이라이트 리빌(.hl → .is-revealed, body.js-anim)
   - 숫자 카운트업(.stat__num[data-target])
   - FAQ 아코디언(.faq__q ↔ .faq__item.is-open, aria-expanded)
   - 부드러운 앵커 스크롤
   모션은 prefers-reduced-motion 을 존중(애니메이션 생략, 즉시 표시).
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

  // 모션이 허용될 때만 애니메이션 클래스를 켠다(.hl 초기 클립 등).
  if (!REDUCED) document.body.classList.add("js-anim");

  document.addEventListener("DOMContentLoaded", function () {

    /* ---------- 1. 헤더 스크롤 그림자 ---------- */
    var header = document.querySelector(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- 2. 모바일 햄버거 ---------- */
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (toggle && nav) {
      var setOpen = function (open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      };
      toggle.addEventListener("click", function () {
        setOpen(!nav.classList.contains("is-open"));
      });
      // 메뉴 안 링크 클릭 시 닫기
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
      });
      // ESC 로 닫기
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
          setOpen(false);
          toggle.focus();
        }
      });
    }

    /* ---------- 3. 스크롤 fade-up + 4. 하이라이트 리빌 ---------- */
    var revealEls = document.querySelectorAll(".reveal");
    var hlEls = document.querySelectorAll(".hl");

    if (REDUCED || !supportsIO) {
      // 모션 끔/미지원: 전부 즉시 표시
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
      hlEls.forEach(function (el) { el.classList.add("is-revealed"); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add("is-visible");
          // reveal 안에 들어있는 .hl 도 함께 리빌
          if (el.classList.contains("hl")) el.classList.add("is-revealed");
          el.querySelectorAll && el.querySelectorAll(".hl").forEach(function (hl) {
            hl.classList.add("is-revealed");
          });
          obs.unobserve(el);
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

      revealEls.forEach(function (el) { io.observe(el); });
      // reveal 밖에 단독으로 있는 .hl 도 관찰
      hlEls.forEach(function (el) {
        if (!el.closest(".reveal")) io.observe(el);
      });
    }

    /* ---------- 5. 숫자 카운트업 ---------- */
    var nums = document.querySelectorAll(".stat__num[data-target]");
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-target"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target)) return;
      if (REDUCED) { el.textContent = target + suffix; return; }
      var dur = 1400, start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        var val = Math.round(target * eased);
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };
    if (nums.length) {
      if (REDUCED || !supportsIO) {
        nums.forEach(runCount);
      } else {
        var numIO = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            runCount(entry.target);
            obs.unobserve(entry.target);
          });
        }, { threshold: 0.4 });
        nums.forEach(function (el) { numIO.observe(el); });
      }
    }

    /* ---------- 6. FAQ 아코디언 ---------- */
    var faqBtns = document.querySelectorAll(".faq__q");
    faqBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq__item");
        if (!item) return;
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    /* ---------- 6b. 히어로 장면 자동 순환(영상형) ---------- */
    var stage = document.querySelector("[data-hero-rotator]");
    if (stage) {
      var scenes = Array.prototype.slice.call(stage.querySelectorAll("[data-scene]"));
      var hero = stage.closest(".hero");
      var dots = hero ? Array.prototype.slice.call(hero.querySelectorAll("[data-dot]")) : [];
      var idx = 0;
      var timer = null;
      var INTERVAL = 2600; // 장면 통째 크로스페이드 순환 속도

      // 순수 opacity 크로스페이드: is-active 만 토글(요소 개별 모션 없음).
      var show = function (n) {
        if (!scenes.length) return;
        idx = (n + scenes.length) % scenes.length;
        scenes.forEach(function (s, i) {
          var on = i === idx;
          s.classList.toggle("is-active", on);
          s.setAttribute("aria-hidden", on ? "false" : "true");
        });
        dots.forEach(function (d, i) {
          var on = i === idx;
          d.classList.toggle("is-active", on);
          d.setAttribute("aria-selected", on ? "true" : "false");
        });
      };

      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      var start = function () {
        if (REDUCED || scenes.length < 2) return;
        stop();
        timer = setInterval(function () { show(idx + 1); }, INTERVAL);
      };

      // dot 클릭 → 해당 장면으로 점프 + 타이머 리셋
      dots.forEach(function (d) {
        d.addEventListener("click", function () {
          show(parseInt(d.getAttribute("data-index"), 10) || 0);
          start();
        });
      });

      // 탭이 백그라운드면 멈춤(자원 절약)
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else start();
      });

      show(0);
      start();
    }

    /* ---------- 7. 부드러운 앵커 스크롤 ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var dest = document.querySelector(id);
        if (!dest) return;
        e.preventDefault();
        dest.scrollIntoView({
          behavior: REDUCED ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  });
})();
