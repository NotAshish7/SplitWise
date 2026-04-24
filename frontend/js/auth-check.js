// Authentication Check and Session Management
// Include this file in all protected pages (dashboard, expenses, groups, reports, settings)

(function() {
    'use strict';
    
    // Check authentication
    function checkAuth() {
        const token = localStorage.getItem('token');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const user = localStorage.getItem('user');
        const justLoggedOut = localStorage.getItem('justLoggedOut');
        
        // If user just logged out, redirect to landing page
        if (justLoggedOut === 'true') {
            console.log('🚫 Access denied: User just logged out');
            window.location.replace('frontend.html');
            return false;
        }
        
        // If no authentication data, redirect to landing page
        if (!token || !user) {
            console.log('🚫 Access denied: No authentication found');
            window.location.replace('frontend.html');
            return false;
        }
        
        return true;
    }
    
    // Handle back button - redirect to landing page if not authenticated
    window.addEventListener('popstate', function(event) {
        console.log('⬅️ Back button pressed - checking authentication...');
        const token = localStorage.getItem('token');
        const justLoggedOut = localStorage.getItem('justLoggedOut');
        
        if (!token || justLoggedOut === 'true') {
            console.log('🚫 Not authenticated - redirecting to landing page');
            event.preventDefault();
            window.history.pushState(null, '', window.location.href);
            window.location.replace('frontend.html');
        } else {
            // If authenticated, still prevent actual back navigation
            window.history.pushState(null, '', window.location.href);
        }
    });
    
    // Prevent back button after logout by manipulating history
    window.history.pushState(null, "", window.location.href);
    
    // Listen for logout events from other tabs (cross-tab session invalidation)
    window.addEventListener('storage', function(event) {
        // Detect logout event from another tab
        if (event.key === 'logoutEvent') {
            console.log('🚪 Logout detected in another tab - invalidating this session...');
            
            // Clear local auth data completely
            sessionStorage.clear();
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            
            // Clear cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Show notification if available
            if (typeof showNotification === 'function') {
                showNotification('You have been logged out from another tab', 'error');
            }
            
            // Redirect to landing page after a brief delay
            setTimeout(() => {
                console.log('✅ Session invalidated - redirecting to landing page');
                window.location.replace('frontend.html');
            }, 1500);
        }
        
        // Detect account deletion from another tab
        if (event.key === 'accountDeleted') {
            console.log('🗑️ Account deletion detected in another tab');
            
            // Clear everything
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect immediately
            window.location.replace('frontend.html');
        }
    });
    
    // Global logout function
    window.performLogout = function() {
        console.log('🚪 Performing logout...');
        
        // Broadcast logout event to other tabs
        const logoutTimestamp = new Date().getTime();
        localStorage.setItem('logoutEvent', logoutTimestamp);
        
        // Clear session data
        sessionStorage.clear();
        
        // Remove auth data completely
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        
        // Set logout flag permanently
        localStorage.setItem('justLoggedOut', 'true');
        
        // Clear cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('✅ Logout complete - redirecting to landing page');
        
        // Clear browser history and redirect to landing page
        window.history.pushState(null, '', 'frontend.html');
        window.location.replace('frontend.html');
    };
    
    // Global delete account function
    window.performDeleteAccount = function() {
        console.log('🗑️ Performing account deletion...');
        
        // Broadcast deletion event to other tabs
        localStorage.setItem('accountDeleted', 'true');
        
        // Clear all data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('✅ Account deletion complete - redirecting to landing page');
        
        // Redirect to landing page
        window.location.replace('frontend.html');
    };
    
    // ROOT CAUSE FIX: Only run secondary check if initial check passed
    // The initial check in <head> already redirected if not authenticated
    // This is a backup check for edge cases (but should rarely execute)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Only check if body is marked as authenticated (initial check passed)
            if (!document.body.classList.contains('authenticated')) {
                // If not authenticated, the initial check should have redirected
                // But double-check as backup
                if (!checkAuth()) {
                    return;
                }
            }
            // Mark as authenticated if not already
            document.body.classList.remove('auth-checking');
            document.body.classList.add('authenticated');
        });
    } else {
        // Page already loaded - same logic
        if (!document.body.classList.contains('authenticated')) {
            if (!checkAuth()) {
                return;
            }
        }
        document.body.classList.remove('auth-checking');
        document.body.classList.add('authenticated');
    }
    
    // Periodically check if user is still logged in (every 30 seconds instead of 3)
    // Reduced frequency to improve performance
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            checkAuth();
        }
    }, 30000);
    
})();

