/**
 * SplitWise Real-Time Client — realtime.js
 * ==========================================
 * Connects to the backend SSE stream and dispatches events to listeners.
 * Pages call SWRealtime.on('expense:created', handler) to react to events.
 *
 * Usage (in any page):
 *   <script src="js/realtime.js"></script>
 *   <script>
 *     document.addEventListener('DOMContentLoaded', () => {
 *       SWRealtime.on('expense:created', () => loadExpenses());
 *       SWRealtime.on('expense:updated', () => loadExpenses());
 *       SWRealtime.on('expense:deleted', () => loadExpenses());
 *       SWRealtime.on('notification:new', () => loadNotifications());
 *     });
 *   </script>
 */

(function () {
  'use strict';

  const RECONNECT_DELAY_MS = 3000;
  const MAX_RECONNECT_MS   = 30000;

  let es           = null;
  let listeners    = {};
  let reconnectMs  = RECONNECT_DELAY_MS;
  let reconnectTmr = null;
  let started      = false;

  // ── Resolve the API base URL (same logic used across all pages) ──────────────
  function resolveApiBase() {
    if (window.API_BASE) return window.API_BASE.replace(/\/$/, '');
    const origin = window.location.origin;
    // Dev tunnels: frontend is on port 5500, backend on 4000
    if (origin.includes('devtunnels.ms')) {
      return origin.replace(/-5500\./, '-4000.') + '/api';
    }
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:4000/api';
    }
    return origin + '/api';
  }

  // ── Get auth token ───────────────────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  }

  // ── Connect to SSE endpoint ──────────────────────────────────────────────────
  function connect() {
    const token = getToken();
    if (!token) {
      // No token = not logged in; retry later in case user logs in
      reconnectTmr = setTimeout(connect, 5000);
      return;
    }

    const url = `${resolveApiBase()}/sse?token=${encodeURIComponent(token)}`;
    console.log('[SSE] Connecting…');

    es = new EventSource(url);

    es.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data || '{}');
      console.log(`[SSE] ✅ Connected — userId: ${data.userId}`);
      reconnectMs = RECONNECT_DELAY_MS; // reset backoff
      _dispatch('connected', data);
    });

    // Register all known event types so EventSource forwards them
    const EVENTS = [
      'expense:created', 'expense:updated', 'expense:deleted',
      'group:created',   'group:updated',
      'notification:new',
      'ticket:created',  'ticket:updated', 'ticket:replied', 'ticket:note',
      'payment:created',
    ];
    EVENTS.forEach(ev => {
      es.addEventListener(ev, (e) => {
        let data = {};
        try { data = JSON.parse(e.data); } catch (_) {}
        console.log(`[SSE] 📨 ${ev}`, data);
        _dispatch(ev, data);
      });
    });

    es.onerror = () => {
      console.warn('[SSE] Connection lost — reconnecting in', reconnectMs, 'ms');
      es.close();
      es = null;
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTmr);
    reconnectTmr = setTimeout(() => {
      reconnectMs = Math.min(reconnectMs * 1.5, MAX_RECONNECT_MS);
      connect();
    }, reconnectMs);
  }

  // ── Dispatch event to all registered handlers ────────────────────────────────
  function _dispatch(event, data) {
    (listeners[event] || []).forEach(fn => {
      try { fn(data); } catch (e) { console.error('[SSE] Handler error:', e); }
    });
    // Also fire wildcard '*' listeners
    (listeners['*'] || []).forEach(fn => {
      try { fn(event, data); } catch (e) { console.error('[SSE] Wildcard error:', e); }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  const SWRealtime = {
    /**
     * Register a handler for a real-time event.
     * @param {string}   event    — event name or '*' for all events
     * @param {Function} handler  — fn(data) called when event fires
     */
    on(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },

    /**
     * Remove a handler.
     */
    off(event, handler) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(h => h !== handler);
    },

    /**
     * Start the SSE connection. Called automatically on DOMContentLoaded.
     * Safe to call multiple times.
     */
    start() {
      if (started) return;
      started = true;
      connect();
    },

    /**
     * Manually disconnect (e.g. on logout).
     */
    disconnect() {
      started = false;
      clearTimeout(reconnectTmr);
      if (es) { es.close(); es = null; }
    },
  };

  // Auto-start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SWRealtime.start());
  } else {
    SWRealtime.start();
  }

  window.SWRealtime = SWRealtime;
})();
