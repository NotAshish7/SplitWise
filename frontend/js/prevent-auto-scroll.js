// Prevent automatic scrolling on page refresh
(function() {
    'use strict';
    
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Function to scroll to top immediately
    function scrollToTop() {
        try {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            // Also try scrollTo on document element
            if (document.scrollingElement) {
                document.scrollingElement.scrollTop = 0;
            }
        } catch (e) {
            // Ignore errors
        }
    }
    
    // Track if this is initial page load
    let isInitialLoad = true;
    let loadStartTime = performance.now();
    
    // Scroll to top immediately
    scrollToTop();
    
    // Scroll to top on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            scrollToTop();
            // Prevent any delayed scrolling with multiple attempts
            setTimeout(scrollToTop, 0);
            setTimeout(scrollToTop, 10);
            setTimeout(scrollToTop, 50);
            setTimeout(scrollToTop, 100);
        });
    } else {
        // DOM already loaded
        scrollToTop();
        setTimeout(scrollToTop, 0);
        setTimeout(scrollToTop, 10);
        setTimeout(scrollToTop, 50);
        setTimeout(scrollToTop, 100);
    }
    
    // Prevent scroll on window load
    window.addEventListener('load', function() {
        scrollToTop();
        setTimeout(scrollToTop, 0);
        setTimeout(scrollToTop, 10);
        // Mark initial load as complete after a delay
        setTimeout(function() {
            isInitialLoad = false;
        }, 300);
    }, { once: true });
    
    // Handle pageshow event (for back/forward navigation and refresh)
    window.addEventListener('pageshow', function(event) {
        scrollToTop();
        setTimeout(scrollToTop, 0);
        setTimeout(scrollToTop, 10);
        
        // If page was restored from cache, reset scroll
        if (event.persisted) {
            setTimeout(scrollToTop, 50);
            setTimeout(scrollToTop, 100);
        }
        
        // Reset initial load flag
        loadStartTime = performance.now();
        isInitialLoad = true;
        setTimeout(function() {
            isInitialLoad = false;
        }, 300);
    });
    
    // Prevent scrollIntoView from causing unwanted scrolling during initial load
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function(options) {
        // Prevent automatic scrolling during initial load (first 500ms)
        const timeSinceLoad = performance.now() - loadStartTime;
        if (isInitialLoad && timeSinceLoad < 500) {
            // Page just loaded, prevent automatic scrolling
            return;
        }
        // Allow normal scrolling after initial load
        return originalScrollIntoView.call(this, options);
    };
    
    // Monitor and correct any unwanted scrolling during initial load
    let lastScrollTop = 0;
    let scrollCorrectionTimer = null;
    
    function monitorScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        
        // If page scrolled automatically during initial load, correct it
        if (isInitialLoad && currentScroll > 5 && lastScrollTop === 0) {
            // Clear any existing timer
            if (scrollCorrectionTimer) {
                clearTimeout(scrollCorrectionTimer);
            }
            
            // Correct the scroll
            scrollCorrectionTimer = setTimeout(function() {
                scrollToTop();
            }, 0);
        }
        
        lastScrollTop = currentScroll;
    }
    
    // Monitor scroll events during initial load
    window.addEventListener('scroll', monitorScroll, { passive: true });
    
    // Stop monitoring after initial load completes
    setTimeout(function() {
        window.removeEventListener('scroll', monitorScroll);
    }, 500);
    
    // Prevent hash from causing scroll on page load
    if (window.location.hash) {
        // Use a small delay to ensure page has rendered
        requestAnimationFrame(function() {
            const hash = window.location.hash;
            // Remove hash temporarily to prevent scroll
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
            scrollToTop();
            
            // Restore hash after ensuring we're at top (optional - only if needed)
            // Most pages don't need hash restoration
        });
    }
})();

