/* ================================================================
   SPLITWISE — NAVIGATION CONTROLLER
   Handles: sidebar collapse, mobile drawer, bottom nav, swipe
   ================================================================ */

(function () {
  'use strict';

  const BREAKPOINT_MOBILE = 767;
  const BREAKPOINT_TABLET = 1024;

  // ── DOM references (resolved after DOMContentLoaded) ──────────
  let sidebar, sidebarOverlay, mobileBtn, desktopBtn, sidebarCloseBtn;
  let mainContent, footer;
  let bottomNav;

  // ── State ──────────────────────────────────────────────────────
  let isMobile = () => window.innerWidth <= BREAKPOINT_MOBILE;
  let isTablet = () => window.innerWidth > BREAKPOINT_MOBILE && window.innerWidth <= BREAKPOINT_TABLET;
  let isDesktop = () => window.innerWidth > BREAKPOINT_TABLET;

  /* ─── Sidebar Open / Close ───────────────────────────────────── */
  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('show');
    document.body.classList.add('sidebar-open');
    if (sidebarOverlay) {
      sidebarOverlay.classList.add('show');
    }
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('show');
    document.body.classList.remove('sidebar-open');
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('show');
    }
  }

  // Desktop: collapse to icon-only
  function toggleDesktopCollapse() {
    document.body.classList.toggle('sidebar-collapsed');
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    try { localStorage.setItem('sw-nav-collapsed', collapsed ? '1' : '0'); } catch (e) { }
  }

  /* ─── Bottom Nav Builder ─────────────────────────────────────── */
  function buildBottomNav() {
    if (document.getElementById('sw-bottom-nav')) return;

    // Determine which page is active
    const path = window.location.pathname;
    const isActive = (href) => path.endsWith(href) || window.location.href.includes(href);

    const links = [
      { href: 'index.html', icon: 'fa-home', label: 'Home' },
      { href: 'expenses.html', icon: 'fa-receipt', label: 'Expenses' },
      { href: 'groups.html', icon: 'fa-users', label: 'Groups' },
      { href: 'reports.html', icon: 'fa-chart-bar', label: 'Reports' },
      { href: 'settings.html', icon: 'fa-cog', label: 'Settings' },
    ];

    const nav = document.createElement('nav');
    nav.id = 'sw-bottom-nav';
    nav.className = 'sw-bottom-nav';

    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = isActive(link.href) ? 'active' : '';
      a.innerHTML = `<i class="fas ${link.icon}"></i><span>${link.label}</span>`;
      nav.appendChild(a);
    });

    document.body.appendChild(nav);
    bottomNav = nav;

    // Sync notification badge
    syncBottomBadge();
  }

  function syncBottomBadge() {
    const sourceBadge = document.getElementById('notificationBadge');
    const targetBadge = document.getElementById('sw-bottom-badge');
    if (!sourceBadge || !targetBadge) return;

    const observer = new MutationObserver(() => {
      const text = sourceBadge.textContent.trim();
      if (text && text !== '0') {
        targetBadge.textContent = text;
        targetBadge.style.display = 'flex';
      } else {
        targetBadge.style.display = 'none';
      }
    });
    observer.observe(sourceBadge, { childList: true, characterData: true, subtree: true });
  }

  /* ─── Touch swipe-to-open on mobile ─────────────────────────── */
  let touchStartX = 0;
  function initSwipe() {
    document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const sidebarOpen = sidebar && sidebar.classList.contains('show');

      if (dx > 70 && touchStartX < 30 && !sidebarOpen) {
        openSidebar();
      }
      if (dx < -70 && sidebarOpen) {
        closeSidebar();
      }
    }, { passive: true });
  }

  /* ─── Responsive resize handler ──────────────────────────────── */
  function handleResize() {
    if (isDesktop()) {
      closeSidebar();
      if (bottomNav) bottomNav.style.display = 'none';
    } else if (isTablet()) {
      closeSidebar();
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      // Mobile — ensure bottom nav visible
      if (!bottomNav) buildBottomNav();
      else bottomNav.style.display = 'flex';
      // Ensure sidebar is hidden (it becomes drawer)
    }
  }

  /* ─── Restore desktop collapse preference ────────────────────── */
  function restoreCollapseState() {
    try {
      if (localStorage.getItem('sw-nav-collapsed') === '1' && isDesktop()) {
        document.body.classList.add('sidebar-collapsed');
      }
    } catch (e) { }
  }

  /* ─── Init ───────────────────────────────────────────────────── */
  function init() {
    sidebar = document.querySelector('.sidebar');
    sidebarOverlay = document.getElementById('sidebarOverlay');
    mobileBtn = document.getElementById('mobileMenuBtn');
    desktopBtn = document.getElementById('desktopNavToggle');
    sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    if (!sidebar) return; // Not an app page (e.g. landing, login)

    restoreCollapseState();

    // Mobile open
    if (mobileBtn) mobileBtn.addEventListener('click', openSidebar);

    // Desktop collapse toggle
    if (desktopBtn) desktopBtn.addEventListener('click', toggleDesktopCollapse);

    // Close btn inside sidebar
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);

    // Overlay click closes sidebar
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Escape key closes
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSidebar();
    });

    // Swipe
    initSwipe();

    // Bottom nav on mobile
    if (isMobile()) buildBottomNav();

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    });

    // Remove both old collapsible-sidebar handlers (prevent double-toggle)
    // by stopping duplicate event listeners on existing buttons
    // (we handle everything above now)
  }

  /* ─── Expose global helper for notification badge sync ───────── */
  window.swNavUpdateBadge = syncBottomBadge;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
