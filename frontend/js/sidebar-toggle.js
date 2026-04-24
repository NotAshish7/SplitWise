// Sidebar Toggle Functionality - Desktop Only
(function () {
    'use strict';

    // ROOT CAUSE FIX: Load sidebar state from backend
    async function getSidebarStateFromBackend() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('📦 No auth token, sidebar will use default state');
                return null;
            }

            const API_BASE = window.API_BASE || 'https://api.splitwise.space/api';
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('⚠️ Failed to fetch user data, sidebar will use default state');
                return null;
            }

            const data = await response.json();
            // ROOT CAUSE FIX: The backend returns { success: true, data: { sidebar_collapsed: ... } }
            if (data.success && data.data && typeof data.data.sidebar_collapsed === 'boolean') {
                console.log('✅ Sidebar state from backend:', data.data.sidebar_collapsed);
                return data.data.sidebar_collapsed;
            }

            console.warn('⚠️ Backend response missing sidebar_collapsed:', data);
            return null;
        } catch (error) {
            console.error('❌ Error fetching sidebar state from backend:', error);
            return null;
        }
    }

    // ROOT CAUSE FIX: Save sidebar state to backend
    async function saveSidebarStateToBackend(isCollapsed) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('⚠️ No auth token, cannot save sidebar state to backend');
                return false;
            }

            const API_BASE = window.API_BASE || 'https://api.splitwise.space/api';
            const response = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sidebar_collapsed: isCollapsed
                })
            });

            if (!response.ok) {
                console.error('❌ Failed to save sidebar state to backend:', response.status);
                return false;
            }

            const data = await response.json();
            if (data.success) {
                console.log('✅ Sidebar state saved to backend:', isCollapsed);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error saving sidebar state to backend:', error);
            return false;
        }
    }

    // ROOT CAUSE FIX: Apply saved state immediately (before DOM loads) to prevent glitch
    (function applyCollapsedStateImmediately() {
        // ROOT CAUSE FIX: Try to get state from backend, but don't wait (async issue)
        // We'll load it properly in DOMContentLoaded
        // For now, check if user data is already in localStorage from login
        const userData = localStorage.getItem('user');
        let savedState = null;
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (typeof user.sidebar_collapsed === 'boolean') {
                    savedState = user.sidebar_collapsed;
                }
            } catch (e) {
                console.warn('⚠️ Could not parse user data from localStorage');
            }
        }

        // ROOT CAUSE FIX: Apply state immediately whether collapsed or expanded
        if (savedState === true) {
            // Add comprehensive style to head to apply ALL collapsed state instantly
            const style = document.createElement('style');
            style.id = 'sidebar-instant-collapse';
            style.textContent = `
                .sidebar { 
                    width: 80px !important;
                    transition: none !important;
                }
                .sidebar .sidebar-header h5 span,
                .sidebar .nav-link span,
                .sidebar .notification-bell span:not(.notification-badge) {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
                .sidebar .nav-link {
                    justify-content: center !important;
                    padding: 1rem 0.5rem !important;
                }
                .sidebar .nav-link i {
                    margin-right: 0 !important;
                    font-size: 1.2rem !important;
                }
                .sidebar .notification-bell {
                    flex-direction: column !important;
                    padding: 1rem 0.5rem !important;
                    gap: 0.3rem !important;
                }
                .sidebar .sidebar-header h5 {
                    text-align: center !important;
                    font-size: 1.5rem !important;
                }
                .sidebar .sidebar-header h5 i {
                    margin-right: 0 !important;
                }
                .sidebar .sidebar-header {
                    padding: 0.5rem 0.3rem !important;
                }
                .main-content {
                    margin-left: 80px !important;
                    transition: none !important;
                }
                footer {
                    margin-left: 80px !important;
                    width: calc(100% - 80px) !important;
                    transition: none !important;
                }
                .sidebar-toggle-btn {
                    left: 80px !important;
                    transition: none !important;
                }
            `;
            document.head.appendChild(style);

            // ROOT CAUSE FIX: Also add class to body immediately for consistency
            if (document.body) {
                document.body.classList.add('sidebar-collapsed');
            } else {
                // If body doesn't exist yet, wait for it
                document.addEventListener('DOMContentLoaded', function () {
                    document.body.classList.add('sidebar-collapsed');
                });
            }
        } else if (savedState === false) {
            // ROOT CAUSE FIX: Explicitly ensure expanded state is maintained
            if (document.body) {
                document.body.classList.remove('sidebar-collapsed');
            } else {
                document.addEventListener('DOMContentLoaded', function () {
                    document.body.classList.remove('sidebar-collapsed');
                });
            }
        }
    })();

    let sidebar = null;

    // Global toggle function (defined outside DOMContentLoaded so it's always accessible)
    let globalToggleSidebar = null;

    // ROOT CAUSE FIX: Wait for DOM to load and restore sidebar state consistently
    document.addEventListener('DOMContentLoaded', function () {
        sidebar = document.querySelector('.sidebar');

        if (!sidebar) {
            console.warn('Sidebar not found');
            return;
        }

        // ROOT CAUSE FIX: First apply state from localStorage (instant display), then verify with backend
        // Step 1: Apply state from localStorage immediately (synchronous)
        const userData = localStorage.getItem('user');
        let localStorageState = null;
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (typeof user.sidebar_collapsed === 'boolean') {
                    localStorageState = user.sidebar_collapsed;
                    if (localStorageState === true) {
                        sidebar.classList.add('collapsed');
                        document.body.classList.add('sidebar-collapsed');
                        console.log('✅ Sidebar state applied from localStorage: collapsed');
                    } else {
                        sidebar.classList.remove('collapsed');
                        document.body.classList.remove('sidebar-collapsed');
                        console.log('✅ Sidebar state applied from localStorage: expanded');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Could not parse user data from localStorage');
            }
        }

        // Step 2: Fetch latest state from backend and update if different (asynchronous)
        getSidebarStateFromBackend().then(backendState => {
            if (backendState !== null && typeof backendState === 'boolean') {
                // Only update if backend state differs from localStorage
                if (backendState !== localStorageState) {
                    if (backendState === true) {
                        sidebar.classList.add('collapsed');
                        document.body.classList.add('sidebar-collapsed');
                        console.log('✅ Sidebar state updated from backend: collapsed (was', localStorageState, ')');

                        // Update localStorage to match backend
                        if (userData) {
                            try {
                                const user = JSON.parse(userData);
                                user.sidebar_collapsed = true;
                                localStorage.setItem('user', JSON.stringify(user));
                            } catch (e) {
                                console.warn('⚠️ Could not update localStorage');
                            }
                        }
                    } else {
                        sidebar.classList.remove('collapsed');
                        document.body.classList.remove('sidebar-collapsed');
                        console.log('✅ Sidebar state updated from backend: expanded (was', localStorageState, ')');

                        // Update localStorage to match backend
                        if (userData) {
                            try {
                                const user = JSON.parse(userData);
                                user.sidebar_collapsed = false;
                                localStorage.setItem('user', JSON.stringify(user));
                            } catch (e) {
                                console.warn('⚠️ Could not update localStorage');
                            }
                        }
                    }
                } else {
                    console.log('✅ Sidebar state matches backend:', backendState);
                }
            } else {
                console.warn('⚠️ Backend returned invalid state, keeping localStorage state');
            }
        }).catch(error => {
            console.error('❌ Error loading sidebar state from backend:', error);
            // Keep localStorage state if backend fails
        });

        // Remove instant collapse style after DOM is ready
        setTimeout(function () {
            const instantStyle = document.getElementById('sidebar-instant-collapse');
            if (instantStyle) {
                instantStyle.remove();
            }
        }, 50);

        // Create desktop toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
        toggleBtn.setAttribute('title', 'Toggle Menu (Ctrl+B)');
        document.body.appendChild(toggleBtn);

        // State will be loaded from backend, icon doesn't need special initialization
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';

        // Add tooltips to nav links
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const textSpan = link.querySelector('span');
            if (textSpan) {
                link.setAttribute('data-tooltip', textSpan.textContent.trim());
            }
        });

        // Mobile menu functionality
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        // FIXED: Include tablets in mobile breakpoint (1024px for tablets)
        const isMobile = window.innerWidth <= 1024;

        // FIXED: Initialize button visibility on page load
        function initializeButtonVisibility() {
            const currentWidth = window.innerWidth;
            const isMobileView = currentWidth <= 1024;

            const currentMobileBtn = document.getElementById('mobileMenuBtn');
            const currentDesktopBtn = document.getElementById('desktopNavToggle');

            if (isMobileView) {
                // Mobile/tablet view
                if (currentMobileBtn) {
                    currentMobileBtn.style.display = 'flex';
                    currentMobileBtn.style.visibility = 'visible';
                    currentMobileBtn.style.opacity = '1';
                }
                if (currentDesktopBtn) {
                    currentDesktopBtn.style.display = 'none';
                    currentDesktopBtn.style.visibility = 'hidden';
                    currentDesktopBtn.style.opacity = '0';
                }
            } else {
                // Desktop view
                if (currentMobileBtn) {
                    currentMobileBtn.style.display = 'none';
                    currentMobileBtn.style.visibility = 'hidden';
                    currentMobileBtn.style.opacity = '0';
                }
                if (currentDesktopBtn) {
                    currentDesktopBtn.style.display = 'flex';
                    currentDesktopBtn.style.visibility = 'visible';
                    currentDesktopBtn.style.opacity = '1';
                }
            }

            console.log(`🔘 Buttons initialized: ${currentWidth}px - Mobile: ${isMobileView}`);
        }

        // Initialize on load
        initializeButtonVisibility();

        // ROOT CAUSE FIX: Store scroll position before locking body
        let bodyScrollPosition = 0;

        // ROOT CAUSE FIX: Function to lock body scroll
        function lockBodyScroll() {
            // Store current scroll position
            bodyScrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

            // Lock body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${bodyScrollPosition}px`;
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.classList.add('sidebar-open');

            // Lock main content scroll
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.overflow = 'hidden';
                mainContent.style.position = 'fixed';
            }
        }

        // ROOT CAUSE FIX: Function to unlock body scroll
        function unlockBodyScroll() {
            // Unlock body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.body.classList.remove('sidebar-open');

            // Restore scroll position
            window.scrollTo(0, bodyScrollPosition);

            // Unlock main content scroll
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.overflow = '';
                mainContent.style.position = '';
            }
        }

        // ROOT CAUSE FIX: Function to show/hide mobile menu with proper scroll locking
        function toggleMobileMenu() {
            if (!sidebar) return;

            const isOpening = !sidebar.classList.contains('show');

            sidebar.classList.toggle('show');

            // Get fresh overlay reference and ensure it's properly displayed
            const currentOverlay = document.getElementById('sidebarOverlay');
            if (currentOverlay) {
                currentOverlay.classList.toggle('show');
                // Ensure overlay is visible and clickable when sidebar is open
                if (isOpening) {
                    currentOverlay.style.display = 'block';
                    currentOverlay.style.pointerEvents = 'auto';
                    currentOverlay.style.cursor = 'pointer';
                    currentOverlay.style.zIndex = '998';
                } else {
                    currentOverlay.style.display = 'none';
                    currentOverlay.style.pointerEvents = 'none';
                }
            }

            // ROOT CAUSE FIX: Lock/unlock body scroll when menu opens/closes
            if (sidebar.classList.contains('show')) {
                lockBodyScroll();
            } else {
                unlockBodyScroll();
            }
        }

        // Close mobile menu when clicking overlay (blank space) - FIXED: Use event delegation for reliability
        // Use event delegation on document to catch clicks even if overlay is dynamically added
        document.addEventListener('click', function (e) {
            const overlay = document.getElementById('sidebarOverlay');
            const currentSidebar = document.querySelector('.sidebar');

            // Only proceed if overlay exists and sidebar is open
            if (!overlay || !currentSidebar || !overlay.classList.contains('show')) {
                return;
            }

            // Check if click target is the overlay itself (not sidebar or its children)
            const clickedOnOverlay = e.target === overlay || overlay.contains(e.target);
            const clickedOnSidebar = currentSidebar.contains(e.target);

            // Close if clicking on overlay but not on sidebar
            if (clickedOnOverlay && !clickedOnSidebar) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🌑 Overlay (blank space) clicked - closing sidebar');

                // Force close mobile menu
                currentSidebar.classList.remove('show');
                currentSidebar.style.left = '';
                currentSidebar.style.transform = '';

                // Force reflow
                currentSidebar.offsetHeight;

                overlay.classList.remove('show');
                overlay.style.display = 'none';
                overlay.style.pointerEvents = 'none';

                // ROOT CAUSE FIX: Unlock body scroll when closing via overlay
                unlockBodyScroll();

                console.log('✅ Sidebar closed via overlay click');
            }
        }, true); // Use capture phase for early handling

        // Prevent clicks on sidebar from bubbling to document
        if (sidebar) {
            sidebar.addEventListener('click', function (e) {
                e.stopPropagation();
            }, true);
        }

        // Close mobile menu when clicking a nav link (use existing navLinks from above)
        // Note: navLinks is already defined above, so we reuse it
        if (navLinks && navLinks.length > 0) {
            navLinks.forEach(link => {
                // Remove any existing mobile click handlers to avoid duplicates
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);

                newLink.addEventListener('click', function () {
                    // FIXED: Include tablets (1024px) in mobile breakpoint
                    const isNowMobile = window.innerWidth <= 1024;
                    if (isNowMobile && sidebar && sidebar.classList.contains('show')) {
                        sidebar.classList.remove('show');
                        if (sidebarOverlay) {
                            sidebarOverlay.classList.remove('show');
                            sidebarOverlay.style.display = 'none';
                        }
                        // ROOT CAUSE FIX: Unlock body scroll when nav link is clicked
                        unlockBodyScroll();
                    }
                });
            });
        }

        // Mobile menu button click handler - FIXED: Clone to remove duplicates and ensure it works
        if (mobileMenuBtn) {
            // Remove any existing listeners to avoid duplicates
            const newMobileBtn = mobileMenuBtn.cloneNode(true);
            mobileMenuBtn.parentNode.replaceChild(newMobileBtn, mobileMenuBtn);

            newMobileBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🍔 Mobile menu button clicked - toggling sidebar');

                // Toggle mobile menu
                if (sidebar) {
                    sidebar.classList.toggle('show');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.toggle('show');
                    }

                    // ROOT CAUSE FIX: Lock/unlock body scroll when menu opens/closes
                    if (sidebar.classList.contains('show')) {
                        lockBodyScroll();
                        console.log('✅ Sidebar opened');
                    } else {
                        unlockBodyScroll();
                        console.log('✅ Sidebar closed');
                    }
                }
            });
        }

        // Sidebar close button (inside sidebar) - for mobile
        const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
        if (sidebarCloseBtn) {
            // Remove any existing listeners to avoid duplicates
            const newCloseBtn = sidebarCloseBtn.cloneNode(true);
            sidebarCloseBtn.parentNode.replaceChild(newCloseBtn, sidebarCloseBtn);

            newCloseBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🔴 Close button clicked - closing sidebar');

                // Get fresh references to ensure we're working with current DOM
                const currentSidebar = document.querySelector('.sidebar');
                const currentOverlay = document.getElementById('sidebarOverlay');

                // Force close mobile menu - remove ALL possible classes and reset styles
                if (currentSidebar) {
                    currentSidebar.classList.remove('show');
                    currentSidebar.style.left = '';
                    currentSidebar.style.transform = '';

                    // Force reflow to ensure CSS applies
                    currentSidebar.offsetHeight;

                    if (currentOverlay) {
                        currentOverlay.classList.remove('show');
                        currentOverlay.style.display = 'none';
                    }

                    document.body.style.overflow = '';
                    document.body.classList.remove('sidebar-open');

                    console.log('✅ Sidebar closed - classes removed and styles reset');
                } else {
                    console.error('❌ Sidebar not found when closing');
                }
            });
        }

        // Handle window resize - FIXED: Properly manage button visibility and sidebar state
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                const currentWidth = window.innerWidth;
                const isNowMobile = currentWidth <= 1024; // FIXED: Use 1024px for tablets

                // Get fresh references
                const currentSidebar = document.querySelector('.sidebar');
                const currentOverlay = document.getElementById('sidebarOverlay');
                const currentMobileBtn = document.getElementById('mobileMenuBtn');
                const currentDesktopBtn = document.getElementById('desktopNavToggle');

                if (!isNowMobile) {
                    // Resizing to desktop - close mobile menu and ensure proper button visibility
                    if (currentSidebar && currentSidebar.classList.contains('show')) {
                        currentSidebar.classList.remove('show');
                        currentSidebar.style.left = '';
                        currentSidebar.style.transform = '';
                    }

                    if (currentOverlay) {
                        currentOverlay.classList.remove('show');
                        currentOverlay.style.display = 'none';
                    }

                    document.body.style.overflow = '';
                    document.body.classList.remove('sidebar-open');

                    // FIXED: Ensure buttons are properly visible/hidden
                    if (currentMobileBtn) {
                        currentMobileBtn.style.display = 'none';
                        currentMobileBtn.style.visibility = 'hidden';
                        currentMobileBtn.style.opacity = '0';
                    }
                    if (currentDesktopBtn) {
                        currentDesktopBtn.style.display = 'flex';
                        currentDesktopBtn.style.visibility = 'visible';
                        currentDesktopBtn.style.opacity = '1';
                    }
                } else {
                    // Resizing to mobile/tablet - ensure proper button visibility
                    if (currentMobileBtn) {
                        currentMobileBtn.style.display = 'flex';
                        currentMobileBtn.style.visibility = 'visible';
                        currentMobileBtn.style.opacity = '1';
                    }
                    if (currentDesktopBtn) {
                        currentDesktopBtn.style.display = 'none';
                        currentDesktopBtn.style.visibility = 'hidden';
                        currentDesktopBtn.style.opacity = '0';
                    }

                    // Close mobile menu if it was open (shouldn't auto-open on resize)
                    if (currentSidebar && currentSidebar.classList.contains('show')) {
                        // Keep it closed on resize to mobile
                        currentSidebar.classList.remove('show');
                        if (currentOverlay) {
                            currentOverlay.classList.remove('show');
                        }
                        document.body.style.overflow = '';
                    }
                }

                console.log(`📱 Resize handled: ${currentWidth}px - Mobile: ${isNowMobile}`);
            }, 250);
        });

        // Function to toggle sidebar (desktop only)
        function toggleSidebar() {
            if (!sidebar) {
                console.error('❌ Sidebar not found in toggleSidebar');
                return;
            }

            // Check if mobile/tablet - if so, use mobile menu toggle
            // FIXED: Include tablets (1024px) in mobile breakpoint
            if (window.innerWidth <= 1024) {
                toggleMobileMenu();
                return;
            }

            // Desktop: Collapse/expand sidebar
            console.log('🖥️ Desktop toggle - Current collapsed state:', sidebar.classList.contains('collapsed'));

            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));

            // Change icon based on state (always show hamburger, but could change later)
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';

            // ROOT CAUSE FIX: Save state to backend IMMEDIATELY
            const isCollapsed = sidebar.classList.contains('collapsed');

            // ROOT CAUSE FIX: Save to backend (async, don't wait)
            saveSidebarStateToBackend(isCollapsed).then(success => {
                if (success) {
                    // ROOT CAUSE FIX: Update user data in localStorage to keep it in sync
                    const userData = localStorage.getItem('user');
                    if (userData) {
                        try {
                            const user = JSON.parse(userData);
                            user.sidebar_collapsed = isCollapsed;
                            localStorage.setItem('user', JSON.stringify(user));
                        } catch (e) {
                            console.warn('⚠️ Could not update user data in localStorage');
                        }
                    }
                    console.log('🖥️ Desktop toggle - New collapsed state:', isCollapsed, 'Saved to backend');
                } else {
                    console.error('❌ Failed to save sidebar state to backend');
                }
            });

            // Wait for transition to complete before triggering resize to prevent layout shifts
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 300); // Match transition duration (0.3s = 300ms)

            // Trigger custom event
            window.dispatchEvent(new CustomEvent('sidebarToggle', {
                detail: {
                    collapsed: sidebar.classList.contains('collapsed'),
                    active: sidebar.classList.contains('active')
                }
            }));
        }

        // Store globally for debugging
        globalToggleSidebar = toggleSidebar;

        // ROOT CAUSE FIX: Save sidebar state before page unload/navigation
        window.addEventListener('beforeunload', function () {
            if (sidebar) {
                const isCollapsed = sidebar.classList.contains('collapsed');
                // ROOT CAUSE FIX: Use synchronous XMLHttpRequest for reliable saving during navigation
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const xhr = new XMLHttpRequest();
                        const API_BASE = window.API_BASE || 'https://api.splitwise.space/api';
                        xhr.open('PUT', `${API_BASE}/auth/profile`, false); // Synchronous for beforeunload
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.send(JSON.stringify({ sidebar_collapsed: isCollapsed }));
                        console.log('💾 Sidebar state saved to backend on page unload:', isCollapsed);
                    } catch (error) {
                        console.error('❌ Failed to save sidebar state on unload:', error);
                    }
                }
            }
        });

        // ROOT CAUSE FIX: Also save state when visibility changes (e.g., tab switching)
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && sidebar) {
                const isCollapsed = sidebar.classList.contains('collapsed');
                saveSidebarStateToBackend(isCollapsed);
                console.log('💾 Sidebar state saved to backend on visibility change:', isCollapsed);
            }
        });

        // Desktop toggle button click
        toggleBtn.addEventListener('click', function (e) {
            // ROOT CAUSE FIX: Prevent event bubbling and ensure it only triggers desktop logic
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Check if mobile/tablet - if so, use mobile menu toggle
            // FIXED: Include tablets (1024px) in mobile breakpoint
            if (window.innerWidth <= 1024) {
                toggleMobileMenu();
                return;
            }

            console.log('🖥️ Desktop toggle button clicked');

            // Desktop: Toggle sidebar collapse
            console.log('🖥️ Toggling sidebar (desktop mode)');
            toggleSidebar();
        });

        // ROOT CAUSE FIX: Save sidebar state when clicking navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                // ROOT CAUSE FIX: Save state to backend IMMEDIATELY before navigation happens
                if (sidebar) {
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    // ROOT CAUSE FIX: Use synchronous XMLHttpRequest for reliable saving during navigation
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const xhr = new XMLHttpRequest();
                            const API_BASE = window.API_BASE || 'https://api.splitwise.space/api';
                            xhr.open('PUT', `${API_BASE}/auth/profile`, false); // Synchronous for navigation
                            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                            xhr.setRequestHeader('Content-Type', 'application/json');
                            xhr.send(JSON.stringify({ sidebar_collapsed: isCollapsed }));
                            console.log('💾 Sidebar state saved to backend on nav link click:', isCollapsed);

                            // ROOT CAUSE FIX: Also update localStorage user data to keep it in sync
                            const userData = localStorage.getItem('user');
                            if (userData) {
                                try {
                                    const user = JSON.parse(userData);
                                    user.sidebar_collapsed = isCollapsed;
                                    localStorage.setItem('user', JSON.stringify(user));
                                } catch (e) {
                                    console.warn('⚠️ Could not update user data in localStorage');
                                }
                            }
                        } catch (error) {
                            console.error('❌ Failed to save sidebar state on nav click:', error);
                            // Fallback: try async save (might not complete before navigation)
                            saveSidebarStateToBackend(isCollapsed);
                        }
                    } else {
                        // Fallback: try async save (might not complete before navigation)
                        saveSidebarStateToBackend(isCollapsed);
                    }
                }
            });
        });

        // Keyboard shortcut: Ctrl + B to toggle sidebar
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        });

        // Add smooth hover effect for collapsed mode
        if (sidebar.classList.contains('collapsed')) {
            navLinks.forEach(link => {
                link.addEventListener('mouseenter', function () {
                    this.style.transform = 'translateX(5px)';
                });
                link.addEventListener('mouseleave', function () {
                    this.style.transform = '';
                });
            });
        }
    });
})();
