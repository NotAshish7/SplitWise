/* SplitWise — Scroll Reveal & Micro-animations Engine */
/* Add class sw-reveal / sw-reveal-left / sw-reveal-right to any element */

(function () {
  'use strict';

  /* ── 1. Scroll Reveal Observer ── */
  function initScrollReveal() {
    const revealClasses = ['.sw-reveal', '.sw-reveal-left', '.sw-reveal-right'];
    const all = document.querySelectorAll(revealClasses.join(','));
    if (!all.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sw-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    all.forEach(el => observer.observe(el));
  }

  /* ── 2. Auto-attach reveal to Cards & Common Elements ── */
  function autoAttachReveal() {
    // Stat cards get upward reveal with stagger
    document.querySelectorAll('.stat-card, .stats-card, .action-card').forEach((el, i) => {
      if (!el.classList.contains('sw-reveal')) {
        el.classList.add('sw-reveal');
        el.style.transitionDelay = `${i * 0.07}s`;
      }
    });

    // Group cards
    document.querySelectorAll('.group-card').forEach((el, i) => {
      if (!el.classList.contains('sw-reveal')) {
        el.classList.add('sw-reveal');
        el.style.transitionDelay = `${i * 0.06}s`;
      }
    });

    // Table rows
    document.querySelectorAll('table tbody tr').forEach((el, i) => {
      if (!el.classList.contains('sw-reveal')) {
        el.classList.add('sw-reveal');
        el.style.transitionDelay = `${Math.min(i * 0.04, 0.5)}s`;
      }
    });

    // Feature cards on landing page
    document.querySelectorAll('.feature-card, .card').forEach((el, i) => {
      if (!el.classList.contains('sw-reveal') && !el.closest('.skeleton-container')) {
        el.classList.add('sw-reveal');
        el.style.transitionDelay = `${i * 0.05}s`;
      }
    });
  }

  /* ── 3. Animated Number Counter ── */
  function animateNumbers() {
    const amounts = document.querySelectorAll('.stat-amount, .stats-amount, [data-animate-number]');
    amounts.forEach(el => {
      const text = el.textContent || '';
      const match = text.match(/[\d,.]+/);
      if (!match) return;

      const target = parseFloat(match[0].replace(/,/g, ''));
      if (isNaN(target) || target === 0) return;

      const prefix = text.split(match[0])[0] || '';
      const suffix = text.split(match[0])[1] || '';
      const duration = 1200;
      const startTime = performance.now();

      function step(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        // Ease-out-cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = prefix + current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    });
  }

  /* ── 4. Ripple Effect on Buttons ── */
  function initRipple() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn, button:not([class*="close"]):not([class*="dropdown"])');
      if (!btn) return;
      if (btn.querySelector('.sw-ripple')) return; // debounce

      const ripple = document.createElement('span');
      ripple.className = 'sw-ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        background:rgba(255,255,255,0.25);
        transform:scale(0); animation:sw-ripple-anim 0.55s ease-out forwards;
        z-index:999;
      `;

      // Ensure btn has position relative
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /* ── 5. Inject ripple keyframes dynamically ── */
  function injectKeyframes() {
    if (document.getElementById('sw-engine-styles')) return;
    const style = document.createElement('style');
    style.id = 'sw-engine-styles';
    style.textContent = `
      @keyframes sw-ripple-anim {
        to { transform: scale(2.5); opacity: 0; }
      }
      .sw-page-loaded {
        animation: sw-fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both;
      }
      @keyframes sw-fadeUp {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── 6. Page entrance animation ── */
  function pageEntrance() {
    const main = document.querySelector('.main-content, main, #main');
    if (main && !main.classList.contains('sw-page-loaded')) {
      main.classList.add('sw-page-loaded');
    }
  }

  /* ── 7. Smooth hover lifting for interactive icons ── */
  function initIconHover() {
    document.querySelectorAll('.nav-link i, .sidebar .nav-link i').forEach(icon => {
      const link = icon.closest('.nav-link');
      if (!link) return;
      link.addEventListener('mouseenter', () => {
        icon.style.transform = 'scale(1.2) rotate(-5deg)';
        icon.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
      });
      link.addEventListener('mouseleave', () => {
        icon.style.transform = '';
      });
    });
  }

  /* ── 8. Lazy image loading enhancement ── */
  function enhanceLazyImages() {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'));
      }
    });
  }

  /* ── 10. Global Enter-key Submit ── */
  function initEnterKey() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;

      const el = e.target;
      const tag = el.tagName;
      const type = (el.type || '').toLowerCase();

      // Skip non-input elements, textareas, checkboxes, radios
      if (tag === 'TEXTAREA') return;
      if (tag !== 'INPUT' && tag !== 'SELECT') return;
      if (type === 'checkbox' || type === 'radio') return;

      // 1️⃣ Inside a <form> — find the primary submit button
      const form = el.closest('form');
      if (form) {
        const btn = form.querySelector(
          'button[type="submit"]:not(:disabled),' +
          'input[type="submit"]:not(:disabled),' +
          '.btn-primary:not([data-bs-dismiss]):not(:disabled),' +
          '.btn-warning:not([data-bs-dismiss]):not(:disabled),' +
          '.btn-success:not([data-bs-dismiss]):not(:disabled)'
        );
        if (btn) { e.preventDefault(); btn.click(); return; }
      }

      // 2️⃣ Inside a Bootstrap modal — find the primary action button
      const modal = el.closest('.modal');
      if (modal) {
        const btn = modal.querySelector(
          '.btn-primary:not([data-bs-dismiss]):not(:disabled),' +
          '.btn-warning:not([data-bs-dismiss]):not(:disabled),' +
          '.btn-success:not([data-bs-dismiss]):not(:disabled)'
        );
        if (btn) { e.preventDefault(); btn.click(); return; }
      }

      // 3️⃣ Inside a card / search container — find nearest action button
      const container = el.closest(
        '.card, .search-container, [role="search"], ' +
        '.sw-search-bar, .filter-bar, .input-group'
      );
      if (container) {
        const btn = container.querySelector(
          'button:not(:disabled), .btn:not(:disabled)'
        );
        if (btn) { e.preventDefault(); btn.click(); return; }
      }
    });
  }

  /* ── 9. Init all on DOM ready ── */
  function init() {
    injectKeyframes();
    pageEntrance();
    autoAttachReveal();
    initScrollReveal();
    initRipple();
    initIconHover();
    enhanceLazyImages();
    initEnterKey();

    // Wait for a tick then animate numbers (so values are rendered first)
    setTimeout(animateNumbers, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run reveal when content changes (e.g., after data loads)
  window.swRevealUpdate = function () {
    autoAttachReveal();
    initScrollReveal();
    setTimeout(animateNumbers, 100);
  };

})();
