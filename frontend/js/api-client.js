/**
 * api-client.js — Shared fetch wrapper for all frontend pages.
 *
 * Usage (works on all pages that load config.js first):
 *   const data = await apiFetch('/expenses');
 *   const result = await apiFetch('/expenses', { method: 'POST', body: { ... } });
 *
 * Features:
 *  - Auto-attaches Authorization: Bearer <token> header
 *  - Handles network errors (server down / CORS) with a friendly toast
 *  - Handles 401 by logging the user out automatically
 *  - Handles 4xx/5xx by throwing an Error with the server's error message
 *  - Returns parsed JSON `data` field on success
 */
(function () {
    'use strict';

    /**
     * Show a toast notification. Falls back to console.error if
     * showNotification is not yet defined (loaded later on the page).
     */
    function _toast(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type || 'error');
        } else {
            console.error('[api-client]', type, message);
        }
    }

    /**
     * apiFetch — centralised fetch with exception handling.
     *
     * @param {string} path          API path, e.g. '/expenses' (no base needed).
     * @param {object} [options={}]  Fetch options (method, body, headers, …).
     *                               `body` can be a plain object — it will be
     *                               JSON-serialised automatically.
     * @param {object} [opts]        Extra options.
     * @param {boolean} [opts.silent=false]  If true, suppress error toasts.
     * @returns {Promise<any>}       Resolves with response `.data` on success.
     * @throws  {Error}              On network failure or non-2xx response.
     */
    async function apiFetch(path, options, opts) {
        const silent = (opts && opts.silent) || false;

        // Build URL
        const base = window.API_BASE || 'https://api.splitwise.space/api';
        const url = path.startsWith('http') ? path : `${base}${path}`;

        // Build headers
        const headers = Object.assign({
            'Content-Type': 'application/json',
        }, (options && options.headers) || {});

        // Attach auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Serialise body if it's a plain object
        let body = options && options.body;
        if (body && typeof body === 'object' && !(body instanceof FormData)) {
            body = JSON.stringify(body);
        }

        const fetchOptions = Object.assign({}, options, { headers, body });

        let response;
        try {
            response = await fetch(url, fetchOptions);
        } catch (networkErr) {
            // Network-level failure: server down, CORS, no internet, etc.
            const msg = 'Cannot connect to server. Please check your connection.';
            if (!silent) _toast(msg, 'error');
            throw new Error(msg);
        }

        // ── 401 Unauthorised — token expired or invalid ──────────────────────
        if (response.status === 401) {
            const msg = 'Your session has expired. Please log in again.';
            if (!silent) _toast(msg, 'warning');
            // Delay so the toast is visible before the redirect
            setTimeout(() => {
                if (typeof performLogout === 'function') {
                    performLogout();
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('isLoggedIn');
                    window.location.replace('frontend.html');
                }
            }, 1500);
            throw new Error(msg);
        }

        // ── Parse JSON ────────────────────────────────────────────────────────
        let json;
        try {
            json = await response.json();
        } catch (_) {
            const msg = `Server returned an unexpected response (status ${response.status}).`;
            if (!silent) _toast(msg, 'error');
            throw new Error(msg);
        }

        // ── Non-2xx → use server's error message ──────────────────────────────
        if (!response.ok || json.success === false) {
            const msg = json.error || json.message || `Request failed (${response.status})`;
            if (!silent) _toast(msg, 'error');
            throw new Error(msg);
        }

        // Return the `.data` payload (or full response if no data field)
        return json.data !== undefined ? json.data : json;
    }

    // Expose globally
    window.apiFetch = apiFetch;

})();
