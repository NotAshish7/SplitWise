// Centralized Notification Management System
// Handles all app notifications with persistence

(function() {
    'use strict';
    
    // Notification types
    const NotificationType = {
        EXPENSE_ADDED: 'expense_added',
        EXPENSE_EDITED: 'expense_edited',
        EXPENSE_DELETED: 'expense_deleted',
        PAYMENT_MARKED: 'payment_marked',
        PAYMENT_RECEIVED: 'payment_received',
        GROUP_CREATED: 'group_created',
        GROUP_JOINED: 'group_joined',
        GROUP_LEFT: 'group_left',
        MEMBER_ADDED: 'member_added',
        MEMBER_REMOVED: 'member_removed',
        INVITE_RECEIVED: 'invite_received',
        REMINDER: 'reminder',
        SYSTEM: 'system'
    };
    
    // Get current user email
    function getCurrentUserEmail() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.email || 'guest';
    }
    
    // Get notifications from localStorage
    function getNotifications() {
        const userEmail = getCurrentUserEmail();
        const key = `notifications_${userEmail}`;
        const notifications = localStorage.getItem(key);
        
        if (notifications) {
            try {
                return JSON.parse(notifications);
            } catch (e) {
                console.error('Error parsing notifications:', e);
                return [];
            }
        }
        return [];
    }
    
    // Save notifications to localStorage
    function saveNotifications(notifications) {
        const userEmail = getCurrentUserEmail();
        const key = `notifications_${userEmail}`;
        localStorage.setItem(key, JSON.stringify(notifications));
        
        // Trigger update event
        window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
            detail: { count: notifications.filter(n => !n.read).length } 
        }));
    }
    
    // Add a new notification
    function addNotification(type, title, message, metadata = {}) {
        const notifications = getNotifications();
        
        const notification = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type,
            title,
            message,
            metadata,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        notifications.unshift(notification); // Add to beginning
        
        // Keep only last 100 notifications
        if (notifications.length > 100) {
            notifications.splice(100);
        }
        
        saveNotifications(notifications);
        
        // Show toast notification
        if (window.showNotification && metadata.showToast !== false) {
            const toastType = type.includes('delete') || type.includes('removed') ? 'error' : 
                            type.includes('payment') || type.includes('marked') ? 'success' : 'info';
            window.showNotification(title, toastType);
        }
        
        return notification;
    }
    
    // Mark notification as read
    function markAsRead(notificationId) {
        const notifications = getNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            saveNotifications(notifications);
        }
    }
    
    // Mark all as read
    function markAllAsRead() {
        const notifications = getNotifications();
        notifications.forEach(n => n.read = true);
        saveNotifications(notifications);
    }
    
    // Delete a notification
    function deleteNotification(notificationId) {
        let notifications = getNotifications();
        notifications = notifications.filter(n => n.id !== notificationId);
        saveNotifications(notifications);
    }
    
    // Clear all notifications
    function clearAllNotifications() {
        saveNotifications([]);
    }
    
    // Get unread count
    function getUnreadCount() {
        const notifications = getNotifications();
        return notifications.filter(n => !n.read).length;
    }
    
    // ROOT CAUSE FIX: Helper to format amount with currency conversion
    function formatAmountWithCurrency(amount, sourceCurrency = 'INR') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userCurrency = user.preferredCurrency || 'INR';
        const exchangeRates = JSON.parse(localStorage.getItem('exchangeRates') || '{}');
        
        // Convert amount if needed
        let displayAmount = amount;
        if (sourceCurrency !== userCurrency && exchangeRates[sourceCurrency] && exchangeRates[userCurrency]) {
            const amountInUSD = parseFloat(amount || 0) / (exchangeRates[sourceCurrency] || 1);
            displayAmount = amountInUSD * (exchangeRates[userCurrency] || 1);
        }
        
        // Get currency symbol
        const currencySymbol = typeof window.getCurrencySymbol === 'function' 
            ? window.getCurrencySymbol(userCurrency) 
            : (userCurrency === 'USD' ? '$' : userCurrency === 'EUR' ? '€' : userCurrency === 'GBP' ? '£' : userCurrency === 'JPY' ? '¥' : userCurrency === 'AUD' ? 'A$' : '₹');
        
        return `${currencySymbol}${parseFloat(displayAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Helper: Notify expense added to group
    function notifyExpenseAdded(groupName, amount, paidBy, description, currency = 'INR') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUser = user.name || 'You';
        
        // ROOT CAUSE FIX: Format amount with currency conversion
        const formattedAmount = formatAmountWithCurrency(amount, currency);
        
        if (paidBy === currentUser) {
            return addNotification(
                NotificationType.EXPENSE_ADDED,
                `Expense Added to ${groupName}`,
                `You added ${formattedAmount} for "${description}"`,
                { groupName, amount, paidBy, description, currency }
            );
        } else {
            return addNotification(
                NotificationType.EXPENSE_ADDED,
                `New Expense in ${groupName}`,
                `${paidBy} added ${formattedAmount} for "${description}"`,
                { groupName, amount, paidBy, description, currency }
            );
        }
    }
    
    // Helper: Notify expense edited
    function notifyExpenseEdited(groupName, description) {
        return addNotification(
            NotificationType.EXPENSE_EDITED,
            `Expense Updated`,
            `"${description}" in ${groupName} was updated`,
            { groupName, description }
        );
    }
    
    // Helper: Notify expense deleted
    function notifyExpenseDeleted(groupName, description) {
        return addNotification(
            NotificationType.EXPENSE_DELETED,
            `Expense Deleted`,
            `"${description}" was removed from ${groupName}`,
            { groupName, description }
        );
    }
    
    // Helper: Notify payment marked
    function notifyPaymentMarked(fromUser, toUser, amount, groupName, currency = 'INR') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUser = user.name || 'You';
        
        // ROOT CAUSE FIX: Format amount with currency conversion
        const formattedAmount = formatAmountWithCurrency(amount, currency);
        
        if (fromUser === currentUser) {
            return addNotification(
                NotificationType.PAYMENT_MARKED,
                `Payment Confirmation Sent`,
                `You marked ${formattedAmount} paid to ${toUser} in ${groupName}`,
                { fromUser, toUser, amount, groupName, currency }
            );
        } else {
            return addNotification(
                NotificationType.PAYMENT_RECEIVED,
                `Payment Received!`,
                `${fromUser} marked ${formattedAmount} as paid in ${groupName}`,
                { fromUser, toUser, amount, groupName, currency }
            );
        }
    }
    
    // Helper: Notify group created
    function notifyGroupCreated(groupName) {
        return addNotification(
            NotificationType.GROUP_CREATED,
            `Group Created`,
            `You created "${groupName}"`,
            { groupName }
        );
    }
    
    // Helper: Notify member joined
    function notifyMemberJoined(groupName, memberName) {
        return addNotification(
            NotificationType.MEMBER_ADDED,
            `New Member Joined`,
            `${memberName} joined ${groupName}`,
            { groupName, memberName }
        );
    }
    
    // Helper: Notify member removed
    function notifyMemberRemoved(groupName, memberName) {
        return addNotification(
            NotificationType.MEMBER_REMOVED,
            `Member Removed`,
            `${memberName} was removed from ${groupName}`,
            { groupName, memberName }
        );
    }
    
    // Helper: Notify left group
    function notifyLeftGroup(groupName) {
        return addNotification(
            NotificationType.GROUP_LEFT,
            `Left Group`,
            `You left ${groupName}`,
            { groupName }
        );
    }
    
    // Helper: Notify invite received
    function notifyInviteReceived(groupName, inviterName) {
        return addNotification(
            NotificationType.INVITE_RECEIVED,
            `Group Invitation`,
            `${inviterName} invited you to join ${groupName}`,
            { groupName, inviterName }
        );
    }
    
    // Get notification icon
    function getNotificationIcon(type) {
        const icons = {
            [NotificationType.EXPENSE_ADDED]: 'fa-receipt',
            [NotificationType.EXPENSE_EDITED]: 'fa-edit',
            [NotificationType.EXPENSE_DELETED]: 'fa-trash',
            [NotificationType.PAYMENT_MARKED]: 'fa-check-circle',
            [NotificationType.PAYMENT_RECEIVED]: 'fa-money-bill-wave',
            [NotificationType.GROUP_CREATED]: 'fa-users',
            [NotificationType.GROUP_JOINED]: 'fa-user-plus',
            [NotificationType.GROUP_LEFT]: 'fa-user-minus',
            [NotificationType.MEMBER_ADDED]: 'fa-user-plus',
            [NotificationType.MEMBER_REMOVED]: 'fa-user-times',
            [NotificationType.INVITE_RECEIVED]: 'fa-envelope',
            [NotificationType.REMINDER]: 'fa-bell',
            [NotificationType.SYSTEM]: 'fa-info-circle'
        };
        
        return icons[type] || 'fa-bell';
    }
    
    // Get notification color
    function getNotificationColor(type) {
        const colors = {
            [NotificationType.EXPENSE_ADDED]: '#667eea',
            [NotificationType.EXPENSE_EDITED]: '#f6c23e',
            [NotificationType.EXPENSE_DELETED]: '#e74a3b',
            [NotificationType.PAYMENT_MARKED]: '#1cc88a',
            [NotificationType.PAYMENT_RECEIVED]: '#1cc88a',
            [NotificationType.GROUP_CREATED]: '#36b9cc',
            [NotificationType.GROUP_JOINED]: '#36b9cc',
            [NotificationType.GROUP_LEFT]: '#858796',
            [NotificationType.MEMBER_ADDED]: '#36b9cc',
            [NotificationType.MEMBER_REMOVED]: '#e74a3b',
            [NotificationType.INVITE_RECEIVED]: '#f6c23e',
            [NotificationType.REMINDER]: '#f6c23e',
            [NotificationType.SYSTEM]: '#36b9cc'
        };
        
        return colors[type] || '#667eea';
    }
    
    // Export to window object
    window.NotificationManager = {
        // Core functions
        getNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        getUnreadCount,
        
        // Helper functions
        notifyExpenseAdded,
        notifyExpenseEdited,
        notifyExpenseDeleted,
        notifyPaymentMarked,
        notifyGroupCreated,
        notifyMemberJoined,
        notifyMemberRemoved,
        notifyLeftGroup,
        notifyInviteReceived,
        
        // Utility functions
        getNotificationIcon,
        getNotificationColor,
        
        // Types
        NotificationType
    };
    
})();


