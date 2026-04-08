// Skeleton Loading Utility
// Creates skeleton placeholders that match the structure of content

(function() {
    'use strict';
    
    // Create skeleton stats card
    window.createSkeletonStatsCard = function() {
        return `
            <div class="skeleton-stats-card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="skeleton skeleton-text" style="width: 70%; height: 0.875rem;"></div>
                    <div class="skeleton skeleton-icon"></div>
                </div>
                <div class="skeleton skeleton-amount" style="width: 60%; height: 2rem; margin-bottom: 0.75rem;"></div>
                <div class="skeleton skeleton-text" style="width: 50%; height: 0.75rem;"></div>
            </div>
        `;
    };
    
    // Create skeleton stat card (smaller) - for expenses/reports pages - EXACT MATCH to real stat-card
    window.createSkeletonStatCard = function() {
        return `
            <div class="stat-card skeleton-stat-card-wrapper" style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-top: 4px solid rgba(0,0,0,0.1); border: none; border-top: 4px solid rgba(0,0,0,0.1); position: relative; overflow: hidden; height: 100%;">
                <div class="stat-icon" style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                    <div class="skeleton skeleton-circle" style="width: 60px; height: 60px; border-radius: 50%; border: none !important;"></div>
                </div>
                <div class="skeleton skeleton-text" style="width: 60%; height: 0.875rem; margin-bottom: 0.5rem; border-radius: 4px; border: none !important;"></div>
                <div class="skeleton skeleton-amount" style="width: 50%; height: 1.5rem; border-radius: 4px; border: none !important;"></div>
            </div>
        `;
    };
    
    // Create skeleton stats card for groups page - EXACT MATCH to .card elements
    window.createSkeletonStatsCard = function() {
        return `
            <div class="card" style="background: var(--card-bg, #ffffff); border: none; position: relative; overflow: hidden; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); height: 100%;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="skeleton skeleton-text" style="width: 60%; height: 1rem; border-radius: 4px; border: none !important;"></div>
                    <div class="skeleton skeleton-circle" style="width: 2.5rem; height: 2.5rem; border-radius: 50%; border: none !important;"></div>
                </div>
                <div class="skeleton skeleton-amount" style="width: 40%; height: 1.5rem; margin-bottom: 0.5rem; border-radius: 4px; border: none !important;"></div>
                <div class="skeleton skeleton-text" style="width: 70%; height: 0.875rem; border-radius: 4px; border: none !important;"></div>
            </div>
        `;
    };
    
    // Create skeleton table row - EXACT MATCH to real table rows
    window.createSkeletonTableRow = function() {
        return `
            <tr class="skeleton-table-row" style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 1rem;"><div class="skeleton skeleton-text" style="width: 100px; height: 1rem; border-radius: 4px; border: none !important;"></div></td>
                <td style="padding: 1rem;"><div class="skeleton skeleton-text" style="width: 120px; height: 1.5rem; border-radius: 4px; border: none !important;"></div></td>
                <td style="padding: 1rem;"><div class="skeleton skeleton-text" style="width: 150px; height: 1rem; border-radius: 4px; border: none !important;"></div></td>
                <td style="padding: 1rem;"><div class="skeleton skeleton-text" style="width: 100px; height: 1.25rem; border-radius: 4px; border: none !important;"></div></td>
                <td style="padding: 1rem;"><div class="skeleton skeleton-button" style="width: 40px; height: 40px; border-radius: 8px; border: none !important;"></div></td>
            </tr>
        `;
    };
    
    // Create skeleton group card - EXACT MATCH to .group-card elements
    window.createSkeletonGroupCard = function() {
        return `
            <div class="col-md-4 mb-4">
                <div class="group-card" style="padding: 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); background: var(--card-bg, #ffffff); border: none; position: relative; overflow: hidden;">
                    <!-- Top gradient border (4px) -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);"></div>
                    <!-- Group title and badge -->
                    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-top: 0.5rem;">
                        <div class="skeleton skeleton-title" style="width: 40%; height: 1.5rem; border-radius: 4px;"></div>
                        <div class="skeleton skeleton-button" style="width: 80px; height: 1.5rem; border-radius: 20px; border: none !important;"></div>
                    </div>
                    <!-- Members section -->
                    <div class="skeleton skeleton-text" style="width: 50%; height: 0.875rem; margin-bottom: 0.75rem; border-radius: 4px;"></div>
                    <div class="d-flex gap-2 mb-3">
                        <div class="skeleton skeleton-button" style="width: 100px; height: 1.75rem; border-radius: 20px; border: none !important;"></div>
                    </div>
                    <!-- Action buttons -->
                    <div class="d-flex gap-2 mt-3">
                        <div class="skeleton skeleton-button" style="width: 120px; height: 2.5rem; border-radius: 10px; border: none !important;"></div>
                        <div class="skeleton skeleton-button" style="width: 120px; height: 2.5rem; border-radius: 10px; border: none !important;"></div>
                    </div>
                </div>
            </div>
        `;
    };
    
    // Create skeleton chart - EXACT MATCH to real chart-container
    window.createSkeletonChart = function() {
        return `
            <div class="chart-container" style="padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); background: var(--card-bg, #ffffff); margin-top: 3rem; position: relative; overflow: hidden;">
                <div class="skeleton skeleton-title" style="width: 60%; height: 1.5rem; margin-bottom: 1.5rem; border-radius: 4px; border: none !important;"></div>
                <div class="skeleton skeleton-chart" style="height: 300px; border-radius: 8px; border: none !important;"></div>
            </div>
        `;
    };
    
    // Create skeleton gradient stats card (for dashboard row 1) - EXACT MATCH to real tiles
    window.createSkeletonGradientCard = function() {
        return `
            <div class="stats-card" style="background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%); border: none; position: relative; overflow: hidden; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); height: 100%;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="skeleton skeleton-text" style="width: 60%; height: 0.875rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px;"></div>
                    <div class="skeleton skeleton-circle" style="width: 2.5rem; height: 2.5rem; background: rgba(255, 255, 255, 0.3); border-radius: 50%;"></div>
                </div>
                <div class="skeleton skeleton-amount" style="width: 50%; height: 1.5rem; margin-bottom: 0.5rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px;"></div>
                <div class="skeleton skeleton-text" style="width: 70%; height: 0.75rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px;"></div>
            </div>
        `;
    };
    
    // Create skeleton balance card (for dashboard row 2) - EXACT MATCH to real tiles
    window.createSkeletonBalanceCard = function() {
        return `
            <div class="stats-card" style="border-left: 4px solid #e0e0e0; border: 1px solid #e0e0e0; border-left: 4px solid #e0e0e0; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); height: 100%; background: var(--card-bg, #ffffff);">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="skeleton skeleton-text" style="width: 50%; height: 1.25rem; border-radius: 4px;"></div>
                    <div class="skeleton skeleton-circle" style="width: 2.5rem; height: 2.5rem; border-radius: 50%;"></div>
                </div>
                <div class="skeleton skeleton-amount" style="width: 40%; height: 1.5rem; margin-bottom: 0.5rem; border-radius: 4px;"></div>
                <div class="skeleton skeleton-text" style="width: 60%; height: 0.875rem; border-radius: 4px;"></div>
            </div>
        `;
    };
    
    // Create skeleton action card (for Quick Actions) - EXACT MATCH to real tiles
    window.createSkeletonActionCard = function() {
        return `
            <div class="action-card" style="pointer-events: none; padding: 2.2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); background: var(--card-bg, #ffffff);">
                <div class="skeleton skeleton-circle" style="width: 2.5rem; height: 2.5rem; margin: 0 auto 1.2rem; border-radius: 50%;"></div>
                <div class="skeleton skeleton-text" style="width: 70%; height: 1.25rem; margin: 0 auto 0.5rem; border-radius: 4px;"></div>
                <div class="skeleton skeleton-text" style="width: 85%; height: 0.875rem; margin: 0 auto; border-radius: 4px;"></div>
            </div>
        `;
    };
    
    // Create skeleton for action buttons row (Create Group, Join Group, Delete All, Search) - EXACT MATCH
    window.createSkeletonActionButtonsRow = function() {
        return `
            <div class="d-flex gap-2 mb-4 align-items-center flex-wrap">
                <!-- Create Group button - matches btn-primary with icon -->
                <div class="skeleton skeleton-button" style="width: 155px; height: 2.5rem; border-radius: 15px; border: none !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></div>
                <!-- Join Group button - matches btn-success with icon -->
                <div class="skeleton skeleton-button" style="width: 145px; height: 2.5rem; border-radius: 15px; border: none !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></div>
                <!-- Delete All Groups button - matches btn-danger with icon -->
                <div class="skeleton skeleton-button" style="width: 185px; height: 2.5rem; border-radius: 15px; border: none !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></div>
                <!-- Search bar - matches sw-search-bar -->
                <div class="sw-search-bar skeleton ms-auto" style="pointer-events: none;">
                    <i class="fas fa-search sw-search-icon" style="opacity: 0.5;"></i>
                </div>
            </div>
        `;
    };
    
    // Create skeleton for "Your Groups" heading section
    window.createSkeletonGroupsHeading = function() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="skeleton skeleton-text" style="width: 150px; height: 1.75rem; border-radius: 4px;"></div>
                <div class="d-flex gap-2">
                    <div class="skeleton skeleton-button" style="width: 120px; height: 2rem; border-radius: 10px;"></div>
                    <div class="skeleton skeleton-button" style="width: 100px; height: 2rem; border-radius: 10px;"></div>
                </div>
            </div>
        `;
    };
    
    // Create skeleton filter bar (buttons + search) - EXACT MATCH to real filter bar
    window.createSkeletonFilterBar = function() {
        return `
            <div class="d-flex gap-2 mb-4 align-items-center flex-wrap">
                <!-- Button group skeleton - matches btn-group with radio buttons -->
                <div class="btn-group" role="group" style="display: flex;">
                    <div class="skeleton skeleton-button" style="width: 140px; height: 2.5rem; border-radius: 15px 0 0 15px; border: none !important;"></div>
                    <div class="skeleton skeleton-button" style="width: 140px; height: 2.5rem; border-radius: 0 15px 15px 0; border: none !important;"></div>
                </div>
                <!-- Filter button skeleton -->
                <div class="skeleton skeleton-button" style="width: 120px; height: 2.5rem; border-radius: 15px; border: none !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></div>
                <!-- Search bar skeleton - matches sw-search-bar -->
                <div class="sw-search-bar skeleton ms-auto" style="pointer-events: none;">
                    <i class="fas fa-search sw-search-icon" style="opacity: 0.5;"></i>
                </div>
            </div>
        `;
    };
    
    // Create skeleton table header section (title only - badge is not skeletonized)
    window.createSkeletonTableHeader = function() {
        return `
            <div class="skeleton skeleton-title" style="width: 150px; height: 1.75rem; border-radius: 4px; border: none !important; text-align: left; display: inline-block;"></div>
        `;
    };
    
    // Create skeleton table header row - EXACT MATCH to real thead th
    window.createSkeletonTableHeaderRow = function() {
        return `
            <thead>
                <tr>
                    <th style="padding: 1rem; background: var(--navbar-bg, #667eea); color: white; border: none; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
                        <div class="skeleton skeleton-text" style="width: 80px; height: 0.875rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px; border: none !important;"></div>
                    </th>
                    <th style="padding: 1rem; background: var(--navbar-bg, #667eea); color: white; border: none; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
                        <div class="skeleton skeleton-text" style="width: 100px; height: 0.875rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px; border: none !important;"></div>
                    </th>
                    <th style="padding: 1rem; background: var(--navbar-bg, #667eea); color: white; border: none; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
                        <div class="skeleton skeleton-text" style="width: 120px; height: 0.875rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px; border: none !important;"></div>
                    </th>
                    <th style="padding: 1rem; background: var(--navbar-bg, #667eea); color: white; border: none; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
                        <div class="skeleton skeleton-text" style="width: 80px; height: 0.875rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px; border: none !important;"></div>
                    </th>
                    <th style="padding: 1rem; background: var(--navbar-bg, #667eea); color: white; border: none; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
                        <div class="skeleton skeleton-text" style="width: 80px; height: 0.875rem; background: rgba(255, 255, 255, 0.3); border-radius: 4px; border: none !important;"></div>
                    </th>
                </tr>
            </thead>
        `;
    };
    
    // Show skeleton dashboard (exactly like expenses/reports pages)
    window.showSkeletonDashboard = function() {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return;
        
        // Hide ALL existing content (like expenses/reports pages) - hide entire rows and sections
        const existingRows = container.querySelectorAll('.row:not(.skeleton-container)');
        existingRows.forEach(el => {
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
        });
        
        // Hide Quick Actions section
        const quickActions = container.querySelector('.quick-actions');
        if (quickActions) {
            quickActions.style.opacity = '0';
            quickActions.style.visibility = 'hidden';
            quickActions.style.position = 'absolute';
            quickActions.style.left = '-9999px';
        }
        
        // Hide Quick Actions heading
        const quickActionsHeading = container.querySelector('h4');
        if (quickActionsHeading && quickActionsHeading.textContent.includes('Quick Actions')) {
            quickActionsHeading.style.opacity = '0';
            quickActionsHeading.style.visibility = 'hidden';
            quickActionsHeading.style.position = 'absolute';
            quickActionsHeading.style.left = '-9999px';
        }
        
        // Create complete skeleton HTML matching EXACT dashboard structure and dimensions
        const skeletonHTML = `
            <div class="skeleton-container" id="dashboardSkeleton">
                <!-- Stats Cards Row 1 - 4 Gradient Cards (Personal Monthly, Personal Overall, Group Monthly, Group Overall) -->
                <!-- EXACT MATCH: col-md-3 mb-4, stats-card with padding: 2rem, border-radius: 20px -->
                <div class="row">
                    <div class="col-md-3 mb-4">${createSkeletonGradientCard()}</div>
                    <div class="col-md-3 mb-4">${createSkeletonGradientCard()}</div>
                    <div class="col-md-3 mb-4">${createSkeletonGradientCard()}</div>
                    <div class="col-md-3 mb-4">${createSkeletonGradientCard()}</div>
                </div>
                
                <!-- Stats Cards Row 2 - 3 Balance Cards (I'll Get Back, I Have to Pay, Net Balance) -->
                <!-- EXACT MATCH: col-md-4 mb-4, stats-card with padding: 2rem, border-radius: 20px, border-left -->
                <div class="row">
                    <div class="col-md-4 mb-4">${createSkeletonBalanceCard()}</div>
                    <div class="col-md-4 mb-4">${createSkeletonBalanceCard()}</div>
                    <div class="col-md-4 mb-4">${createSkeletonBalanceCard()}</div>
                </div>
                
                <!-- Quick Actions Skeleton -->
                <!-- EXACT MATCH: h4.mb-3 heading, quick-actions grid with gap: 1.8rem, action-card with padding: 2.2rem -->
                <div style="margin-bottom: 1.5rem;">
                    <h4 class="mb-3" style="opacity: 0.3; pointer-events: none;">
                        <div class="skeleton skeleton-text" style="width: 150px; height: 1.75rem; display: inline-block; border-radius: 4px;"></div>
                    </h4>
                    <div class="quick-actions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.8rem; margin-top: 3rem;">
                        ${createSkeletonActionCard()}
                        ${createSkeletonActionCard()}
                        ${createSkeletonActionCard()}
                    </div>
                </div>
                
                <!-- Charts Row 1 -->
                <!-- EXACT MATCH: chart-container with padding: 2rem, border-radius: 20px, margin-top: 3rem -->
                <div class="row mt-4">
                    <div class="col-md-6 mb-4">${createSkeletonChart()}</div>
                    <div class="col-md-6 mb-4">${createSkeletonChart()}</div>
                </div>
                
                <!-- Charts Row 2 -->
                <div class="row">
                    <div class="col-md-6 mb-4">${createSkeletonChart()}</div>
                    <div class="col-md-6 mb-4">${createSkeletonChart()}</div>
                </div>
            </div>
        `;
        
        // Only add skeleton if not already present
        if (!container.querySelector('#dashboardSkeleton')) {
            container.insertAdjacentHTML('afterbegin', skeletonHTML);
        }
    };
    
    // Show skeleton expenses (exactly like reports page)
    window.showSkeletonExpenses = function() {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return;
        
        const quickStats = document.getElementById('quickStats');
        const expenseTableBody = document.getElementById('expenseTableBody');
        const expenseTableCard = expenseTableBody ? expenseTableBody.closest('.card') : null;
        const filterBar = document.querySelector('.d-flex.gap-2.mb-4.align-items-center');
        const tableHeader = expenseTableCard ? expenseTableCard.querySelector('.d-flex.justify-content-between.align-items-center.mb-3') : null;
        const tableThead = expenseTableBody ? expenseTableBody.closest('table')?.querySelector('thead') : null;
        
        // Hide ALL existing content (like reports page does) - hide entire rows
        // First hide quickStats row
        if (quickStats) {
            quickStats.style.opacity = '0';
            quickStats.style.visibility = 'hidden';
            quickStats.style.position = 'absolute';
            quickStats.style.left = '-9999px';
            quickStats.classList.add('skeleton-loading');
        }
        
        // Hide filter bar
        if (filterBar) {
            filterBar.style.opacity = '0';
            filterBar.style.visibility = 'hidden';
            filterBar.style.position = 'absolute';
            filterBar.style.left = '-9999px';
        }
        
        // Don't hide table header - we'll skeletonize only the title, keep badge visible
        // tableHeader will be handled in the table card section below
        
        // Hide table thead - but save original content first
        if (tableThead) {
            // Save original thead HTML before replacing (only if not already saved)
            if (!tableThead.hasAttribute('data-original-html')) {
                const originalTheadHTML = tableThead.innerHTML;
                tableThead.setAttribute('data-original-html', originalTheadHTML);
            }
            tableThead.style.opacity = '0';
            tableThead.style.visibility = 'hidden';
        }
        
        // Hide other rows (but not skeleton containers) - but preserve month summary card display state
        const monthSummaryCard = document.getElementById('monthSummaryCard');
        if (monthSummaryCard) {
            const originalDisplay = monthSummaryCard.style.display || window.getComputedStyle(monthSummaryCard).display;
            monthSummaryCard.setAttribute('data-original-display', originalDisplay);
        }
        
        const existingRows = container.querySelectorAll('.row:not(.skeleton-container):not(#quickStats), .card:not(.skeleton-container):not(#expensesSkeleton)');
        existingRows.forEach(el => {
            // Skip month summary card if it's already hidden (display: none)
            if (el.id === 'monthSummaryCard' && window.getComputedStyle(el).display === 'none') {
                return; // Don't hide it further, just preserve its state
            }
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
        });
        
        // Create complete skeleton HTML (like reports page - includes stats skeleton)
        // This skeleton row will be visible where quickStats was
        const skeletonHTML = `
            <div class="skeleton-container" id="expensesSkeleton">
                <!-- Stats Cards Skeleton -->
                <div class="row mb-4" style="margin-bottom: 0.25rem !important;">
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                </div>
                
                <!-- Filter Bar Skeleton -->
                ${createSkeletonFilterBar()}
            </div>
        `;
        
        // Only add skeleton if not already present
        if (!container.querySelector('#expensesSkeleton')) {
            container.insertAdjacentHTML('afterbegin', skeletonHTML);
        }
        
        // ROOT CAUSE FIX: Hide entire table card when skeleton is shown (like reports page)
        // CRITICAL: Hide table card FIRST before showing skeleton to prevent any data from showing
        if (expenseTableCard) {
            // Hide the entire table card immediately
            expenseTableCard.style.opacity = '0';
            expenseTableCard.style.visibility = 'hidden';
            expenseTableCard.style.position = 'absolute';
            expenseTableCard.style.left = '-9999px';
            expenseTableCard.style.display = 'none';
        }
        
        // Show skeleton in table card (title only - badge stays visible)
        if (expenseTableCard && expenseTableBody) {
            // ROOT CAUSE FIX: Clear ALL existing table data immediately to prevent it from showing
            if (expenseTableBody) {
                // Clear any existing real rows immediately
                const realRows = expenseTableBody.querySelectorAll('tr:not(.skeleton-table-row)');
                realRows.forEach(row => {
                    row.style.display = 'none';
                    row.style.opacity = '0';
                    row.style.visibility = 'hidden';
                    row.remove(); // ROOT CAUSE FIX: Actually remove rows to prevent any display
                });
                
                // Also clear table content completely
                expenseTableBody.innerHTML = '';
            }
            
            // Hide the title text but keep the badge visible
            if (tableHeader) {
                const titleElement = tableHeader.querySelector('h5');
                const badgeElement = tableHeader.querySelector('#expenseCount, .badge');
                
                // Hide only the title text, keep badge visible
                if (titleElement && !titleElement.querySelector('.skeleton')) {
                    // Save original title text
                    const originalTitle = titleElement.innerHTML;
                    titleElement.setAttribute('data-original-title', originalTitle);
                    // Replace title with skeleton
                    titleElement.innerHTML = createSkeletonTableHeader();
                }
                
                // Ensure badge stays visible
                if (badgeElement) {
                    badgeElement.style.opacity = '1';
                    badgeElement.style.visibility = 'visible';
                    badgeElement.style.display = '';
                }
            }
            
            // Replace table thead with skeleton (original HTML is saved in data attribute)
            if (tableThead && !tableThead.querySelector('.skeleton')) {
                tableThead.innerHTML = createSkeletonTableHeaderRow();
                tableThead.style.opacity = '1';
                tableThead.style.visibility = 'visible';
            }
            
            // ROOT CAUSE FIX: Show skeleton in actual table body - replace ALL content
            if (expenseTableBody) {
                const skeletonRows = Array(5).fill(0).map(() => createSkeletonTableRow()).join('');
                expenseTableBody.innerHTML = skeletonRows;
            }
            
            // ROOT CAUSE FIX: Show table card with skeleton ONLY after skeleton rows are added
            // But keep it hidden until skeleton is removed (done in hideSkeleton function)
            // Don't show it here - let hideSkeleton handle showing it when data is ready
        }
    };
    
    // Show skeleton groups (exactly like expenses/reports page)
    window.showSkeletonGroups = function() {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return;
        
        const groupsContainer = document.getElementById('groupsContainer');
        const statsRow = document.querySelector('.row.mb-4');
        
        // Find action buttons row and "Your Groups" heading section
        // Action buttons row: contains Create Group, Join Group, Delete All Groups buttons
        const actionButtonsRow = Array.from(container.querySelectorAll('.d-flex.gap-2.mb-4')).find(el => 
            el.querySelector('button[onclick*="CreateGroup"]') || 
            el.querySelector('button[onclick*="openCreateGroupModal"]') ||
            el.querySelector('#deleteAllGroups')
        );
        // "Your Groups" heading section: contains heading and action buttons
        const groupsHeadingSection = Array.from(container.querySelectorAll('.d-flex.justify-content-between.align-items-center.mb-3')).find(el =>
            el.querySelector('h4') && 
            (el.querySelector('h4').textContent.includes('Your Groups') || el.querySelector('h4').textContent.includes('Groups'))
        );
        
        // Hide ALL existing content (like expenses/reports page does) - hide entire rows
        // First hide stats row
        if (statsRow) {
            statsRow.style.opacity = '0';
            statsRow.style.visibility = 'hidden';
            statsRow.style.position = 'absolute';
            statsRow.style.left = '-9999px';
            statsRow.classList.add('skeleton-loading');
        }
        
        // Hide action buttons row
        if (actionButtonsRow) {
            actionButtonsRow.style.opacity = '0';
            actionButtonsRow.style.visibility = 'hidden';
            actionButtonsRow.style.position = 'absolute';
            actionButtonsRow.style.left = '-9999px';
        }
        
        // Hide "Your Groups" heading section
        if (groupsHeadingSection) {
            groupsHeadingSection.style.opacity = '0';
            groupsHeadingSection.style.visibility = 'hidden';
            groupsHeadingSection.style.position = 'absolute';
            groupsHeadingSection.style.left = '-9999px';
        }
        
        // Hide groups container
        if (groupsContainer) {
            groupsContainer.style.opacity = '0';
            groupsContainer.style.visibility = 'hidden';
            groupsContainer.style.position = 'absolute';
            groupsContainer.style.left = '-9999px';
        }
        
        // Hide other rows (but not skeleton containers)
        const existingRows = container.querySelectorAll('.row:not(.skeleton-container):not(.row.mb-4)');
        existingRows.forEach(el => {
            if (el.id !== 'groupsContainer' && !el.querySelector('.skeleton-container')) {
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
                el.style.position = 'absolute';
                el.style.left = '-9999px';
            }
        });
        
        // Create complete skeleton HTML (like expenses/reports page - includes stats, action buttons, heading, and groups)
        const skeletonHTML = `
            <div class="skeleton-container" id="groupsSkeleton">
                <!-- Stats Cards Skeleton -->
                <div class="row mb-4" style="margin-bottom: 0.25rem !important;">
                    <div class="col-md-4 mb-3">${createSkeletonStatsCard()}</div>
                    <div class="col-md-4 mb-3">${createSkeletonStatsCard()}</div>
                    <div class="col-md-4 mb-3">${createSkeletonStatsCard()}</div>
                </div>
                
                <!-- Action Buttons Row Skeleton -->
                ${createSkeletonActionButtonsRow()}
                
                <!-- "Your Groups" Heading Skeleton -->
                ${createSkeletonGroupsHeading()}
                
                <!-- Groups Cards Skeleton -->
                <div class="row" id="groupsSkeletonContainer">
                    ${Array(3).fill(0).map(() => createSkeletonGroupCard()).join('')}
                </div>
            </div>
        `;
        
        // Only add skeleton if not already present
        if (!container.querySelector('#groupsSkeleton')) {
            container.insertAdjacentHTML('afterbegin', skeletonHTML);
        }
    };
    
    // Show skeleton reports
    window.showSkeletonReports = function() {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return;
        
        // Find table elements if they exist
        const expenseTableBody = document.getElementById('expenseTableBody') || container.querySelector('tbody');
        const expenseTableCard = expenseTableBody ? expenseTableBody.closest('.card') : null;
        const tableHeader = expenseTableCard ? expenseTableCard.querySelector('.d-flex.justify-content-between.align-items-center') : null;
        const tableThead = expenseTableBody ? expenseTableBody.closest('table')?.querySelector('thead') : null;
        
        // Find chart containers and filter buttons
        const chartContainers = container.querySelectorAll('.chart-container');
        const categoryChart = document.getElementById('categoryChart');
        const trendChart = document.getElementById('trendChart');
        const tableFilterButtons = expenseTableCard ? expenseTableCard.querySelector('.btn-group') : null;
        const chartFilterButtons = container.querySelectorAll('.chart-container .btn-group');
        
        // Hide existing content by making it invisible and removing from layout
        const existingContent = container.querySelectorAll('.row:not(.skeleton-container)');
        existingContent.forEach(el => {
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
        });
        
        // Hide chart containers
        chartContainers.forEach(chart => {
            chart.style.opacity = '0';
            chart.style.visibility = 'hidden';
            chart.style.position = 'absolute';
            chart.style.left = '-9999px';
        });
        
        // Hide chart canvases
        if (categoryChart) {
            categoryChart.style.opacity = '0';
            categoryChart.style.visibility = 'hidden';
        }
        if (trendChart) {
            trendChart.style.opacity = '0';
            trendChart.style.visibility = 'hidden';
        }
        
        // Hide filter buttons
        if (tableFilterButtons) {
            tableFilterButtons.style.opacity = '0';
            tableFilterButtons.style.visibility = 'hidden';
        }
        chartFilterButtons.forEach(btnGroup => {
            btnGroup.style.opacity = '0';
            btnGroup.style.visibility = 'hidden';
        });
        
        // Don't hide table header - we'll skeletonize only the title, keep badge visible
        // tableHeader will be handled in the table card section below
        
        // Hide table thead if exists - but save original content first
        if (tableThead) {
            // Save original thead HTML before replacing (only if not already saved)
            if (!tableThead.hasAttribute('data-original-html')) {
                const originalTheadHTML = tableThead.innerHTML;
                tableThead.setAttribute('data-original-html', originalTheadHTML);
            }
            tableThead.style.opacity = '0';
            tableThead.style.visibility = 'hidden';
        }
        
        const skeletonHTML = `
            <div class="skeleton-container" id="reportsSkeleton">
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                    <div class="col-md-3 mb-3">${createSkeletonStatCard()}</div>
                </div>
                
                <!-- Charts with skeleton -->
                <div class="row mt-4">
                    <div class="col-md-6 mb-4">${createSkeletonChart()}</div>
                    <div class="col-md-6 mb-4">${createSkeletonChart()}</div>
                </div>
            </div>
        `;
        
        // Only add skeleton if not already present
        if (!container.querySelector('#reportsSkeleton')) {
            container.insertAdjacentHTML('afterbegin', skeletonHTML);
        }
        
        // ROOT CAUSE FIX: Hide entire table card when skeleton is shown (EXACTLY like expenses page)
        // CRITICAL: Hide table card FIRST before showing skeleton to prevent any data from showing
        if (expenseTableCard) {
            // Hide the entire table card immediately with display: none (EXACTLY like expenses page)
            expenseTableCard.style.opacity = '0';
            expenseTableCard.style.visibility = 'hidden';
            expenseTableCard.style.position = 'absolute';
            expenseTableCard.style.left = '-9999px';
            expenseTableCard.style.display = 'none'; // ROOT CAUSE FIX: Critical - prevents any rendering
        }
        
        // Show skeleton in table if it exists (title only - badge stays visible)
        if (expenseTableCard && expenseTableBody) {
            // ROOT CAUSE FIX: Clear ALL existing table data immediately to prevent it from showing
            if (expenseTableBody) {
                // Clear any existing real rows immediately
                const realRows = expenseTableBody.querySelectorAll('tr:not(.skeleton-table-row)');
                realRows.forEach(row => {
                    row.style.display = 'none';
                    row.style.opacity = '0';
                    row.style.visibility = 'hidden';
                    row.remove(); // ROOT CAUSE FIX: Actually remove rows to prevent any display
                });
                
                // Also clear table content completely (EXACTLY like expenses page)
                expenseTableBody.innerHTML = '';
            }
            
            // Hide the title text but keep the badge visible
            if (tableHeader) {
                const titleElement = tableHeader.querySelector('h5');
                const badgeElement = tableHeader.querySelector('#expenseCount, .badge');
                
                // Hide only the title text, keep badge visible
                if (titleElement && !titleElement.querySelector('.skeleton')) {
                    // Save original title text
                    const originalTitle = titleElement.innerHTML;
                    titleElement.setAttribute('data-original-title', originalTitle);
                    // Replace title with skeleton
                    titleElement.innerHTML = createSkeletonTableHeader();
                }
                
                // Ensure badge stays visible
                if (badgeElement) {
                    badgeElement.style.opacity = '1';
                    badgeElement.style.visibility = 'visible';
                    badgeElement.style.display = '';
                }
                
                // Make table header visible
                tableHeader.style.opacity = '1';
                tableHeader.style.visibility = 'visible';
            }
            
            // Add skeleton filter buttons for table
            if (tableFilterButtons && !tableFilterButtons.querySelector('.skeleton')) {
                const skeletonFilterHTML = `
                    <div class="d-flex gap-2 mb-3">
                        <div class="skeleton skeleton-button" style="width: 120px; height: 2rem; border-radius: 10px 0 0 10px;"></div>
                        <div class="skeleton skeleton-button" style="width: 120px; height: 2rem;"></div>
                        <div class="skeleton skeleton-button" style="width: 120px; height: 2rem; border-radius: 0 10px 10px 0;"></div>
                    </div>
                `;
                tableFilterButtons.insertAdjacentHTML('beforebegin', skeletonFilterHTML);
            }
            
            // Replace table thead with skeleton (original HTML is saved in data attribute)
            if (tableThead && !tableThead.querySelector('.skeleton')) {
                tableThead.innerHTML = createSkeletonTableHeaderRow();
                tableThead.style.opacity = '1';
                tableThead.style.visibility = 'visible';
            }
            
            // ROOT CAUSE FIX: Show skeleton in actual table body - replace ALL content
            const skeletonRows = Array(5).fill(0).map(() => createSkeletonTableRow()).join('');
            expenseTableBody.innerHTML = skeletonRows;
            
            // ROOT CAUSE FIX: Show table card with skeleton, but it will be hidden until skeleton is removed
            expenseTableCard.style.opacity = '1';
            expenseTableCard.style.visibility = 'visible';
            expenseTableCard.style.position = '';
            expenseTableCard.style.left = '';
        }
    };
    
    // Hide skeleton with smooth fade out and animate content appearance
    window.hideSkeleton = function(skeletonId) {
        // Use requestAnimationFrame for smooth transitions
        requestAnimationFrame(() => {
            // For expenses page, handle both stats and table (exactly like reports page)
            if (skeletonId === 'expensesSkeleton') {
                const expenseTableBody = document.getElementById('expenseTableBody');
                const expenseTableCard = expenseTableBody ? expenseTableBody.closest('.card') : null;
                const quickStats = document.getElementById('quickStats');
                const container = document.querySelector('.main-content .container-fluid');
                
                // Find and fade out the skeleton container
                const skeleton = document.getElementById('expensesSkeleton');
                if (skeleton) {
                    skeleton.classList.add('fade-out');
                    setTimeout(() => {
                        skeleton.remove();
                        
                        // Remove skeleton table rows
                        if (expenseTableBody) {
                            const skeletonRows = expenseTableBody.querySelectorAll('.skeleton-table-row');
                            skeletonRows.forEach(row => row.remove());
                        }
                        
                        // Restore filter bar - CRITICAL: Find by class and check if hidden
                        const filterBar = container.querySelector('.d-flex.gap-2.mb-4.align-items-center');
                        if (filterBar && (filterBar.style.opacity === '0' || filterBar.style.position === 'absolute' || filterBar.style.left === '-9999px')) {
                            filterBar.style.position = '';
                            filterBar.style.left = '';
                            filterBar.style.display = '';
                            filterBar.classList.add('content-appearing');
                            setTimeout(() => {
                                filterBar.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                filterBar.style.opacity = '1';
                                filterBar.style.visibility = 'visible';
                            }, 50);
                        }
                        
                        // Also restore month summary card if it exists and was hidden
                        const monthSummaryCard = document.getElementById('monthSummaryCard');
                        if (monthSummaryCard && (monthSummaryCard.style.opacity === '0' || monthSummaryCard.style.position === 'absolute' || monthSummaryCard.style.left === '-9999px')) {
                            monthSummaryCard.style.position = '';
                            monthSummaryCard.style.left = '';
                            monthSummaryCard.style.display = monthSummaryCard.getAttribute('data-original-display') || '';
                            monthSummaryCard.classList.add('content-appearing');
                            setTimeout(() => {
                                monthSummaryCard.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                monthSummaryCard.style.opacity = '1';
                                monthSummaryCard.style.visibility = 'visible';
                            }, 50);
                        }
                        
                        // Restore any chart containers (if expenses page has charts) - use more robust selector
                        const chartContainers = container.querySelectorAll('.chart-container');
                        chartContainers.forEach((chart, index) => {
                            // Check if chart is hidden
                            if (chart.style.opacity === '0' || chart.style.position === 'absolute' || chart.style.left === '-9999px' || chart.style.visibility === 'hidden') {
                                chart.style.position = '';
                                chart.style.left = '';
                                chart.style.display = '';
                                chart.classList.add('content-appearing');
                                setTimeout(() => {
                                    chart.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    chart.style.opacity = '1';
                                    chart.style.visibility = 'visible';
                                    chart.style.transform = 'translateY(0)';
                                }, 100 + (index * 50));
                            }
                        });
                        
                        // ROOT CAUSE FIX: Restore table card visibility FIRST - ensures table appears with other content
                        if (expenseTableCard) {
                            // ROOT CAUSE FIX: Restore table card immediately so it's ready for data
                            expenseTableCard.style.position = '';
                            expenseTableCard.style.left = '';
                            expenseTableCard.style.display = ''; // ROOT CAUSE FIX: Restore display property
                            expenseTableCard.style.opacity = '1';
                            expenseTableCard.style.visibility = 'visible';
                            expenseTableCard.classList.add('content-appearing');
                            
                            const tableHeader = expenseTableCard.querySelector('.d-flex.justify-content-between.align-items-center.mb-3');
                            if (tableHeader) {
                                // Restore original title from saved attribute
                                const titleElement = tableHeader.querySelector('h5');
                                if (titleElement) {
                                    const originalTitle = titleElement.getAttribute('data-original-title');
                                    if (originalTitle) {
                                        titleElement.innerHTML = originalTitle;
                                        titleElement.removeAttribute('data-original-title');
                                    }
                                    // Remove any skeleton elements
                                    const skeletonHeader = titleElement.querySelector('.skeleton');
                                    if (skeletonHeader) skeletonHeader.remove();
                                }
                                
                                // Ensure badge is visible
                                const badgeElement = tableHeader.querySelector('#expenseCount, .badge');
                                if (badgeElement) {
                                    badgeElement.style.opacity = '1';
                                    badgeElement.style.visibility = 'visible';
                                    badgeElement.style.display = '';
                                }
                                
                                tableHeader.style.opacity = '1';
                                tableHeader.style.visibility = 'visible';
                                tableHeader.classList.add('content-appearing');
                            }
                            
                            // CRITICAL: Restore table thead - restore original HTML content
                            // This must happen BEFORE table data loads to ensure headers are visible
                            const tableThead = expenseTableBody?.closest('table')?.querySelector('thead');
                            if (tableThead) {
                                // Restore original thead HTML from data attribute
                                const originalHTML = tableThead.getAttribute('data-original-html');
                                if (originalHTML) {
                                    tableThead.innerHTML = originalHTML;
                                    tableThead.removeAttribute('data-original-html');
                                }
                                // Make sure it's visible and properly positioned
                                tableThead.style.opacity = '1';
                                tableThead.style.visibility = 'visible';
                                tableThead.style.position = '';
                                tableThead.style.left = '';
                                tableThead.style.display = '';
                                tableThead.classList.add('content-appearing');
                            }
                            
                            // ROOT CAUSE FIX: Remove skeleton table rows - data will be populated by checkAndHideSkeleton polling
                            const skeletonRows = expenseTableBody.querySelectorAll('.skeleton-table-row');
                            skeletonRows.forEach(row => row.remove());
                        }
                        
                        // ROOT CAUSE FIX: Synchronize timing so tiles and table appear together
                        // Restore all hidden content at the SAME time (like reports page)
                        if (container) {
                            // Restore quickStats row and table card TOGETHER at the same time
                            if (quickStats) {
                                quickStats.style.position = '';
                                quickStats.style.left = '';
                                quickStats.classList.remove('skeleton-loading');
                                quickStats.style.marginBottom = '';
                                quickStats.style.paddingBottom = '';
                                quickStats.classList.add('content-appearing');
                            }
                            
                            // Restore table card at the same time as stats
                            if (expenseTableCard) {
                                expenseTableCard.style.position = '';
                                expenseTableCard.style.left = '';
                                expenseTableCard.classList.add('content-appearing');
                            }
                            
                            // Animate BOTH stats tiles and table card appearing TOGETHER
                            setTimeout(() => {
                                // Stats tiles fade in
                                if (quickStats) {
                                    quickStats.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    quickStats.style.opacity = '1';
                                    quickStats.style.visibility = 'visible';
                                    quickStats.style.transform = 'translateY(0)';
                                }
                                
                                // Table card fades in at the SAME time
                                if (expenseTableCard) {
                                    expenseTableCard.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    expenseTableCard.style.opacity = '1';
                                    expenseTableCard.style.visibility = 'visible';
                                    expenseTableCard.style.transform = 'translateY(0)';
                                }
                                
                                // Animate table rows appearing immediately after (staggered)
                                if (expenseTableBody) {
                                    const realRows = expenseTableBody.querySelectorAll('tr:not(.skeleton-table-row)');
                                    realRows.forEach((row, index) => {
                                        row.style.opacity = '0';
                                        row.style.transform = 'translateY(8px)';
                                        setTimeout(() => {
                                            row.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                            row.style.opacity = '1';
                                            row.style.transform = 'translateY(0)';
                                        }, 50 + (index * 20)); // Start quickly after tiles appear
                                    });
                                }
                            }, 50); // Small delay to ensure DOM is ready, then animate together
                            
                            // Restore all other hidden rows
                            const hiddenRows = container.querySelectorAll('.row[style*="opacity: 0"], .row[style*="visibility: hidden"]');
                            hiddenRows.forEach((el, index) => {
                                // Skip skeleton containers and quickStats (already handled)
                                if (el.classList.contains('skeleton-container') || el.id === 'quickStats') return;
                                
                                // Restore position
                                el.style.position = '';
                                el.style.left = '';
                                el.classList.add('content-appearing');
                                
                                setTimeout(() => {
                                    el.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    el.style.opacity = '1';
                                    el.style.visibility = 'visible';
                                    el.style.transform = 'translateY(0)';
                                }, 50 + (index * 30)); // Same timing as tiles
                            });
                        }
                    }, 300);
                }
                return;
            }
            
            // For groups page, hide both stats and group cards skeletons (exactly like expenses page)
            if (skeletonId === 'groupsSkeleton') {
                const statsRow = document.querySelector('.row.mb-4');
                const groupsContainer = document.getElementById('groupsContainer');
                const container = document.querySelector('.main-content .container-fluid');
                
                // Find action buttons row and "Your Groups" heading section
                // Action buttons row: contains Create Group, Join Group, Delete All Groups buttons
                const actionButtonsRow = container ? Array.from(container.querySelectorAll('.d-flex.gap-2.mb-4')).find(el => 
                    el.querySelector('button[onclick*="CreateGroup"]') || 
                    el.querySelector('button[onclick*="openCreateGroupModal"]') ||
                    el.querySelector('#deleteAllGroups')
                ) : null;
                // "Your Groups" heading section: contains heading and action buttons
                const groupsHeadingSection = container ? Array.from(container.querySelectorAll('.d-flex.justify-content-between.align-items-center.mb-3')).find(el =>
                    el.querySelector('h4') && 
                    (el.querySelector('h4').textContent.includes('Your Groups') || el.querySelector('h4').textContent.includes('Groups'))
                ) : null;
                
                // Find and fade out the skeleton container
                const skeleton = document.getElementById('groupsSkeleton');
                if (skeleton) {
                    skeleton.classList.add('fade-out');
                    setTimeout(() => {
                        skeleton.remove();
                        
                        // Restore all hidden content (like expenses/reports page) - restore ALL rows
                        if (container) {
                            // Restore stats row, action buttons, heading, and groups container TOGETHER
                            if (statsRow) {
                                statsRow.style.position = '';
                                statsRow.style.left = '';
                                statsRow.classList.remove('skeleton-loading');
                                statsRow.style.marginBottom = '';
                                statsRow.style.paddingBottom = '';
                                statsRow.classList.add('content-appearing');
                            }
                            
                            if (actionButtonsRow) {
                                actionButtonsRow.style.position = '';
                                actionButtonsRow.style.left = '';
                                actionButtonsRow.classList.add('content-appearing');
                            }
                            
                            if (groupsHeadingSection) {
                                groupsHeadingSection.style.position = '';
                                groupsHeadingSection.style.left = '';
                                groupsHeadingSection.classList.add('content-appearing');
                            }
                            
                            if (groupsContainer) {
                                groupsContainer.style.position = '';
                                groupsContainer.style.left = '';
                                groupsContainer.classList.add('content-appearing');
                            }
                            
                            // Animate ALL elements appearing TOGETHER at the same time
                            setTimeout(() => {
                                // Stats row fade in
                                if (statsRow) {
                                    statsRow.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    statsRow.style.opacity = '1';
                                    statsRow.style.visibility = 'visible';
                                    statsRow.style.transform = 'translateY(0)';
                                }
                                
                                // Action buttons fade in at the SAME time
                                if (actionButtonsRow) {
                                    actionButtonsRow.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    actionButtonsRow.style.opacity = '1';
                                    actionButtonsRow.style.visibility = 'visible';
                                    actionButtonsRow.style.transform = 'translateY(0)';
                                }
                                
                                // Heading section fade in at the SAME time
                                if (groupsHeadingSection) {
                                    groupsHeadingSection.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    groupsHeadingSection.style.opacity = '1';
                                    groupsHeadingSection.style.visibility = 'visible';
                                    groupsHeadingSection.style.transform = 'translateY(0)';
                                }
                                
                                // Groups container fade in at the SAME time
                                if (groupsContainer) {
                                    groupsContainer.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    groupsContainer.style.opacity = '1';
                                    groupsContainer.style.visibility = 'visible';
                                    groupsContainer.style.transform = 'translateY(0)';
                                }
                                
                                // Animate group cards appearing immediately after (staggered)
                                if (groupsContainer) {
                                    const groupCards = groupsContainer.querySelectorAll('.col-md-6, .col-lg-4');
                                    groupCards.forEach((card, index) => {
                                        card.style.opacity = '0';
                                        card.style.transform = 'translateY(10px)';
                                        card.classList.add('group-card-appearing');
                                        setTimeout(() => {
                                            card.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                            card.style.opacity = '1';
                                            card.style.transform = 'translateY(0)';
                                        }, 50 + (index * 30)); // Start quickly after containers appear
                                    });
                                }
                                
                                // Trigger welcome notification after skeleton is fully hidden and content is showing
                                // This ensures notifications appear AFTER skeleton loading completes
                                if (typeof window.showGroupsWelcome === 'function') {
                                    setTimeout(() => {
                                        window.showGroupsWelcome();
                                    }, 500); // Delay after skeleton fade-out completes
                                }
                            }, 50); // Small delay to ensure DOM is ready, then animate together
                            
                            // Restore all other hidden rows
                            const hiddenRows = container.querySelectorAll('.row[style*="opacity: 0"], .row[style*="visibility: hidden"]');
                            hiddenRows.forEach((el, index) => {
                                // Skip skeleton containers and already handled elements
                                if (el.classList.contains('skeleton-container') || 
                                    el.classList.contains('row.mb-4') || 
                                    el.id === 'groupsContainer') return;
                                
                                // Restore position
                                el.style.position = '';
                                el.style.left = '';
                                el.classList.add('content-appearing');
                                
                                setTimeout(() => {
                                    el.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    el.style.opacity = '1';
                                    el.style.visibility = 'visible';
                                    el.style.transform = 'translateY(0)';
                                }, 50 + (index * 30)); // Same timing as main elements
                            });
                        }
                    }, 300);
                }
                return;
            }
            
            // For reports page skeleton
            if (skeletonId === 'reportsSkeleton') {
                const container = document.querySelector('.main-content .container-fluid');
                const expenseTableBody = document.getElementById('expenseTableBody') || container?.querySelector('tbody');
                const expenseTableCard = expenseTableBody ? expenseTableBody.closest('.card') : null;
                // Restore filter bar - use more robust selector
                const filterBar = container?.querySelector('.d-flex.gap-2.mb-4.align-items-center');
                
                // Find and fade out the skeleton container
                const skeleton = document.getElementById('reportsSkeleton');
                if (skeleton) {
                    skeleton.classList.add('fade-out');
                    setTimeout(() => {
                        skeleton.remove();
                        
                        // ROOT CAUSE FIX: Synchronize timing so tiles and table appear together
                        // Find stat cards row (first row with stats)
                        const statsRow = container.querySelector('.row:has(.stat-card)') || container.querySelector('.row.mb-4');
                        
                        // Restore stat cards and table card TOGETHER at the same time
                        if (statsRow) {
                            statsRow.style.position = '';
                            statsRow.style.left = '';
                            statsRow.classList.add('content-appearing');
                        }
                        
                        if (expenseTableCard) {
                            expenseTableCard.style.position = '';
                            expenseTableCard.style.left = '';
                            expenseTableCard.classList.add('content-appearing');
                        }
                        
                        // Restore chart containers and canvases - use more robust selector
                        const chartContainers = container.querySelectorAll('.chart-container');
                        chartContainers.forEach((chart) => {
                            // Check if chart is hidden
                            if (chart.style.opacity === '0' || chart.style.position === 'absolute' || chart.style.left === '-9999px' || chart.style.visibility === 'hidden') {
                                chart.style.position = '';
                                chart.style.left = '';
                                chart.style.display = '';
                                chart.classList.add('content-appearing');
                                setTimeout(() => {
                                    chart.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    chart.style.opacity = '1';
                                    chart.style.visibility = 'visible';
                                    chart.style.transform = 'translateY(0)';
                                }, 50);
                            }
                        });
                        
                        // Restore chart canvases
                        const categoryChart = document.getElementById('categoryChart');
                        const trendChart = document.getElementById('trendChart');
                        if (categoryChart) {
                            categoryChart.style.opacity = '1';
                            categoryChart.style.visibility = 'visible';
                        }
                        if (trendChart) {
                            trendChart.style.opacity = '1';
                            trendChart.style.visibility = 'visible';
                        }
                        
                        // Restore filter bar if it was hidden
                        if (filterBar && (filterBar.style.opacity === '0' || filterBar.style.position === 'absolute' || filterBar.style.left === '-9999px')) {
                            filterBar.style.position = '';
                            filterBar.style.left = '';
                            filterBar.style.display = '';
                            filterBar.classList.add('content-appearing');
                            setTimeout(() => {
                                filterBar.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                filterBar.style.opacity = '1';
                                filterBar.style.visibility = 'visible';
                            }, 50);
                        }
                        
                        // Restore filter buttons - use more robust selectors
                        const tableFilterButtons = expenseTableCard ? expenseTableCard.querySelector('.btn-group') : null;
                        const chartFilterButtons = container.querySelectorAll('.chart-container .btn-group');
                        
                        // Remove skeleton filter buttons
                        container.querySelectorAll('.mb-3 .skeleton-button').forEach(skeleton => {
                            if (skeleton.closest('.mb-3')) {
                                skeleton.closest('.mb-3').remove();
                            }
                        });
                        
                        if (tableFilterButtons && (tableFilterButtons.style.opacity === '0' || tableFilterButtons.style.position === 'absolute' || tableFilterButtons.style.left === '-9999px')) {
                            tableFilterButtons.style.position = '';
                            tableFilterButtons.style.left = '';
                            tableFilterButtons.style.display = '';
                            tableFilterButtons.classList.add('content-appearing');
                            setTimeout(() => {
                                tableFilterButtons.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                tableFilterButtons.style.opacity = '1';
                                tableFilterButtons.style.visibility = 'visible';
                            }, 50);
                        }
                        
                        chartFilterButtons.forEach((btnGroup) => {
                            if (btnGroup && (btnGroup.style.opacity === '0' || btnGroup.style.position === 'absolute' || btnGroup.style.left === '-9999px')) {
                                btnGroup.style.position = '';
                                btnGroup.style.left = '';
                                btnGroup.style.display = '';
                                btnGroup.classList.add('content-appearing');
                                setTimeout(() => {
                                    btnGroup.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                    btnGroup.style.opacity = '1';
                                    btnGroup.style.visibility = 'visible';
                                }, 50);
                            }
                        });
                        
                        // ROOT CAUSE FIX: Restore table card visibility FIRST - ensures table appears with other content
                        if (expenseTableCard && expenseTableBody) {
                            // ROOT CAUSE FIX: Restore table card immediately so it's ready for data (EXACTLY like expenses page)
                            expenseTableCard.style.position = '';
                            expenseTableCard.style.left = '';
                            expenseTableCard.style.display = ''; // ROOT CAUSE FIX: Restore display property
                            expenseTableCard.style.opacity = '1';
                            expenseTableCard.style.visibility = 'visible';
                            expenseTableCard.classList.add('content-appearing');
                            
                            const tableHeader = expenseTableCard.querySelector('.d-flex.justify-content-between.align-items-center');
                            const tableThead = expenseTableBody.closest('table')?.querySelector('thead');
                            
                            if (tableHeader) {
                                // Restore original title from saved attribute
                                const titleElement = tableHeader.querySelector('h5');
                                if (titleElement) {
                                    const originalTitle = titleElement.getAttribute('data-original-title');
                                    if (originalTitle) {
                                        titleElement.innerHTML = originalTitle;
                                        titleElement.removeAttribute('data-original-title');
                                    }
                                    // Remove any skeleton elements
                                    const skeletonHeader = titleElement.querySelector('.skeleton');
                                    if (skeletonHeader) skeletonHeader.remove();
                                }
                                
                                // Ensure badge is visible
                                const badgeElement = tableHeader.querySelector('#expenseCount, .badge');
                                if (badgeElement) {
                                    badgeElement.style.opacity = '1';
                                    badgeElement.style.visibility = 'visible';
                                    badgeElement.style.display = '';
                                }
                                
                                tableHeader.style.opacity = '1';
                                tableHeader.style.visibility = 'visible';
                                tableHeader.classList.add('content-appearing');
                            }
                            
                            // CRITICAL: Restore table thead BEFORE removing skeleton rows
                            if (tableThead) {
                                // Restore original thead HTML from data attribute
                                const originalHTML = tableThead.getAttribute('data-original-html');
                                if (originalHTML) {
                                    tableThead.innerHTML = originalHTML;
                                    tableThead.removeAttribute('data-original-html');
                                }
                                // Make sure it's visible and properly positioned
                                tableThead.style.opacity = '1';
                                tableThead.style.visibility = 'visible';
                                tableThead.style.position = '';
                                tableThead.style.left = '';
                                tableThead.style.display = '';
                                tableThead.classList.add('content-appearing');
                            }
                            
                            // ROOT CAUSE FIX: Remove skeleton table rows - data will be populated by checkAndHideSkeleton polling
                            const skeletonRows = expenseTableBody.querySelectorAll('.skeleton-table-row');
                            skeletonRows.forEach(row => row.remove());
                        }
                        
                        // Animate BOTH stat tiles and table TOGETHER at the same time
                        setTimeout(() => {
                            // Stat cards fade in
                            if (statsRow) {
                                statsRow.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                statsRow.style.opacity = '1';
                                statsRow.style.visibility = 'visible';
                                statsRow.style.transform = 'translateY(0)';
                            }
                            
                                // Table card fades in at the SAME time
                                if (expenseTableCard) {
                                    expenseTableCard.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    expenseTableCard.style.opacity = '1';
                                    expenseTableCard.style.visibility = 'visible';
                                    expenseTableCard.style.transform = 'translateY(0)';
                                    
                                    // Ensure thead is also visible with animation
                                    const tableThead = expenseTableCard.querySelector('thead');
                                    if (tableThead) {
                                        // Restore original thead HTML if not already restored
                                        const originalHTML = tableThead.getAttribute('data-original-html');
                                        if (originalHTML) {
                                            tableThead.innerHTML = originalHTML;
                                            tableThead.removeAttribute('data-original-html');
                                        }
                                        tableThead.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                        tableThead.style.opacity = '1';
                                        tableThead.style.visibility = 'visible';
                                        tableThead.style.position = '';
                                        tableThead.style.left = '';
                                        tableThead.style.display = '';
                                    }
                                }
                            
                            // Charts fade in at the same time
                            chartContainers.forEach((chart) => {
                                chart.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                chart.style.opacity = '1';
                                chart.style.visibility = 'visible';
                                chart.style.transform = 'translateY(0)';
                            });
                            
                            // Filter buttons fade in
                            if (tableFilterButtons) {
                                tableFilterButtons.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                tableFilterButtons.style.opacity = '1';
                                tableFilterButtons.style.visibility = 'visible';
                            }
                            
                            chartFilterButtons.forEach((btnGroup) => {
                                btnGroup.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s';
                                btnGroup.style.opacity = '1';
                                btnGroup.style.visibility = 'visible';
                            });
                            
                            // Animate table rows appearing immediately after (staggered)
                            if (expenseTableBody) {
                                const realRows = expenseTableBody.querySelectorAll('tr:not(.skeleton-table-row)');
                                realRows.forEach((row, index) => {
                                    row.style.opacity = '0';
                                    row.style.transform = 'translateY(8px)';
                                    setTimeout(() => {
                                        row.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        row.style.opacity = '1';
                                        row.style.transform = 'translateY(0)';
                                    }, 50 + (index * 20)); // Start quickly after tiles appear
                                });
                            }
                            
                            // Animate stat cards individually for smooth effect
                            const statCards = container.querySelectorAll('.stat-card');
                            statCards.forEach((card, index) => {
                                if (!card.classList.contains('content-appearing') && card.style.opacity !== '0') {
                                    card.style.opacity = '0';
                                    card.style.transform = 'translateY(10px)';
                                    card.classList.add('content-appearing');
                                    setTimeout(() => {
                                        card.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                        card.style.opacity = '1';
                                        card.style.transform = 'translateY(0)';
                                    }, index * 30); // Stagger within the row
                                }
                            });
                        }, 50); // Small delay to ensure DOM is ready, then animate together
                        
                        // Restore all other hidden rows
                        const hiddenRows = container.querySelectorAll('.row[style*="opacity: 0"], .row[style*="visibility: hidden"]');
                        hiddenRows.forEach((el, index) => {
                            if (el.closest('.skeleton-container') || el === statsRow) return;
                            
                            el.style.position = '';
                            el.style.left = '';
                            el.classList.add('content-appearing');
                            
                            setTimeout(() => {
                                el.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                el.style.opacity = '1';
                                el.style.visibility = 'visible';
                                el.style.transform = 'translateY(0)';
                            }, 50 + (index * 30)); // Same timing as tiles
                        });
                    }, 300);
                }
                return;
            }
            
            // For dashboard skeleton (exactly like expenses/reports pages)
            if (skeletonId === 'dashboardSkeleton') {
                const container = document.querySelector('.main-content .container-fluid');
                
                // Find and fade out the skeleton container
                const skeleton = document.getElementById('dashboardSkeleton');
                if (skeleton) {
                    skeleton.classList.add('fade-out');
                    setTimeout(() => {
                        skeleton.remove();
                        
                        // Restore all hidden content (like expenses/reports pages) - restore ALL rows and sections
                        if (container) {
                            // Restore all hidden rows
                            const hiddenRows = container.querySelectorAll('.row[style*="opacity: 0"], .row[style*="visibility: hidden"]');
                            hiddenRows.forEach((el, index) => {
                                // Skip skeleton containers
                                if (el.classList.contains('skeleton-container')) return;
                                
                                // Restore position
                                el.style.position = '';
                                el.style.left = '';
                                el.classList.add('content-appearing');
                                el.style.transform = 'translateY(10px)';
                                
                                setTimeout(() => {
                                    el.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    el.style.opacity = '1';
                                    el.style.visibility = 'visible';
                                    el.style.transform = 'translateY(0)';
                                }, index * 50); // Stagger animation
                            });
                            
                            // Restore Quick Actions section
                            const quickActions = container.querySelector('.quick-actions');
                            if (quickActions) {
                                quickActions.style.position = '';
                                quickActions.style.left = '';
                                quickActions.classList.add('content-appearing');
                                setTimeout(() => {
                                    quickActions.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    quickActions.style.opacity = '1';
                                    quickActions.style.visibility = 'visible';
                                    quickActions.style.transform = 'translateY(0)';
                                }, 150);
                            }
                            
                            // Restore Quick Actions heading
                            const quickActionsHeading = container.querySelector('h4');
                            if (quickActionsHeading && quickActionsHeading.textContent.includes('Quick Actions')) {
                                quickActionsHeading.style.position = '';
                                quickActionsHeading.style.left = '';
                                quickActionsHeading.classList.add('content-appearing');
                                setTimeout(() => {
                                    quickActionsHeading.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    quickActionsHeading.style.opacity = '1';
                                    quickActionsHeading.style.visibility = 'visible';
                                    quickActionsHeading.style.transform = 'translateY(0)';
                                }, 100);
                            }
                            
                            // Animate stat cards, charts, and action cards with staggered effect
                            const statCards = container.querySelectorAll('.stats-card, .chart-container, .action-card');
                            statCards.forEach((card, index) => {
                                if (!card.classList.contains('content-appearing') && card.style.opacity !== '0') {
                                    card.style.opacity = '0';
                                    card.style.transform = 'translateY(10px)';
                                    card.classList.add('content-appearing');
                                    setTimeout(() => {
                                        card.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                        card.style.opacity = '1';
                                        card.style.transform = 'translateY(0)';
                                    }, 200 + (index * 60));
                                }
                            });
                            
                            // Trigger welcome notification after skeleton is fully hidden and content is showing
                            // This ensures notifications appear AFTER skeleton loading completes
                            if (typeof window.showDashboardWelcome === 'function') {
                                setTimeout(() => {
                                    window.showDashboardWelcome();
                                }, 500); // Delay after skeleton fade-out completes
                            }
                            
                            // Also trigger error notification if it exists
                            if (typeof window.showDashboardError === 'function') {
                                setTimeout(() => {
                                    window.showDashboardError();
                                }, 600); // Slightly after welcome notification
                            }
                        }
                    }, 300);
                }
                return;
            }
            
            // For other skeletons (fallback), find by ID or class
            let skeleton = document.getElementById(skeletonId);
            if (!skeleton) {
                skeleton = document.querySelector(`.skeleton-container[id="${skeletonId}"]`);
            }
            if (!skeleton) {
                skeleton = document.querySelector('.skeleton-container');
            }
            
            if (skeleton) {
                skeleton.classList.add('fade-out');
                setTimeout(() => {
                    skeleton.remove();
                    
                    // Show existing content smoothly with animations
                    // Restore position first, then fade in
                    const hiddenContent = document.querySelectorAll('[style*="opacity: 0"], [style*="visibility: hidden"]');
                    hiddenContent.forEach((el, index) => {
                        if (el.closest('.skeleton-container')) return; // Skip skeleton containers
                        
                        // Restore position
                        el.style.position = '';
                        el.style.left = '';
                        
                        // Add animation class for smooth appearance
                        el.classList.add('content-appearing');
                        el.style.transform = 'translateY(10px)';
                        
                        setTimeout(() => {
                            el.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                            el.style.opacity = '1';
                            el.style.visibility = 'visible';
                            el.style.transform = 'translateY(0)';
                        }, index * 50); // Stagger animation
                    });
                    
                    // Also animate any stat cards, charts, or other content
                    const container = skeleton.closest('.container-fluid') || skeleton.closest('.main-content');
                    if (container) {
                        const statCards = container.querySelectorAll('.stat-card, .card, .chart-container');
                        statCards.forEach((card, index) => {
                            if (!card.classList.contains('content-appearing') && card.style.opacity !== '0') {
                                card.style.opacity = '0';
                                card.style.transform = 'translateY(10px)';
                                card.classList.add('content-appearing');
                                setTimeout(() => {
                                    card.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                                    card.style.opacity = '1';
                                    card.style.transform = 'translateY(0)';
                                }, index * 60);
                            }
                        });
                    }
                }, 300);
            }
        });
    };
    
    // Hide all skeletons
    window.hideAllSkeletons = function() {
        const skeletons = document.querySelectorAll('.skeleton-container');
        skeletons.forEach(skeleton => {
            skeleton.classList.add('fade-out');
            setTimeout(() => skeleton.remove(), 300);
        });
        
        // Show all hidden content
        const hiddenContent = document.querySelectorAll('[style*="opacity: 0"], [style*="visibility: hidden"]');
        hiddenContent.forEach(el => {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
        });
    };
    
    // Show skeleton settings (for settings.html)
    window.showSkeletonSettings = function() {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return;

        // Hide existing content
        const existingCards = container.querySelectorAll('.card:not(.skeleton-container)');
        existingCards.forEach(el => {
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
        });

        const skeletonHTML = `
            <div class="skeleton-container" id="settingsSkeleton" style="width:100%;">
                <!-- Profile Card Skeleton -->
                <div style="background: var(--card-bg, #ffffff); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 2rem; position: relative; overflow: hidden;">
                    <div style="text-align:center; margin-bottom: 1.5rem;">
                        <div class="skeleton skeleton-circle" style="width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 1rem;"></div>
                        <div class="skeleton skeleton-text" style="width: 140px; height: 2.2rem; border-radius: 25px; margin: 0 auto 0.5rem;"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div>
                            <div class="skeleton skeleton-text" style="width: 80px; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                        <div>
                            <div class="skeleton skeleton-text" style="width: 50px; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                        <div>
                            <div class="skeleton skeleton-text" style="width: 110px; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                        <div>
                            <div class="skeleton skeleton-text" style="width: 70px; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem; text-align: right;">
                        <div class="skeleton skeleton-button" style="width: 150px; height: 2.75rem; border-radius: 25px; display: inline-block;"></div>
                    </div>
                </div>
                <!-- Preferences Card Skeleton -->
                <div style="background: var(--card-bg, #ffffff); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 2rem; position: relative; overflow: hidden;">
                    <div class="skeleton skeleton-title" style="width: 200px; height: 1.4rem; margin-bottom: 1.5rem;"></div>
                    <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div class="skeleton skeleton-text" style="width: 120px; height: 1rem; margin-bottom: 0.4rem;"></div>
                                <div class="skeleton skeleton-text" style="width: 200px; height: 0.75rem;"></div>
                            </div>
                            <div class="skeleton" style="width: 50px; height: 26px; border-radius: 13px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div class="skeleton skeleton-text" style="width: 100px; height: 1rem; margin-bottom: 0.4rem;"></div>
                                <div class="skeleton skeleton-text" style="width: 180px; height: 0.75rem;"></div>
                            </div>
                            <div class="skeleton" style="width: 50px; height: 26px; border-radius: 13px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div class="skeleton skeleton-text" style="width: 130px; height: 1rem; margin-bottom: 0.4rem;"></div>
                                <div class="skeleton skeleton-text" style="width: 160px; height: 0.75rem;"></div>
                            </div>
                            <div class="skeleton" style="width: 120px; height: 2.5rem; border-radius: 12px;"></div>
                        </div>
                    </div>
                </div>
                <!-- Security Card Skeleton -->
                <div style="background: var(--card-bg, #ffffff); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 2rem; position: relative; overflow: hidden;">
                    <div class="skeleton skeleton-title" style="width: 160px; height: 1.4rem; margin-bottom: 1.5rem;"></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div>
                            <div class="skeleton skeleton-text" style="width: 80%; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                        <div>
                            <div class="skeleton skeleton-text" style="width: 80%; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                        <div>
                            <div class="skeleton skeleton-text" style="width: 80%; height: 0.875rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton" style="height: 2.75rem; border-radius: 15px;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem; text-align: right;">
                        <div class="skeleton skeleton-button" style="width: 180px; height: 2.75rem; border-radius: 25px; display: inline-block;"></div>
                    </div>
                </div>
            </div>
        `;

        if (!container.querySelector('#settingsSkeleton')) {
            container.insertAdjacentHTML('afterbegin', skeletonHTML);
        }
    };

    // Verify all functions are properly exported
    console.log('✅ Skeleton loader functions loaded:', {
        showSkeletonDashboard: typeof window.showSkeletonDashboard,
        showSkeletonExpenses: typeof window.showSkeletonExpenses,
        showSkeletonGroups: typeof window.showSkeletonGroups,
        showSkeletonReports: typeof window.showSkeletonReports,
        showSkeletonSettings: typeof window.showSkeletonSettings,
        hideSkeleton: typeof window.hideSkeleton
    });
})();

