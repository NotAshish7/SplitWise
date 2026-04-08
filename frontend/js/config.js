// API Configuration - Dynamically detects environment
(function () {
    'use strict';

    // Get the current hostname and protocol
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const currentOrigin = window.location.origin;

    // Check if we're running on localhost or a tunnel
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '';
    const isTunnel = currentHost.includes('devtunnels.ms') || currentHost.includes('tunnel');

    // Determine API base URL
    let API_BASE;

    if (isLocalhost) {
        // Local development - use localhost:4000
        API_BASE = 'http://localhost:4000/api';
        console.log('🔧 Localhost detected. Using:', API_BASE);
    } else if (isTunnel) {
        // Tunnel environment - VS Code Dev Tunnels format
        // Check if there's a custom backend URL in localStorage first
        const customBackendUrl = localStorage.getItem('BACKEND_API_URL');
        if (customBackendUrl) {
            API_BASE = customBackendUrl;
            console.log('✅ Using custom backend URL from localStorage:', API_BASE);
        } else {
            // Try to construct backend URL from frontend URL
            // Replace -5500 with -4000 in the hostname (VS Code tunnel format)
            let backendHost = currentHost.replace('-5500', '-4000');
            // Also try replacing :5500 with :4000 (in case port is explicit)
            backendHost = backendHost.replace(':5500', ':4000');

            // Construct backend URL with same protocol
            const backendUrl = `${currentProtocol}//${backendHost}`;
            API_BASE = `${backendUrl}/api`;

            console.log('🌐 Tunnel detected!');
            console.log('   Frontend URL:', currentOrigin);
            console.log('   Attempting Backend URL:', API_BASE);
            console.log('');
            console.log('⚠️  IMPORTANT: If you get "failed to fetch" errors:');
            console.log('   1. Make sure port 4000 is forwarded in VS Code');
            console.log('   2. Copy your backend tunnel URL (should look like: https://xxxxx-4000.inc1.devtunnels.ms/)');
            console.log('   3. Open browser console and run:');
            console.log('      localStorage.setItem("BACKEND_API_URL", "https://YOUR-BACKEND-TUNNEL-URL/api");');
            console.log('   4. Refresh the page');
            console.log('');
        }
    } else {
        // Production or other environment
        API_BASE = currentOrigin.includes('splitwise.space') ? 'https://api.splitwise.space/api' : `${currentOrigin.replace(':5500', ':4000')}/api`;
        console.log('🔧 Production/Other environment. Using:', API_BASE);
    }

    // Make API_BASE globally available
    window.API_BASE = API_BASE;

    // Also export for module use if needed
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { API_BASE };
    }

    // Store for debugging
    window._API_CONFIG = {
        host: currentHost,
        origin: currentOrigin,
        isLocalhost,
        isTunnel,
        API_BASE
    };

    console.log('🔧 API Configuration Summary:', {
        host: currentHost,
        origin: currentOrigin,
        isLocalhost,
        isTunnel,
        API_BASE: API_BASE
    });


    // FIXED: Disabled automatic health check to prevent Android "local network access" permission prompts
    // The health check was triggering permission dialogs on mobile devices when using port forwarding
    // Backend connectivity is verified when actual API calls are made instead
    // 
    // If you need to manually test backend connectivity, you can run this in the browser console:
    // fetch(API_BASE.replace('/api', '/api/health')).then(r => console.log('Backend OK:', r.ok))
    //
    // Previous implementation kept for reference (lines 94-129) but commented out:
    /*
    if (isTunnel && !isAuthPage) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        fetch(API_BASE.replace('/api', '/api/health'), {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    console.log('✅ Backend is accessible at:', API_BASE);
                } else {
                    console.warn('⚠️  Backend returned error:', response.status);
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError' || error.message.includes('aborted')) {
                    console.warn('⚠️  Backend health check timed out');
                } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('network')) {
                    console.debug('Backend health check: CORS or network issue');
                } else {
                    console.warn('⚠️  Cannot reach backend at:', API_BASE);
                    console.warn('   Error:', error.message);
                }
            });
    }
    */

    console.log('ℹ️ Backend health check disabled to prevent mobile permission prompts.');
    console.log('   Backend connectivity will be verified on first API call.');
})();

// ── Global JavaScript error boundary ────────────────────────────────────────
// Catches any uncaught synchronous exception that slipped through try/catch
window.onerror = function (message, source, lineno, colno, error) {
    console.error('[Global Error]', message, 'at', source + ':' + lineno + ':' + colno, error);
    // Only show a toast for non-trivial errors (avoids spamming on third-party noise)
    if (error && !(error instanceof TypeError && message.includes('ResizeObserver'))) {
        if (typeof showNotification === 'function') {
            showNotification('An unexpected error occurred. Please refresh if the page behaves incorrectly.', 'error');
        }
    }
    return false; // Allow default browser error logging as well
};

// Catches unhandled Promise rejections (e.g. missing await, uncaught .catch)
window.onunhandledrejection = function (event) {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error('[Unhandled Promise Rejection]', msg, reason);
    // Suppress noisy/expected rejections (abort signals, fetch cancellations, etc.)
    const ignore = ['AbortError', 'The user aborted', 'NetworkError', 'Failed to fetch'];
    if (!ignore.some(s => msg.includes(s))) {
        if (typeof showNotification === 'function') {
            showNotification('A background operation failed. Please try again.', 'warning');
        }
    }
};
