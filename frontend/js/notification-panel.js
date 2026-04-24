// Notification Panel UI Component
// Renders and manages the notification sidebar panel

(function() {
    'use strict';
    
    // Initialize notification panel
    function initNotificationPanel() {
        // Update badge count
        updateBadgeCount();
        
        // Listen for notification updates
        window.addEventListener('notificationsUpdated', (e) => {
            updateBadgeCount();
            
            // If panel is open, refresh it
            const panel = document.getElementById('notificationPanel');
            if (panel && panel.classList.contains('show')) {
                renderNotifications();
            }
        });
        
        // ROOT CAUSE FIX: Listen for currency changes and refresh notifications
        window.addEventListener('storage', function(e) {
            if (e.key === 'user' || e.key === 'preferredCurrency' || e.key === 'exchangeRates') {
                // If panel is open, refresh it with new currency
                const panel = document.getElementById('notificationPanel');
                if (panel && panel.classList.contains('show')) {
                    renderNotifications();
                }
            }
        });
        
        // Also monitor localStorage changes in the same page
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            originalSetItem.apply(this, [key, value]);
            if (key === 'user' || key === 'exchangeRates') {
                setTimeout(() => {
                    const panel = document.getElementById('notificationPanel');
                    if (panel && panel.classList.contains('show')) {
                        renderNotifications();
                    }
                }, 100);
            }
        };
        
        // Setup event listeners
        setupEventListeners();
    }
    
    // ROOT CAUSE FIX: Update notification badge count - hide when count is 0
    function updateBadgeCount() {
        const count = window.NotificationManager.getUnreadCount();
        const badge = document.getElementById('notificationBadge');
        const bell = document.getElementById('notificationBellBtn');
        
        if (badge) {
            const previousCount = parseInt(badge.textContent) || 0;
            const hasNewNotification = count > previousCount;
            
            if (count > 0) {
                const badgeText = count > 9 ? '9+' : count.toString();
                badge.textContent = badgeText;
                // ROOT CAUSE FIX: Use flexbox for perfect centering of badge number
                badge.style.display = 'flex';
                badge.style.visibility = 'visible';
                badge.style.opacity = '1';
                // ROOT CAUSE FIX: Set data attribute for multi-digit styling
                if (count > 9) {
                    badge.setAttribute('data-count', '9+');
                    badge.style.width = 'auto';
                    badge.style.minWidth = '24px'; /* ROOT CAUSE FIX: Match CSS for "9+" */
                    badge.style.padding = '0 4px'; /* ROOT CAUSE FIX: Match CSS for "9+" */
                } else {
                    badge.removeAttribute('data-count');
                    badge.style.width = '20px'; /* ROOT CAUSE FIX: Match CSS single digit size */
                    badge.style.padding = '0';
                }
                
                // Add pop animation when count increases
                if (hasNewNotification) {
                    badge.classList.remove('badge-pop');
                    void badge.offsetWidth; // Trigger reflow
                    badge.classList.add('badge-pop');
                    
                    // Add shake animation to bell icon
                    if (bell) {
                        bell.classList.remove('has-new');
                        void bell.offsetWidth; // Trigger reflow
                        bell.classList.add('has-new');
                        
                        // Remove shake class after animation
                        setTimeout(() => {
                            bell.classList.remove('has-new');
                        }, 500);
                    }
                }
            } else {
                // ROOT CAUSE FIX: Hide badge completely when count is 0
                badge.style.display = 'none';
                badge.style.visibility = 'hidden';
                badge.style.opacity = '0';
                badge.textContent = ''; // Clear the text content
                badge.classList.remove('badge-pop');
                badge.removeAttribute('data-count');
            }
        }
    }
    
    // Toggle notification panel - FIXED: Make it globally accessible
    function toggleNotificationPanel() {
        console.log('🔔 toggleNotificationPanel called');
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('notificationOverlay');
        
        console.log('🔔 Panel:', panel, 'Overlay:', overlay);
        
        if (panel && overlay) {
            const isShown = panel.classList.contains('show');
            console.log('🔔 Panel is shown:', isShown);
            
            if (isShown) {
                panel.classList.remove('show');
                overlay.classList.remove('show');
                document.body.style.overflow = '';
                console.log('🔔 Panel closed');
            } else {
                panel.classList.add('show');
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                renderNotifications();
                console.log('🔔 Panel opened');
            }
        } else {
            console.error('❌ Notification panel or overlay not found!', { panel, overlay });
        }
    }
    
    // FIXED: Make toggleNotificationPanel globally accessible
    window.toggleNotificationPanel = toggleNotificationPanel;
    
    // ROOT CAUSE FIX: Format amount with currency conversion for notifications
    function formatNotificationAmount(amount, sourceCurrency = 'INR') {
        if (!amount && amount !== 0) return '';
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userCurrency = user.preferredCurrency || 'INR';
        const exchangeRates = JSON.parse(localStorage.getItem('exchangeRates') || '{}');
        
        // Convert amount if needed
        let displayAmount = parseFloat(amount || 0);
        if (sourceCurrency !== userCurrency && exchangeRates[sourceCurrency] && exchangeRates[userCurrency]) {
            const amountInUSD = parseFloat(amount || 0) / (exchangeRates[sourceCurrency] || 1);
            displayAmount = amountInUSD * (exchangeRates[userCurrency] || 1);
        }
        
        // Get currency symbol
        const currencySymbol = typeof window.getCurrencySymbol === 'function' 
            ? window.getCurrencySymbol(userCurrency) 
            : (userCurrency === 'USD' ? '$' : userCurrency === 'EUR' ? '€' : userCurrency === 'GBP' ? '£' : userCurrency === 'JPY' ? '¥' : userCurrency === 'AUD' ? 'A$' : '₹');
        
        return `${currencySymbol}${displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // ROOT CAUSE FIX: Re-format notification message with current currency
    function reformatNotificationMessage(notif) {
        // Check if notification has metadata with amount and currency
        if (notif.metadata && notif.metadata.amount !== undefined) {
            const amount = notif.metadata.amount;
            const currency = notif.metadata.currency || 'INR';
            const formattedAmount = formatNotificationAmount(amount, currency);
            
            // Reconstruct message based on notification type
            if (notif.type === 'expense_added' || notif.type === 'EXPENSE_ADDED') {
                const description = notif.metadata.description || '';
                const paidBy = notif.metadata.paidBy || notif.metadata.paid_by || '';
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const currentUser = user.name || 'You';
                
                if (paidBy === currentUser) {
                    return `You added ${formattedAmount} for "${description}"`;
                } else {
                    return `${paidBy} added ${formattedAmount} for "${description}"`;
                }
            } else if (notif.type === 'payment_marked' || notif.type === 'PAYMENT_MARKED' || notif.type === 'payment_received' || notif.type === 'PAYMENT_RECEIVED') {
                const fromUser = notif.metadata.fromUser || notif.metadata.from_user || '';
                const toUser = notif.metadata.toUser || notif.metadata.to_user || '';
                const groupName = notif.metadata.groupName || notif.metadata.group_name || '';
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const currentUser = user.name || 'You';
                
                if (fromUser === currentUser) {
                    return `You marked ${formattedAmount} paid to ${toUser} in ${groupName}`;
                } else {
                    return `${fromUser} marked ${formattedAmount} as paid in ${groupName}`;
                }
            }
        }
        
        // If no metadata, return original message
        return notif.message;
    }
    
    // Render notifications
    function renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        const notifications = window.NotificationManager.getNotifications();
        
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-bell-slash fa-3x mb-3" style="color: #ccc;"></i>
                    <p class="text-muted">No notifications yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = notifications.map(notif => {
            const icon = window.NotificationManager.getNotificationIcon(notif.type);
            const color = window.NotificationManager.getNotificationColor(notif.type);
            const timeAgo = getTimeAgo(notif.timestamp);
            
            // ROOT CAUSE FIX: Re-format message with current currency
            const formattedMessage = reformatNotificationMessage(notif);
            
            return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notification-icon" style="background-color: ${color}20; color: ${color};">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${formattedMessage}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-actions">
                        ${!notif.read ? `<button class="btn-mark-read" onclick="markNotificationRead('${notif.id}')" title="Mark as read">
                            <i class="fas fa-check"></i>
                        </button>` : ''}
                        <button class="btn-delete" onclick="deleteNotificationItem('${notif.id}')" title="Delete">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Get time ago string
    function getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const seconds = Math.floor((now - past) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        
        return past.toLocaleDateString();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // FIXED: Use event delegation on document for reliable click handling
        // This ensures the button works even if it's dynamically added/removed
        document.addEventListener('click', function(e) {
            const bellBtn = e.target.closest('#notificationBellBtn');
            if (bellBtn) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🔔 Notification bell clicked (event delegation)');
                toggleNotificationPanel();
                return false;
            }
        }, true); // Use capture phase for early handling
        
        // FIXED: Also handle touch events for mobile
        document.addEventListener('touchend', function(e) {
            const bellBtn = e.target.closest('#notificationBellBtn');
            if (bellBtn) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🔔 Notification bell touched (event delegation)');
                toggleNotificationPanel();
                return false;
            }
        }, true);
        
        // FIXED: Ensure button is always clickable - set styles directly
        const bellBtn = document.getElementById('notificationBellBtn');
        if (bellBtn) {
            bellBtn.style.pointerEvents = 'auto';
            bellBtn.style.cursor = 'pointer';
            bellBtn.style.zIndex = '1000';
            bellBtn.style.position = 'relative';
            // Remove any blocking styles
            bellBtn.style.userSelect = 'none';
            bellBtn.style.webkitUserSelect = 'none';
            bellBtn.style.mozUserSelect = 'none';
            bellBtn.style.msUserSelect = 'none';
        }
        
        // Overlay click to close
        const overlay = document.getElementById('notificationOverlay');
        if (overlay) {
            overlay.addEventListener('click', toggleNotificationPanel);
        }
        
        // Close button
        const closeBtn = document.getElementById('closeNotificationPanel');
        if (closeBtn) {
            closeBtn.addEventListener('click', toggleNotificationPanel);
        }
        
        // Mark all as read
        const markAllBtn = document.getElementById('markAllReadBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                window.NotificationManager.markAllAsRead();
                renderNotifications();
                updateBadgeCount();
            });
        }
        
        // Clear all - directly without confirmation
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                window.NotificationManager.clearAllNotifications();
                renderNotifications();
                updateBadgeCount();
            });
        }
    }
    
    // Mark single notification as read
    window.markNotificationRead = function(id) {
        window.NotificationManager.markAsRead(id);
        renderNotifications();
        updateBadgeCount();
    };
    
    // Delete single notification
    window.deleteNotificationItem = function(id) {
        window.NotificationManager.deleteNotification(id);
        renderNotifications();
        updateBadgeCount();
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationPanel);
    } else {
        initNotificationPanel();
    }
    
    // Export
    window.NotificationPanel = {
        toggle: toggleNotificationPanel,
        render: renderNotifications,
        updateBadge: updateBadgeCount
    };
    
    // FIXED: Re-setup event listeners after a delay to ensure DOM is ready
    setTimeout(function() {
        setupEventListeners();
        // Also ensure button styles are applied and add direct onclick handler
        const bellBtn = document.getElementById('notificationBellBtn');
        if (bellBtn) {
            bellBtn.style.pointerEvents = 'auto';
            bellBtn.style.cursor = 'pointer';
            bellBtn.style.zIndex = '1000';
            bellBtn.style.position = 'relative';
            
            // FIXED: Add direct onclick handler as fallback
            bellBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🔔 Notification bell clicked (direct onclick)');
                toggleNotificationPanel();
                return false;
            };
            
            // FIXED: Also add ontouchend for mobile
            bellBtn.ontouchend = function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🔔 Notification bell touched (direct ontouchend)');
                toggleNotificationPanel();
                return false;
            };
            
            console.log('🔔 Notification button styles and handlers applied');
        } else {
            console.warn('⚠️ Notification button not found on delayed setup');
        }
    }, 500);
    
    // FIXED: Also try to setup immediately if DOM is already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(function() {
            const bellBtn = document.getElementById('notificationBellBtn');
            if (bellBtn && !bellBtn.onclick) {
                bellBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔔 Notification bell clicked (immediate setup)');
                    toggleNotificationPanel();
                    return false;
                };
            }
        }, 100);
    }
    
})();

