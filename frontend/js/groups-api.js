// Groups API Integration
// This file handles all backend API calls for groups functionality

// ROOT CAUSE FIX: Get API_BASE dynamically from window to ensure it's available after config.js loads
// This function is called each time we need API_BASE to ensure we always get the latest value
function getAPIBase() {
    return (typeof window !== 'undefined' && window.API_BASE) || 'https://api.splitwise.space/api';
}

// For backward compatibility, also set const (but prefer using getAPIBase() in functions)
const API_BASE = getAPIBase();

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Helper function to make authenticated API requests
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    console.log('🔵 API Request:', {
        endpoint,
        method: options.method || 'GET',
        hasToken: !!token
    });
    
    if (!token) {
        console.error('❌ No auth token found!');
        throw new Error('Not authenticated. Please login again.');
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    try {
        const apiBase = getAPIBase();
        console.log('🔵 Using API_BASE:', apiBase, 'for endpoint:', endpoint);
        const response = await fetch(`${apiBase}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
        
        console.log('🔵 API Response Status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('🔵 API Response Data:', data);
        
        if (!response.ok) {
            // ROOT CAUSE FIX: Check both 'error' and 'message' fields for error messages
            const errorMsg = data.error || data.message || `API request failed: ${response.status} ${response.statusText}`;
            console.error('❌ API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        
        return data;
    } catch (error) {
        if (error.message.includes('fetch')) {
            console.error('❌ Network Error:', error);
            throw new Error('Network error. Please check if backend is running.');
        }
        throw error;
    }
}

// ==================== GROUP MANAGEMENT ====================

// Create a new group (backend + localStorage)
async function createGroupWithBackend(groupName) {
    try {
        // Create group in backend
        const result = await apiRequest('/groups', {
            method: 'POST',
            body: JSON.stringify({
                name: groupName
            })
        });
        
        if (result.success) {
            // Group is stored in backend - no need for localStorage
            return { success: true, group: { id: result.data.id, name: groupName } };
        }
        
        return { success: false, message: 'Failed to create group' };
    } catch (error) {
        console.error('Create group error:', error);
        return { success: false, message: error.message };
    }
}

// Join a group by invite code (backend + localStorage)
async function joinGroupWithBackend(inviteCode) {
    try {
        // Join group in backend
        const result = await apiRequest('/groups/join', {
            method: 'POST',
            body: JSON.stringify({
                code: inviteCode
            })
        });
        
        if (result.success) {
            // Group joined successfully - backend stores this
            // Group will be fetched from backend on next sync
            return { success: true, groupName: result.data.groupName };
        }
        
        return { success: false, message: 'Failed to join group' };
    } catch (error) {
        console.error('Join group error:', error);
        // Return the actual error message from the API
        return { success: false, message: error.message, isAlreadyMember: error.message?.includes('Already a member') || error.message?.includes('already') };
    }
}

// Send email invitation
async function sendEmailInvitation(groupId, email, message = '') {
    try {
        const result = await apiRequest('/groups/send-invite', {
            method: 'POST',
            body: JSON.stringify({
                groupId: groupId,
                email: email,
                message: message
            })
        });
        
        if (result.success) {
            return { 
                success: true, 
                groupName: result.data.groupName,
                inviteCode: result.data.inviteCode
            };
        }
        
        return { success: false, message: 'Failed to send invitation' };
    } catch (error) {
        console.error('Send invitation error:', error);
        return { success: false, message: error.message };
    }
}

// Sync groups with backend
async function syncGroupsWithBackend() {
    try {
        const result = await apiRequest('/groups');
        
        if (result.success && result.data.items) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Fetch details for each group including members
            const detailedGroups = await Promise.all(
                result.data.items.map(async (g) => {
                    try {
                        const groupDetails = await apiRequest(`/groups/${g._id}`);
                        if (groupDetails.success && groupDetails.data) {
                            const gData = groupDetails.data;
                            return {
                                id: gData._id,
                                name: gData.name,
                                members: gData.membersDetails?.map(m => m.name) || [],
                                owner: gData.owner_id?.name || 'Unknown',
                                balance: 0,
                                expenses: 0,
                                code: gData.invite_code,
                                joinedDate: gData.members?.find(m => 
                                    (m.user_id?._id || m.user_id)?.toString() === user.id?.toString()
                                )?.joined_at || new Date().toISOString(),
                                lastInteractedAt: new Date().toISOString()
                            };
                        }
                    } catch (err) {
                        console.warn(`Failed to get details for group ${g._id}:`, err);
                    }
                    
                    // Fallback
                    return {
                        id: g._id,
                        name: g.name,
                        members: [],
                        owner: g.owner_id?.name || 'Unknown',
                        balance: 0,
                        expenses: 0,
                        code: g.invite_code,
                        lastInteractedAt: new Date().toISOString()
                    };
                })
            );
            
            // Sort by lastInteractedAt (newest first)
            detailedGroups.sort((a, b) => {
                const timeA = a.lastInteractedAt ? new Date(a.lastInteractedAt).getTime() : 0;
                const timeB = b.lastInteractedAt ? new Date(b.lastInteractedAt).getTime() : 0;
                return timeB - timeA;
            });
            
            // Return groups from backend - no longer storing in localStorage
            return { success: true, groups: detailedGroups };
        }
        
        return { success: false, message: 'Failed to sync groups' };
    } catch (error) {
        console.error('Sync groups error:', error);
        return { success: false, message: error.message };
    }
}

// Leave a group
async function leaveGroupWithBackend(groupId) {
    try {
        const result = await apiRequest(`/groups/${groupId}/leave`, {
            method: 'POST'
        });
        
        if (result.success) {
            // User left group - backend tracks this with member status='left'
            // Previous groups are fetched from backend API
            return { success: true };
        }
        
        return { success: false, message: result.message || 'Failed to leave group' };
    } catch (error) {
        console.error('Leave group error:', error);
        return { success: false, message: error.message };
    }
}

// Remove a member from group (owner only)
async function removeMemberFromGroup(groupId, memberId, memberName) {
    try {
        const result = await apiRequest(`/groups/${groupId}/remove-member`, {
            method: 'POST',
            body: JSON.stringify({ memberId })
        });
        
        if (result.success) {
            console.log(`✅ Member ${memberName} removed from group`);
            return { success: true, data: result.data };
        }
        
        return { success: false, message: result.message || 'Failed to remove member' };
    } catch (error) {
        console.error('Remove member error:', error);
        return { success: false, message: error.message };
    }
}

// Delete a group (owner only) or permanently delete from previous groups
async function deleteGroupWithBackend(groupId, permanent = false) {
    try {
        const url = permanent ? `/groups/${groupId}?permanent=true` : `/groups/${groupId}`;
        const result = await apiRequest(url, {
            method: 'DELETE'
        });
        
        if (result.success) {
            // Group deleted in backend - no need for localStorage
            return { success: true, permanent: permanent };
        }
        
        return { success: false, message: result.message || 'Failed to delete group' };
    } catch (error) {
        console.error('Delete group error:', error);
        return { success: false, message: error.message };
    }
}

// Get group details
async function getGroupDetails(groupId) {
    try {
        const result = await apiRequest(`/groups/${groupId}`);
        
        if (result.success) {
            return { success: true, group: result.data };
        }
        
        return { success: false, message: 'Failed to get group details' };
    } catch (error) {
        console.error('Get group details error:', error);
        return { success: false, message: error.message };
    }
}

// Get group expenses
async function getGroupExpenses(groupId) {
    try {
        const result = await apiRequest(`/groups/${groupId}/expenses`);
        
        console.log('🔍 Full getGroupExpenses result:', result);
        console.log('🔍 result.data:', result.data);
        
        if (result.success) {
            // Handle different response structures - check for expenses, items, or direct array
            let expenses = null;
            
            // Check if result.data is directly an array
            if (Array.isArray(result.data)) {
                expenses = result.data;
            }
            // Check for expenses key
            else if (result.data?.expenses && Array.isArray(result.data.expenses)) {
                expenses = result.data.expenses;
            }
            // Check for items key (alternative structure)
            else if (result.data?.items && Array.isArray(result.data.items)) {
                expenses = result.data.items;
            }
            // Check if result.data itself contains an expenses property
            else if (result.data && typeof result.data === 'object') {
                // Try to find any array property
                const keys = Object.keys(result.data);
                for (const key of keys) {
                    if (Array.isArray(result.data[key])) {
                        expenses = result.data[key];
                        break;
                    }
                }
            }
            
            console.log('🔍 Found expenses:', expenses);
            console.log('🔍 Expenses count:', expenses ? expenses.length : 0);
            
            return { 
                success: true, 
                expenses: Array.isArray(expenses) ? expenses : [] 
            };
        }
        
        return { success: false, message: 'Failed to get expenses' };
    } catch (error) {
        console.error('Get group expenses error:', error);
        return { success: false, message: error.message };
    }
}

// Add group expense
async function addGroupExpense(groupId, expenseData) {
    try {
        const result = await apiRequest(`/groups/${groupId}/expenses`, {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
        
        if (result.success) {
            console.log('✅ Expense added successfully');
            return { success: true, expense: result.data };
        }
        
        return { success: false, message: result.message || 'Failed to add expense' };
    } catch (error) {
        console.error('Add expense error:', error);
        return { success: false, message: error.message };
    }
}

// Update group expense
async function updateGroupExpense(groupId, expenseId, expenseData) {
    try {
        const result = await apiRequest(`/groups/${groupId}/expenses/${expenseId}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
        
        if (result.success) {
            console.log('✅ Expense updated successfully');
            return { success: true };
        }
        
        return { success: false, message: result.message || 'Failed to update expense' };
    } catch (error) {
        console.error('Update expense error:', error);
        return { success: false, message: error.message };
    }
}

// Delete group expense
async function deleteGroupExpense(groupId, expenseId) {
    try {
        const result = await apiRequest(`/groups/${groupId}/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            console.log('✅ Expense deleted successfully');
            return { success: true };
        }
        
        return { success: false, message: result.message || 'Failed to delete expense' };
    } catch (error) {
        console.error('Delete expense error:', error);
        return { success: false, message: error.message };
    }
}

// Mark expense as paid
async function markExpenseAsPaid(groupId, expenseId, memberName) {
    try {
        const result = await apiRequest(`/groups/${groupId}/expenses/${expenseId}/mark-paid`, {
            method: 'POST',
            body: JSON.stringify({ memberName })
        });
        
        if (result.success) {
            console.log(`✅ Expense marked as paid for ${memberName}`);
            return { success: true };
        }
        
        return { success: false, message: result.message || 'Failed to mark as paid' };
    } catch (error) {
        console.error('Mark paid error:', error);
        return { success: false, message: error.message };
    }
}

// Get group balances
async function getGroupBalances(groupId) {
    try {
        const result = await apiRequest(`/groups/${groupId}/balances`);
        
        if (result.success) {
            return { success: true, balances: result.data.balances };
        }
        
        return { success: false, message: 'Failed to get balances' };
    } catch (error) {
        console.error('Get balances error:', error);
        return { success: false, message: error.message };
    }
}

// Get previous groups (left/deleted) from backend
async function getPreviousGroupsFromBackend() {
    try {
        const result = await apiRequest('/groups/previous');
        
        if (result.success && result.data && result.data.items) {
            return { success: true, groups: result.data.items };
        }
        
        return { success: false, message: 'Failed to fetch previous groups', groups: [] };
    } catch (error) {
        console.error('Get previous groups error:', error);
        return { success: false, message: error.message, groups: [] };
    }
}

// Export functions
window.GroupsAPI = {
    createGroupWithBackend,
    joinGroupWithBackend,
    sendEmailInvitation,
    syncGroupsWithBackend,
    leaveGroupWithBackend,
    removeMemberFromGroup,
    deleteGroupWithBackend,
    getGroupDetails,
    getGroupExpenses,
    addGroupExpense,
    updateGroupExpense,
    deleteGroupExpense,
    markExpenseAsPaid,
    getGroupBalances,
    getPreviousGroupsFromBackend
};

