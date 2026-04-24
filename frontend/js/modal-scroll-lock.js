/**
 * modal-scroll-lock.js  v3
 * Prevents background scroll for ALL Bootstrap modals and custom overlays.
 * Works on iOS 15+, Android Chrome, tablet, and desktop.
 *
 * NOTE: paddingRight compensation is intentionally omitted — Bootstrap 5
 * already adds its own scrollbar-width padding to the body when a modal
 * opens. Adding it here causes double-compensation and shifts the modal
 * off-center on desktop.
 */

(function () {
  'use strict';

  var _scrollY   = 0;
  var _lockCount = 0;

  function lockScroll() {
    if (_lockCount === 0) {
      _scrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow            = 'hidden';
      document.body.style.overscrollBehavior  = 'none'; // iOS 15+ rubber-band
    }
    _lockCount++;
  }

  function unlockScroll() {
    _lockCount = Math.max(0, _lockCount - 1);
    if (_lockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow            = '';
      document.body.style.overscrollBehavior  = '';
      if (_scrollY > 0) {
        window.scrollTo({ top: _scrollY, behavior: 'instant' });
      }
    }
  }

  /* Bootstrap 5 modal events */
  document.addEventListener('show.bs.modal',   lockScroll);
  document.addEventListener('hidden.bs.modal', unlockScroll);

  /* Custom overlay events */
  document.addEventListener('overlay:open',  lockScroll);
  document.addEventListener('overlay:close', unlockScroll);

  /* Public API */
  window.ModalScrollLock = { lock: lockScroll, unlock: unlockScroll };
})();
