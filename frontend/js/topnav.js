/* ================================================================
   SPLITWISE — TOP NAV CONTROLLER
   Handles: mobile menu toggle, notification bell, active link,
            scroll scroll-shrink, keyboard navigation
   ================================================================ */

(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────────── */
  const TABLET_BP = 1024; // px

  /* ── State ───────────────────────────────────────────────────── */
  let menuOpen = false;

  /* ── DOM ─────────────────────────────────────────────────────── */
  let topNav, hamburger, mobileMenu, overlay, bell, badgeEl;

  /* ── Open / Close mobile menu ────────────────────────────────── */
  function openMenu() {
    menuOpen = true;
    topNav.classList.add('menu-open');
    mobileMenu.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menuOpen = false;
    topNav.classList.remove('menu-open');
    mobileMenu.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    menuOpen ? closeMenu() : openMenu();
  }

  /* ── Notification bell ───────────────────────────────────────── */
  function openNotifications() {
    closeMenu();

    // Try triggering the existing notification panel logic
    const existingBell = document.getElementById('notificationBellBtn');
    if (existingBell) {
      existingBell.click();
      return;
    }

    // Fallback: toggle panel directly
    const panel = document.getElementById('notificationPanel');
    if (panel) {
      panel.classList.toggle('show');
      const nOverlay = document.getElementById('notificationOverlay');
      if (nOverlay) nOverlay.classList.toggle('show');
    }
  }

  /* ── Badge sync ──────────────────────────────────────────────── */
  function syncBadge() {
    if (!badgeEl) return;
    const src = document.getElementById('notificationBadge');
    if (!src) return;

    function update() {
      const text = src.textContent.trim();
      const topBadge = document.getElementById('sw-tn-badge');
      if (!topBadge) return;
      if (text && text !== '0') {
        topBadge.textContent = text;
        topBadge.style.display = 'flex';
      } else {
        topBadge.style.display = 'none';
      }
    }

    update();
    new MutationObserver(update).observe(src, { childList: true, characterData: true, subtree: true });
  }

  /* ── Mark active link based on current page ──────────────────── */
  function markActive() {
    const path = window.location.pathname;
    const allLinks = document.querySelectorAll('.sw-tn-links a, .sw-tn-mobile-menu a');
    allLinks.forEach(a => {
      a.classList.remove('active');
      const href = a.getAttribute('href') || '';
      if (path.endsWith(href) || window.location.href.includes(href.replace('.html', ''))) {
        a.classList.add('active');
      }
    });

    // Fallback: if nothing is active, check filename
    const filename = path.split('/').pop() || 'index.html';
    document.querySelectorAll(`.sw-tn-links a[href="${filename}"], .sw-tn-mobile-menu a[href="${filename}"]`).forEach(a => {
      a.classList.add('active');
    });
  }

  /* ── Keyboard: Escape closes menu ───────────────────────────── */
  function handleKeydown(e) {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  }

  /* ── Scroll: subtle shrink + shadow on scroll ────────────────── */
  function handleScroll() {
    if (!topNav) return;
    if (window.scrollY > 10) {
      topNav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
    } else {
      topNav.style.boxShadow = '0 2px 24px rgba(0,0,0,0.35)';
    }
  }

  /* ── Resize: close menu if going to desktop ──────────────────── */
  let resizeTimer;
  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > TABLET_BP && menuOpen) closeMenu();
    }, 150);
  }

  /* ── Build the top nav HTML ──────────────────────────────────── */
  function buildTopNav() {
    // Page title from existing page-header h2 (or fallback)
    const oldH2 = document.querySelector('.page-header-fixed h2');
    const pageTitle = oldH2 ? oldH2.innerText.replace(/^[\uF000-\uFFFF\s]+/, '').trim() : 'Dashboard';

    // Which page is active?
    const path = window.location.pathname;
    const isActive = (href) => path.endsWith(href) || window.location.href.includes(href.replace('.html', ''));

    const links = [
      { href: 'index.html',    icon: 'fa-home',      label: 'Dashboard' },
      { href: 'expenses.html', icon: 'fa-receipt',   label: 'Expenses'  },
      { href: 'groups.html',   icon: 'fa-users',     label: 'Groups'    },
      { href: 'reports.html',  icon: 'fa-chart-bar', label: 'Reports'   },
      { href: 'settings.html', icon: 'fa-cog',       label: 'Settings'  },
    ];

    function linksHTML(cls) {
      return links.map(l => `
        <li>
          <a href="${l.href}" class="${isActive(l.href) ? 'active' : ''}">
            <i class="fas ${l.icon}"></i>${l.label}
          </a>
        </li>`).join('');
    }

    const html = `
      <nav class="sw-topnav" id="swTopNav" role="navigation" aria-label="Main navigation">
        <div class="sw-topnav-inner">
          <!-- Brand -->
          <a class="sw-tn-brand" href="index.html">
            <i class="fas fa-wallet"></i>
            <span>SplitWise</span>
          </a>

          <!-- Divider -->
          <span class="sw-tn-divider" aria-hidden="true"></span>

          <!-- Desktop links -->
          <ul class="sw-tn-links" role="list">${linksHTML('sw-tn-links')}</ul>

          <!-- Actions -->
          <div class="sw-tn-actions">
            <!-- Page title chip (tablet/mobile only) -->
            <span class="sw-tn-title">${pageTitle}</span>

            <!-- Notification bell -->
            <button class="sw-tn-bell" id="swTnBell" aria-label="Notifications" title="Notifications">
              <i class="fas fa-bell"></i>
              <span class="sw-badge" id="sw-tn-badge" style="display:none"></span>
            </button>

            <!-- Hamburger (tablet/mobile) -->
            <button class="sw-tn-hamburger" id="swTnHamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="swTnMobileMenu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <!-- Mobile dropdown menu -->
        <div class="sw-tn-mobile-menu" id="swTnMobileMenu" role="menu">
          <ul>${linksHTML('sw-tn-mobile-menu')}</ul>
        </div>
      </nav>

      <!-- Overlay -->
      <div class="sw-tn-overlay" id="swTnOverlay" aria-hidden="true"></div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html.trim();
    document.body.insertBefore(container.firstElementChild, document.body.firstChild);
    document.body.insertBefore(container.firstElementChild, document.body.firstChild);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    // Only build if this is an app page (has notification system)
    const isAppPage = document.getElementById('notificationBellBtn') ||
                      document.querySelector('.sidebar');
    if (!isAppPage) return;

    buildTopNav();

    topNav     = document.getElementById('swTopNav');
    hamburger  = document.getElementById('swTnHamburger');
    mobileMenu = document.getElementById('swTnMobileMenu');
    overlay    = document.getElementById('swTnOverlay');
    bell       = document.getElementById('swTnBell');
    badgeEl    = document.getElementById('sw-tn-badge');

    // Events
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
    bell.addEventListener('click', openNotifications);



    // Close mobile menu when a link is clicked
    document.querySelectorAll('.sw-tn-mobile-menu a').forEach(a => {
      a.addEventListener('click', () => setTimeout(closeMenu, 80));
    });

    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Sync badge after a small delay (notification system may not be init yet)
    setTimeout(syncBadge, 800);

    // Mark active link
    markActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
