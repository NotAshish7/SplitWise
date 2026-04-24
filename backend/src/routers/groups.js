import { Router } from 'express';
import { z } from 'zod';
import Group from '../models/Group.js';
import GroupExpense from '../models/GroupExpense.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';
import { sendEmail } from '../utils/mailer.js';
import { createNotificationsForUsers } from './notifications.js';
import { broadcastToUser, broadcastToUsers } from '../utils/sseEmitter.js';

export const groupsRouter = Router();

// All routes require authentication
groupsRouter.use(requireAuth);

// ==================== CREATE GROUP ====================
const createSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  description: z.string().optional()
});

groupsRouter.post('/', async (req, res) => {
  try {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase();

    const group = await Group.create({
      name: parse.data.name,
      description: parse.data.description || null,
      owner_id: req.user.id,
      invite_code: inviteCode,
      members: [{
        user_id: req.user.id,
        status: 'active',
        joined_at: new Date()
      }]
    });

    broadcastToUser(req.user.id, 'group:created', { id: group._id, name: group.name });
    return res.json(createStandardResponse(true, {
      id: group._id,
      name: group.name,
      inviteCode: group.invite_code
    }));

  } catch (error) {
    console.error('Create group error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== GET USER'S GROUPS ====================
groupsRouter.get('/', async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).populate('owner_id', 'name email').lean();

    // Add member count to each group
    const groupsWithCount = groups.map(g => ({
      ...g,
      memberCount: g.members.filter(m => m.status === 'active').length
    }));

    return res.json(createStandardResponse(true, { items: groupsWithCount }));

  } catch (error) {
    console.error('Get groups error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== GET USER'S PREVIOUS GROUPS (LEFT/DELETED) ====================
// IMPORTANT: This route MUST come before /:id route, otherwise "previous" will be treated as an ID
groupsRouter.get('/previous', async (req, res) => {
  try {
    console.log('🔍 Fetching previous groups for user:', req.user.id);
    
    // ROOT CAUSE FIX: Get groups where user was a member but status is 'left' OR 'removed'
    const groups = await Group.find({
      'members.user_id': req.user.id,
      'members.status': { $in: ['left', 'removed'] }
    }).populate('owner_id', 'name email').lean();

    console.log('🔍 Found', groups.length, 'groups where user left or was removed');

    // For each group, get the member's left_at/removed_at date and expenses
    const previousGroups = await Promise.all(groups.map(async (g) => {
      try {
        // ROOT CAUSE FIX: Find member with either 'left' or 'removed' status
        const userMember = g.members.find(m => {
          const userId = m.user_id?.toString() || m.user_id;
          const reqUserId = req.user.id?.toString() || req.user.id;
          return userId === reqUserId && (m.status === 'left' || m.status === 'removed');
        });

        if (!userMember) {
          console.log('⚠️ User member not found for group:', g._id);
          return null;
        }
        
        // ROOT CAUSE FIX: Use removed_at if status is 'removed', otherwise use left_at
        const exitDate = userMember.status === 'removed' ? userMember.removed_at : userMember.left_at;
        const exitReason = userMember.status === 'removed' ? 'Removed from the group' : 'Left group';

        // Check if group was deleted (all members left at same time)
        const allMembersLeft = g.members.filter(m => m.status === 'left');
        const leftTimes = allMembersLeft
          .filter(m => m.left_at)
          .map(m => {
            try {
              return new Date(m.left_at).getTime();
            } catch (e) {
              console.warn('Invalid left_at date:', m.left_at);
              return null;
            }
          })
          .filter(time => time !== null);
        const uniqueLeftTimes = new Set(leftTimes);
        const isDeletedGroup = allMembersLeft.length === g.members.length && 
                              allMembersLeft.length > 0 &&
                              uniqueLeftTimes.size === 1;

        // ROOT CAUSE FIX: Get expenses: for deleted groups, show ALL expenses. For left groups, show expenses while user was a member.
        // Fix: Use both 'date' and 'created_at' fields to filter expenses
        let expenses = [];
        try {
          // Base query: expenses for this group
          let expenseQuery = {
            group_id: g._id
          };
          
          // ROOT CAUSE FIX: Filter expenses by membership period (joined_at to exitDate - removed_at or left_at)
          // Only add date filters for left/removed groups (not deleted groups - deleted groups show all)
          if (!isDeletedGroup) {
            const dateConditions = [];
            
            // Filter by joined date - only show expenses after user joined
            if (userMember.joined_at) {
              try {
                const joinedAtDate = new Date(userMember.joined_at);
                if (!isNaN(joinedAtDate.getTime())) {
                  // Expense date should be >= joined date (check both date and created_at fields)
                  dateConditions.push({
                    $or: [
                      { date: { $gte: joinedAtDate } },
                      { created_at: { $gte: joinedAtDate } },
                      // Include expenses without dates (legacy data)
                      { date: { $exists: false }, created_at: { $exists: false } }
                    ]
                  });
                }
              } catch (e) {
                console.warn('Invalid joined_at date for expense query:', userMember.joined_at);
              }
            }
            
            // ROOT CAUSE FIX: Filter by exit date (removed_at if removed, left_at if left) - only show expenses before user was removed/left
            if (exitDate) {
              try {
                const exitAtDate = new Date(exitDate);
                if (!isNaN(exitAtDate.getTime())) {
                  // Expense date should be <= exit date (check both date and created_at fields)
                  dateConditions.push({
                    $or: [
                      { date: { $lte: exitAtDate } },
                      { created_at: { $lte: exitAtDate } },
                      // Include expenses without dates (legacy data)
                      { date: { $exists: false }, created_at: { $exists: false } }
                    ]
                  });
                }
              } catch (e) {
                console.warn('Invalid exit date for expense query:', exitDate);
              }
            }
            
            // Combine date conditions with $and
            if (dateConditions.length > 0) {
              expenseQuery.$and = dateConditions;
            }
          }
          
          // Execute query
          expenses = await GroupExpense.find(expenseQuery)
            .sort({ date: -1, created_at: -1 }) // Sort by date descending
            .lean();
          
          // ROOT CAUSE FIX: Additional client-side filter to ensure dates are correct
          // This catches any edge cases where MongoDB query might miss something
          if (!isDeletedGroup && userMember.joined_at && exitDate) {
            try {
              const joinedAtDate = new Date(userMember.joined_at);
              const exitAtDate = new Date(exitDate);
              
              if (!isNaN(joinedAtDate.getTime()) && !isNaN(exitAtDate.getTime())) {
                expenses = expenses.filter(exp => {
                  const expDate = exp.date ? new Date(exp.date) : (exp.created_at ? new Date(exp.created_at) : null);
                  if (!expDate) return true; // Include if no date (legacy data)
                  return expDate >= joinedAtDate && expDate <= exitAtDate;
                });
              }
            } catch (e) {
              console.warn('Error in client-side date filter:', e);
            }
          }
            
          console.log(`✅ Found ${expenses.length} expenses for previous group ${g._id} (user joined: ${userMember.joined_at}, ${userMember.status === 'removed' ? 'removed' : 'left'}: ${exitDate})`);
        } catch (err) {
          console.error('Error fetching expenses for group:', g._id, err);
          expenses = [];
        }

        // Get active members at time of leaving (all members who were active before user left)
        // For deleted groups, include all members who were ever in the group
        let activeMembersAtTime = [];
        if (isDeletedGroup) {
          // For deleted groups, get all members who were ever in the group
          activeMembersAtTime = g.members.map(m => m.user_id).filter(id => id);
        } else {
          // For left groups, get members who joined before user left/removed
          activeMembersAtTime = g.members
            .filter(m => {
              if (!m.joined_at) return true;
              if (exitDate) {
                try {
                  return new Date(m.joined_at) <= new Date(exitDate);
                } catch (e) {
                  return true; // Include member if date parsing fails
                }
              }
              return true;
            })
            .map(m => m.user_id)
            .filter(id => id);
        }

        // Only query if there are members and filter out invalid IDs
        let members = [];
        if (activeMembersAtTime.length > 0) {
          try {
            // Filter out null, undefined, and invalid IDs
            // Convert all IDs to strings for comparison, and filter out falsy values
            const validMemberIds = activeMembersAtTime
              .filter(id => id != null && id !== undefined)
              .map(id => {
                // Convert to string if it's an ObjectId
                if (id && typeof id === 'object' && id.toString) {
                  return id.toString();
                }
                return String(id);
              })
              .filter(id => id && id.length > 0);
            
            if (validMemberIds.length > 0) {
              members = await User.find({
                _id: { $in: validMemberIds }
              }).select('name email').lean();
            }
          } catch (err) {
            console.error('Error fetching members for group:', g._id, err);
            console.error('Error details:', err.message, err.stack);
            // Return empty members array if query fails
            members = [];
          }
        }

        // ROOT CAUSE FIX: Get money transfers/payments for this group and user's membership period
        let transfers = [];
        try {
          const Payment = (await import('../models/Payment.js')).default;
          
          const transferQuery = {
            group_id: g._id,
            $or: [
              { sender_id: req.user.id },
              { receiver_id: req.user.id }
            ]
          };
          
          // Filter transfers by date range (only while user was a member)
          if (userMember.joined_at || exitDate) {
            const dateRange = {};
            if (userMember.joined_at) {
              try {
                const joinedAtDate = new Date(userMember.joined_at);
                if (!isNaN(joinedAtDate.getTime())) {
                  dateRange.$gte = joinedAtDate;
                }
              } catch (e) {
                console.warn('Invalid joined_at for transfer query:', userMember.joined_at);
              }
            }
            // ROOT CAUSE FIX: Use exitDate (removed_at or left_at) for filtering transfers
            if (exitDate) {
              try {
                const exitAtDate = new Date(exitDate);
                if (!isNaN(exitAtDate.getTime())) {
                  dateRange.$lte = exitAtDate;
                }
              } catch (e) {
                console.warn('Invalid exit date for transfer query:', exitDate);
              }
            }
            
            if (Object.keys(dateRange).length > 0) {
              transferQuery.created_at = dateRange;
            }
          }
          
          const payments = await Payment.find(transferQuery)
            .populate('sender_id', 'name email')
            .populate('receiver_id', 'name email')
            .sort({ created_at: -1 })
            .lean();
          
          transfers = payments.map(p => ({
            id: p._id,
            sender_id: p.sender_id?._id || p.sender_id,
            receiver_id: p.receiver_id?._id || p.receiver_id,
            sender_name: p.sender_id?.name || 'Unknown',
            receiver_name: p.receiver_id?.name || 'Unknown',
            amount: p.amount || 0,
            status: p.status || 'success',
            note: p.note || 'Payment',
            currency: p.currency || 'INR',
            created_at: p.created_at,
            date: p.created_at
          }));
          
          console.log(`✅ Found ${transfers.length} transfers for previous group ${g._id}`);
        } catch (err) {
          console.error('Error fetching transfers for group:', g._id, err);
          transfers = [];
        }

        // Format dates safely
        let leftDate = null;
        let leftTime = null;
        if (exitDate) {
          try {
            const exitAtDate = new Date(exitDate);
            if (!isNaN(exitAtDate.getTime())) {
              leftDate = exitAtDate.toLocaleDateString('en-IN');
              leftTime = exitAtDate.toLocaleTimeString('en-IN');
            }
          } catch (e) {
            console.warn('Error formatting exit date:', exitDate);
          }
        }

        return {
          id: g._id,
          name: g.name || 'Unnamed Group',
          owner: g.owner_id?.name || 'Unknown',
          owner_id: g.owner_id?._id,
          members: members.map(m => m?.name || 'Unknown'),
          expenses: expenses.length,
          expensesHistory: expenses.map(e => ({
            _id: e._id,
            id: e._id,
            description: e.description || '',
            amount: e.amount || 0,
            date: e.date || e.created_at,
            paidBy: e.paid_by || '', // paid_by is a string, not an object
            paid_by: e.paid_by || '',
            splitMethod: e.split_method || 'equal',
            split_method: e.split_method || 'equal',
            splitData: e.split_data || {},
            split_data: e.split_data || {},
            paidStatus: e.paid_status || {},
            paid_status: e.paid_status || {},
            createdAt: e.created_at || new Date(),
            created_at: e.created_at || new Date()
          })),
          transfers: transfers, // ROOT CAUSE FIX: Include transfers in response
          transfersHistory: transfers, // Alias for backward compatibility
          leftDate: leftDate,
          leftTime: leftTime,
          reason: isDeletedGroup ? 'Deleted by owner' : exitReason, // ROOT CAUSE FIX: Use exitReason (Removed from the group or Left group)
          joinedDate: userMember.joined_at || null,
          lastInteractedAt: exitDate || new Date().toISOString() // ROOT CAUSE FIX: Use exitDate instead of left_at
        };
      } catch (err) {
        console.error('Error processing group:', g._id, err);
        console.error('Error details:', err.message, err.stack);
        return null; // Skip this group if there's an error
      }
    }));

    // Filter out nulls and sort by lastInteractedAt
    const filtered = previousGroups.filter(g => g !== null).sort((a, b) => {
      const timeA = a.lastInteractedAt ? new Date(a.lastInteractedAt).getTime() : 0;
      const timeB = b.lastInteractedAt ? new Date(b.lastInteractedAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.json(createStandardResponse(true, { items: filtered }));

  } catch (error) {
    console.error('Get previous groups error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error: ' + error.message));
  }
});

// ==================== GET SINGLE GROUP ====================
groupsRouter.get('/:id', async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).populate('owner_id', 'name email').lean();

    if (!group) {
      return res.status(404).json(createStandardResponse(false, null, 'Group not found'));
    }

    // Get member details
    const activeMemberIds = group.members
      .filter(m => m.status === 'active')
      .map(m => m.user_id)
      .filter(id => id != null); // Filter out null/undefined IDs

    const members = await User.find({
      _id: { $in: activeMemberIds }
    }).select('name email avatar').lean();

    // ROOT CAUSE FIX: Add membersDetails with _id field (for frontend dropdown population)
    group.membersDetails = members.map(m => ({
      _id: m._id,
      id: m._id.toString(), // Add id as string for easier frontend access
      name: m.name,
      email: m.email,
      avatar: m.avatar
    }));

    // ROOT CAUSE FIX: Also populate members array with user details for easier frontend access
    // Create a map for quick lookup
    const membersMap = {};
    members.forEach(m => {
      membersMap[m._id.toString()] = m;
    });

    // Update members array to include populated user details
    group.members = group.members
      .filter(m => m.status === 'active') // Only include active members
      .map(member => {
        const memberIdStr = member.user_id ? (member.user_id.toString ? member.user_id.toString() : String(member.user_id)) : null;
        const userDetails = memberIdStr ? membersMap[memberIdStr] : null;
        
        if (userDetails) {
          return {
            ...member,
            user_id: {
              _id: userDetails._id,
              id: userDetails._id.toString(),
              name: userDetails.name,
              email: userDetails.email,
              avatar: userDetails.avatar
            }
          };
        }
        return member;
      });

    return res.json(createStandardResponse(true, group));

  } catch (error) {
    console.error('Get group error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== JOIN GROUP ====================
const joinSchema = z.object({
  code: z.string().min(4, 'Invite code must be at least 4 characters')
});

groupsRouter.post('/join', async (req, res) => {
  try {
    const parse = joinSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { code } = parse.data;

    const group = await Group.findOne({ invite_code: code.toUpperCase() });
    if (!group) {
      return res.status(404).json(createStandardResponse(false, null, 'Invalid invite code'));
    }

    // Check if user is already a member
    const existingMember = group.members.find(m =>
      m.user_id.toString() === req.user.id && m.status === 'active'
    );

    if (existingMember) {
      return res.status(400).json(createStandardResponse(false, null, 'Already a member of this group'));
    }

    // Add user to group
    group.members.push({
      user_id: req.user.id,
      status: 'active',
      joined_at: new Date()
    });

    await group.save();

    // Notify all active group members in real-time
    const allMemberIds = group.members
      .filter(m => m.status === 'active')
      .map(m => m.user_id);
    broadcastToUsers(allMemberIds, 'group:updated', { id: group._id, name: group.name });

    return res.json(createStandardResponse(true, {
      joined: true,
      groupId: group._id,
      groupName: group.name
    }));

  } catch (error) {
    console.error('Join group error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== LEAVE GROUP ====================
groupsRouter.post('/:id/leave', async (req, res) => {
  try {
    console.log('========================================');
    console.log('LEAVE GROUP REQUEST');
    console.log('Group ID:', req.params.id);
    console.log('User ID:', req.user?.id);
    console.log('User Email:', req.user?.email);
    console.log('========================================');

    if (!req.user || !req.user.id) {
      console.error('❌ No user in request!');
      return res.status(401).json(createStandardResponse(false, null, 'Not authenticated'));
    }

    const group = await Group.findById(req.params.id);
    console.log('Group found:', !!group);
    
    if (!group) {
      console.error('❌ Group not found in database');
      return res.status(404).json(createStandardResponse(false, null, 'Group not found'));
    }

    console.log('Group details:', {
      id: group._id,
      name: group.name,
      owner: group.owner_id,
      memberCount: group.members.length
    });

    // Find the member
    const member = group.members.find(m => {
      const userId = m.user_id?.toString() || m.user_id;
      const reqUserId = req.user.id?.toString() || req.user.id;
      const isMatch = userId === reqUserId;
      const isActive = m.status === 'active';
      console.log(`Checking member: ${userId} === ${reqUserId} && ${m.status} === active: ${isMatch && isActive}`);
      return isMatch && isActive;
    });

    console.log('Member found:', !!member);

    if (!member) {
      console.error('❌ User is not an active member of this group');
      return res.status(404).json(createStandardResponse(false, null, 'Not a member of this group'));
    }

    // Owner cannot leave (must delete group instead)
    const ownerId = group.owner_id?.toString() || group.owner_id;
    const userId = req.user.id?.toString() || req.user.id;
    console.log('Owner check:', ownerId, '===', userId, ':', ownerId === userId);
    
    if (ownerId === userId) {
      console.warn('⚠️ Owner trying to leave');
      return res.status(400).json(createStandardResponse(false, null, 'Owner cannot leave group. Delete the group instead.'));
    }

    // Mark as left
    console.log('✅ Marking user as left...');
    member.status = 'left';
    member.left_at = new Date();

    await group.save();
    console.log('✅ Group saved successfully');

    return res.json(createStandardResponse(true, { left: true }));

  } catch (error) {
    console.error('❌ Leave group error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error: ' + error.message));
  }
});

// ==================== REMOVE MEMBER FROM GROUP ====================
const removeMemberSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required')
});

groupsRouter.post('/:id/remove-member', async (req, res) => {
  try {
    console.log('========================================');
    console.log('REMOVE MEMBER REQUEST');
    console.log('Group ID:', req.params.id);
    console.log('Member to remove:', req.body.memberId);
    console.log('Requested by:', req.user?.id);
    console.log('========================================');

    const parse = removeMemberSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { memberId } = parse.data;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json(createStandardResponse(false, null, 'Group not found'));
    }

    // Check if requester is the owner
    const ownerId = group.owner_id?.toString();
    const requesterId = req.user.id?.toString();
    
    if (ownerId !== requesterId) {
      return res.status(403).json(createStandardResponse(false, null, 'Only the group owner can remove members'));
    }

    // Cannot remove self (owner)
    if (memberId === requesterId) {
      return res.status(400).json(createStandardResponse(false, null, 'Owner cannot remove themselves. Delete the group instead.'));
    }

    // Find the member to remove
    const member = group.members.find(m => {
      const userId = m.user_id?.toString();
      return userId === memberId && m.status === 'active';
    });

    if (!member) {
      return res.status(404).json(createStandardResponse(false, null, 'Member not found in this group'));
    }

    // Mark member as removed
    member.status = 'removed';
    member.removed_at = new Date();
    member.removed_by = req.user.id;

    await group.save();

    // Get removed user details for notification
    const removedUser = await User.findById(memberId).select('name email');

    // Create notification for the removed member
    if (removedUser) {
      await createNotificationsForUsers([memberId], {
        type: 'member_removed',
        title: `Removed from ${group.name}`,
        message: `You were removed from "${group.name}" by the group owner`,
        group_id: req.params.id,
        metadata: {
          groupName: group.name,
          removedBy: req.user.name || 'Group Owner',
          removedAt: new Date().toISOString()
        }
      });
    }

    console.log('✅ Member removed successfully');

    return res.json(createStandardResponse(true, {
      removed: true,
      memberName: removedUser?.name || 'Unknown',
      memberEmail: removedUser?.email
    }));

  } catch (error) {
    console.error('❌ Remove member error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error: ' + error.message));
  }
});

// ==================== DELETE GROUP ====================
groupsRouter.delete('/:id', async (req, res) => {
  try {
    const permanent = req.query.permanent === 'true';
    
    // Check if user is owner (for normal delete) or was a member (for permanent delete from previous)
    const group = await Group.findOne({
      _id: req.params.id
    });

    if (!group) {
      return res.status(404).json(createStandardResponse(false, null, 'Group not found'));
    }

    // For permanent deletion, check if user was a member (can be owner or left member)
    if (permanent) {
      const userWasMember = group.members.some(m => {
        const userId = m.user_id?.toString() || m.user_id;
        const reqUserId = req.user.id?.toString() || req.user.id;
        return userId === reqUserId;
      });

      if (!userWasMember) {
        return res.status(403).json(createStandardResponse(false, null, 'You were not a member of this group'));
      }

      // Permanently delete the group and all its expenses
      await GroupExpense.deleteMany({ group_id: req.params.id });
      await Group.deleteOne({ _id: req.params.id });

      return res.json(createStandardResponse(true, { deleted: true, permanent: true }));
    }

    // For normal deletion, only owner can delete
    if (group.owner_id.toString() !== req.user.id.toString()) {
      return res.status(403).json(createStandardResponse(false, null, 'Only the group owner can delete the group'));
    }

    // Get all active members before deleting (for notifications)
    const activeMembers = group.members
      .filter(m => m.status === 'active' && m.user_id && m.user_id.toString() !== req.user.id.toString())
      .map(m => m.user_id);

    // Create notifications for all members before deleting
    if (activeMembers.length > 0) {
      try {
        await createNotificationsForUsers(activeMembers, {
          type: 'group_deleted',
          title: `Group "${group.name}" deleted`,
          message: `The group "${group.name}" was deleted by the owner`,
          group_id: req.params.id,
          metadata: {
            groupName: group.name,
            deletedBy: req.user.name || 'Group Owner',
            deletedAt: new Date().toISOString()
          }
        });
      } catch (notifError) {
        console.error('Failed to create delete notifications (non-critical):', notifError);
      }
    }

    // Instead of deleting the group, mark all members as 'left' with the same timestamp
    // This preserves the group in the database so it appears in "previous groups"
    const deletionTime = new Date();
    
    // Mark all members (including owner) as left
    group.members.forEach(member => {
      if (member.status === 'active') {
        member.status = 'left';
        member.left_at = deletionTime;
      }
    });
    
    // Save the group with all members marked as left
    await group.save();

    // Notify all affected member tabs in real-time (including owner)
    const allMemberIds = group.members.map(m => m.user_id);
    broadcastToUsers(allMemberIds, 'group:updated', { id: req.params.id });

    return res.json(createStandardResponse(true, { deleted: true }));

  } catch (error) {
    console.error('Delete group error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== ADD GROUP EXPENSE (OLD ENDPOINT - DEPRECATED) ====================
const addExpenseSchemaOld = z.object({
  groupId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  spentAt: z.string().min(1, 'Date is required'),
  splitMethod: z.enum(['equal', 'percentage', 'manual', 'shares']).optional(),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number()
  })).optional(),
  notes: z.string().optional()
});

groupsRouter.post('/add-expense', async (req, res) => {
  try {
    const parse = addExpenseSchemaOld.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { groupId, title, amount, category, spentAt, splitMethod, splits, notes } = parse.data;

    // Check if user is a member
    const group = await Group.findOne({
      _id: groupId,
      'members.user_id': req.user.id,
      'members.status': 'active'
    });

    if (!group) {
      return res.status(403).json(createStandardResponse(false, null, 'Not a member of this group'));
    }

    // Create expense
    const expenseData = {
      group_id: groupId,
      payer_id: req.user.id,
      title,
      amount,
      category,
      spent_at: new Date(spentAt),
      split_method: splitMethod || 'equal',
      notes: notes || null
    };

    // Add splits if provided
    if (splits && splits.length > 0) {
      expenseData.splits = splits.map(s => ({
        user_id: s.userId,
        amount: s.amount,
        paid: s.userId === req.user.id
      }));
    } else {
      // Equal split by default
      const activeMembers = group.members.filter(m => m.status === 'active');
      const shareAmount = amount / activeMembers.length;
      expenseData.splits = activeMembers.map(m => ({
        user_id: m.user_id,
        amount: shareAmount,
        paid: m.user_id.toString() === req.user.id
      }));
    }

    const expense = await GroupExpense.create(expenseData);

    return res.json(createStandardResponse(true, {
      id: expense._id,
      title: expense.title,
      amount: expense.amount
    }));

  } catch (error) {
    console.error('Add group expense error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== GET GROUP EXPENSES ====================
// NOTE: The main GET expenses route is defined later in the file (line ~842)
// This old duplicate route has been removed to avoid conflicts

// ==================== GET GROUP BALANCES ====================
groupsRouter.get('/:id/balances', async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if user is a member
    const group = await Group.findOne({
      _id: groupId,
      'members.user_id': req.user.id,
      'members.status': 'active'
    });

    if (!group) {
      return res.status(404).json(createStandardResponse(false, null, 'Group not found'));
    }

    // Get active members
    const activeMemberIds = group.members
      .filter(m => m.status === 'active')
      .map(m => m.user_id);

    const members = await User.find({
      _id: { $in: activeMemberIds }
    }).select('name email').lean();

    // Get all expenses
    const expenses = await GroupExpense.find({ group_id: groupId }).lean();

    // Calculate balances
    const balances = {};
    members.forEach(m => {
      balances[m._id.toString()] = 0;
    });

    expenses.forEach(expense => {
      // Add amount paid by payer
      const payerId = expense.payer_id.toString();
      if (balances[payerId] !== undefined) {
        balances[payerId] += expense.amount;
      }

      // Subtract shares from each member
      expense.splits.forEach(split => {
        const userId = split.user_id.toString();
        if (balances[userId] !== undefined) {
          balances[userId] -= split.amount;
        }
      });
    });

    const result = members.map(m => ({
      userId: m._id,
      name: m.name,
      email: m.email,
      balance: Number(balances[m._id.toString()].toFixed(2))
    }));

    return res.json(createStandardResponse(true, { balances: result }));

  } catch (error) {
    console.error('Get balances error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== MARK SPLIT AS PAID ====================
groupsRouter.post('/expenses/:expenseId/mark-paid', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json(createStandardResponse(false, null, 'User ID is required'));
    }

    const expense = await GroupExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    // Find the split
    const split = expense.splits.find(s => s.user_id.toString() === userId);
    if (!split) {
      return res.status(404).json(createStandardResponse(false, null, 'Split not found'));
    }

    split.paid = true;
    await expense.save();

    return res.json(createStandardResponse(true, { marked: true }));

  } catch (error) {
    console.error('Mark paid error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== SEND EMAIL INVITATION ====================
const emailInviteSchema = z.object({
  groupId: z.string().min(1),
  email: z.string().email('Invalid email address'),
  message: z.string().optional()
});

groupsRouter.post('/send-invite', async (req, res) => {
  try {
    const parse = emailInviteSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { groupId, email, message } = parse.data;

    // Get group details
    const group = await Group.findOne({
      _id: groupId,
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).lean();

    if (!group) {
      return res.status(404).json(createStandardResponse(false, null, 'Group not found or you are not a member'));
    }

    // Get sender details
    const sender = await User.findById(req.user.id).select('name email').lean();

    // Create email content
    const frontendUrl = process.env.FRONTEND_URL || 'https://splitwise.space';
    const joinLink = `${frontendUrl}/groups.html?code=${group.invite_code}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fc; padding: 30px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">
            <span style="font-size: 40px;">👥</span><br>
            Group Invitation
          </span>
          </h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #2c3e50; margin-bottom: 20px;">Hi there!</p>
          
          <p style="font-size: 16px; color: #2c3e50; margin-bottom: 20px;">
            <strong>${sender.name}</strong> (${sender.email}) has invited you to join the group:
          </p>
          
          <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 20px; border-radius: 10px; border: 2px solid #667eea; margin: 20px 0; text-align: center;">
            <h2 style="color: #667eea; margin: 0; font-size: 24px;">"${group.name}"</h2>
          </div>
          
          ${message ? `
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #856404; font-style: italic;">
              <strong>Personal Message:</strong><br>
              "${message}"
            </p>
          </div>
          ` : ''}
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Your Invite Code:</p>
            <h1 style="color: white; margin: 0; font-size: 36px; letter-spacing: 5px; font-weight: bold;">${group.invite_code}</h1>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="color: #2c3e50; font-weight: bold; margin-bottom: 10px;">To join this group:</p>
            <ol style="color: #6c757d; line-height: 1.8;">
              <li>Open <strong>SplitWise</strong></li>
              <li>Go to the <strong>Groups</strong> page</li>
              <li>Click <strong>"Join Group"</strong></li>
              <li>Enter the invite code: <strong style="color: #667eea;">${group.invite_code}</strong></li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6c757d; margin-bottom: 15px;">Or click the button below to join directly:</p>
            <a href="${joinLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Join "${group.name}"
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #6c757d; font-size: 14px; text-align: center; margin: 0;">
            Happy expense tracking! 💰<br>
            <strong>SplitWise Team</strong>
          </p>
        </div>
      </div>
    `;

    const textContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 GROUP INVITATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi!

${sender.name} (${sender.email}) has invited you to join the group:
"${group.name}"

${message ? '\nPersonal Message:\n' + message + '\n' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 INVITE CODE: ${group.invite_code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To join this group:
1. Open SplitWise
2. Go to Groups page
3. Click "Join Group"
4. Enter the invite code: ${group.invite_code}

OR

Click here to join directly:
${joinLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Happy expense tracking! 💰
SplitWise Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    // Send email
    await sendEmail(
      email,
      `You're invited to join "${group.name}" on SplitWise`,
      textContent,
      htmlContent
    );

    return res.json(createStandardResponse(true, {
      sent: true,
      groupName: group.name,
      inviteCode: group.invite_code
    }));

  } catch (error) {
    console.error('Send invite error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to send invitation email'));
  }
});

// ==================== GROUP EXPENSES ====================

// Add expense to group
const addExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  paidBy: z.string().min(1, 'Paid by is required'),
  date: z.string(),
  splitMethod: z.enum(['equal', 'select', 'percent', 'manual']),
  splitData: z.record(z.number())
});

groupsRouter.post('/:id/expenses', async (req, res) => {
  try {
    console.log('========================================');
    console.log('ADD EXPENSE REQUEST');
    console.log('Group ID:', req.params.id);
    console.log('User ID:', req.user?.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('========================================');

    const parse = addExpenseSchema.safeParse(req.body);
    if (!parse.success) {
      console.error('❌ Validation failed:', parse.error.errors);
      const errors = parse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    console.log('✅ Validation passed, parsed data:', parse.data);

    const group = await Group.findOne({
      _id: req.params.id,
      'members.user_id': req.user.id,
      'members.status': 'active'
    });

    if (!group) {
      console.error('❌ Group not found or user not a member');
      return res.status(404).json(createStandardResponse(false, null, 'Group not found or you are not a member'));
    }

    console.log('✅ Group found:', group.name);

    // ROOT CAUSE FIX: Get user's preferred currency
    const user = await User.findById(req.user.id).select('preferred_currency').lean();
    const currency = user?.preferred_currency || 'INR';

    const expenseData = {
      group_id: req.params.id,
      description: parse.data.description,
      amount: parse.data.amount,
      currency: currency, // ROOT CAUSE FIX: Store currency with expense
      paid_by: parse.data.paidBy,
      date: new Date(parse.data.date),
      split_method: parse.data.splitMethod,
      split_data: parse.data.splitData,
      created_by: req.user.id
    };

    console.log('📝 Creating expense with data:', JSON.stringify(expenseData, null, 2));
    console.log('📝 Group ID type:', typeof req.params.id, 'Value:', req.params.id);

    const expense = await GroupExpense.create(expenseData);

    console.log('✅ Expense created successfully:', expense._id);
    console.log('✅ Expense group_id:', expense.group_id, 'Type:', typeof expense.group_id, 'String:', expense.group_id.toString());

    // Create notifications for all active members except the creator (don't fail if notification fails)
    try {
      const activeMembers = group.members
        .filter(m => m.status === 'active' && m.user_id && m.user_id.toString() !== req.user.id.toString())
        .map(m => m.user_id);

      if (activeMembers.length > 0) {
        await createNotificationsForUsers(activeMembers, {
          type: 'expense_added',
          title: `New expense in ${group.name}`,
          message: `${req.user.name || 'Someone'} added "${parse.data.description}"`,
          group_id: req.params.id,
          expense_id: expense._id,
          metadata: {
            amount: parse.data.amount,
            currency: currency, // ROOT CAUSE FIX: Include currency in metadata
            description: parse.data.description,
            groupName: group.name
          }
        });
      }
    } catch (notifError) {
      console.error('Failed to create notifications (non-critical):', notifError);
      // Don't fail the request if notifications fail
    }

    console.log('✅ Returning success response with expense ID:', expense._id);
    
    return res.json(createStandardResponse(true, {
      id: expense._id.toString(),
      expense: {
        _id: expense._id.toString(),
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paid_by,
        date: expense.date,
        split_method: expense.split_method,
        split_data: expense.split_data
      }
    }));

  } catch (error) {
    console.error('❌ Add expense error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json(createStandardResponse(false, null, `Internal server error: ${error.message}`));
  }
});

// Get all expenses for a group
groupsRouter.get('/:id/expenses', async (req, res) => {
  try {
    console.log('========================================');
    console.log('GET EXPENSES REQUEST');
    console.log('Group ID:', req.params.id);
    console.log('User ID:', req.user?.id);
    console.log('========================================');

    const group = await Group.findOne({
      _id: req.params.id,
      'members.user_id': req.user.id
    });

    if (!group) {
      console.error('❌ Group not found or user not a member');
      return res.status(404).json(createStandardResponse(false, null, 'Group not found or you are not a member'));
    }

    console.log('✅ Group found:', group.name);

    // Mongoose automatically converts string to ObjectId, but let's be explicit
    console.log('🔍 Querying expenses for group_id:', req.params.id);
    console.log('🔍 Group._id for comparison:', group._id.toString());
    
    // Use the group's ObjectId directly to avoid type mismatch
    let expenses = await GroupExpense.find({ 
      group_id: group._id  // Use ObjectId instead of string
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // ROOT CAUSE FIX: Populate created_by_name for easier frontend access
    // Since we're using lean(), we need to manually fetch user names
    const userIds = [...new Set(expenses.map(exp => exp.created_by).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id name').lean();
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user.name;
    });

    // Add created_by_name to each expense and ensure created_by is a string
    expenses = expenses.map(exp => {
      const expenseObj = { ...exp };
      if (expenseObj.created_by) {
        // ROOT CAUSE FIX: Ensure created_by is always a string (not ObjectId object)
        const creatorId = expenseObj.created_by.toString ? expenseObj.created_by.toString() : String(expenseObj.created_by);
        expenseObj.created_by = creatorId; // Convert to string for consistent frontend comparison
        expenseObj.created_by_name = userMap[creatorId] || null;
      }
      return expenseObj;
    });

    console.log('✅ Found', expenses.length, 'expenses for group');
    if (expenses.length > 0) {
      console.log('Sample expense:', JSON.stringify(expenses[0], null, 2));
    } else {
      console.log('⚠️ No expenses found. Checking all expenses in collection...');
      const allExpenses = await GroupExpense.find({}).lean();
      console.log('📊 Total expenses in collection:', allExpenses.length);
      if (allExpenses.length > 0) {
        console.log('Sample expense from collection:', JSON.stringify(allExpenses[0], null, 2));
        console.log('Sample expense group_id:', allExpenses[0].group_id, 'Type:', typeof allExpenses[0].group_id);
        console.log('Query group_id:', req.params.id, 'Type:', typeof req.params.id);
      }
    }

    return res.json(createStandardResponse(true, { expenses }));

  } catch (error) {
    console.error('❌ Get expenses error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json(createStandardResponse(false, null, `Internal server error: ${error.message}`));
  }
});

// Update expense
groupsRouter.put('/:groupId/expenses/:expenseId', async (req, res) => {
  try {
    const parse = addExpenseSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const expense = await GroupExpense.findOne({
      _id: req.params.expenseId,
      group_id: req.params.groupId
    });

    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    // Only the creator can edit the expense
    if (expense.created_by && expense.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json(createStandardResponse(false, null, 'You can only edit expenses you created'));
    }

    // ROOT CAUSE FIX: Get user's preferred currency (or keep existing)
    const user = await User.findById(req.user.id).select('preferred_currency').lean();
    const currency = user?.preferred_currency || expense.currency || 'INR';

    // Update expense
    expense.description = parse.data.description;
    expense.amount = parse.data.amount;
    expense.currency = currency; // ROOT CAUSE FIX: Update currency with expense
    expense.paid_by = parse.data.paidBy;
    expense.date = new Date(parse.data.date);
    expense.split_method = parse.data.splitMethod;
    expense.split_data = parse.data.splitData;

    await expense.save();

    // Get group and create notifications
    const group = await Group.findById(req.params.groupId);
    if (group) {
      const activeMembers = group.members
        .filter(m => m.status === 'active' && m.user_id.toString() !== req.user.id)
        .map(m => m.user_id);

      if (activeMembers.length > 0) {
        await createNotificationsForUsers(activeMembers, {
          type: 'expense_edited',
          title: `Expense updated in ${group.name}`,
          message: `${req.user.name || 'Someone'} updated "${parse.data.description}"`,
          group_id: req.params.groupId,
          expense_id: expense._id,
          metadata: {
            amount: parse.data.amount,
            description: parse.data.description,
            groupName: group.name
          }
        });
      }
    }

    return res.json(createStandardResponse(true, { updated: true }));

  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// Delete expense
groupsRouter.delete('/:groupId/expenses/:expenseId', async (req, res) => {
  try {
    const expense = await GroupExpense.findOne({
      _id: req.params.expenseId,
      group_id: req.params.groupId
    });

    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    // Only the creator can delete the expense
    if (expense.created_by && expense.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json(createStandardResponse(false, null, 'You can only delete expenses you created'));
    }

    const expenseDescription = expense.description;

    await GroupExpense.deleteOne({ _id: req.params.expenseId });

    // Get group and create notifications
    const group = await Group.findById(req.params.groupId);
    if (group) {
      const activeMembers = group.members
        .filter(m => m.status === 'active' && m.user_id.toString() !== req.user.id)
        .map(m => m.user_id);

      if (activeMembers.length > 0) {
        await createNotificationsForUsers(activeMembers, {
          type: 'expense_deleted',
          title: `Expense deleted in ${group.name}`,
          message: `${req.user.name || 'Someone'} deleted "${expenseDescription}"`,
          group_id: req.params.groupId,
          metadata: {
            description: expenseDescription,
            groupName: group.name
          }
        });
      }
    }

    return res.json(createStandardResponse(true, { deleted: true }));

  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// Mark expense as paid
const markPaidSchema = z.object({
  memberName: z.string().min(1, 'Member name is required')
});

groupsRouter.post('/:groupId/expenses/:expenseId/mark-paid', async (req, res) => {
  try {
    const parse = markPaidSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const expense = await GroupExpense.findOne({
      _id: req.params.expenseId,
      group_id: req.params.groupId
    });

    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    // Initialize paid_status if it doesn't exist
    if (!expense.paid_status) {
      expense.paid_status = {};
    }

    // Check if already marked as paid
    if (expense.paid_status[parse.data.memberName] === true) {
      return res.json(createStandardResponse(true, { marked: true, alreadyPaid: true }));
    }

    expense.paid_status[parse.data.memberName] = true;
    expense.markModified('paid_status');
    
    await expense.save();

    // Get group and create payment record
    const group = await Group.findById(req.params.groupId);
    if (group) {
      // Find the payer's user ID by matching the paid_by name with member names
      // First, get all member user IDs
      const memberUserIds = group.members
        .filter(m => m.status === 'active')
        .map(m => m.user_id);
      
      // Get member details to find the one matching paid_by name
      const membersWithDetails = await User.find({ _id: { $in: memberUserIds } })
        .select('name _id preferred_currency')
        .lean();
      
      // Find the payer user by matching name
      const payerUser = membersWithDetails.find(u => u.name === expense.paid_by);
      
      // Find the member who marked as paid (req.user)
      const memberWhoPaid = membersWithDetails.find(u => u._id.toString() === req.user.id.toString());
      
      // Calculate the amount this member owes
      let amountToPay = 0;
      const splitData = expense.split_data || expense.splitData || {};
      
      if (expense.split_method === 'equal' || expense.split_method === 'select') {
        // Equal split: divide amount by number of members in split_data
        const splitMembers = Object.keys(splitData);
        if (splitMembers.length > 0) {
          amountToPay = expense.amount / splitMembers.length;
        }
      } else if (expense.split_method === 'percent') {
        // Percentage split
        const memberPercent = splitData[parse.data.memberName] || 0;
        amountToPay = (expense.amount * memberPercent) / 100;
      } else if (expense.split_method === 'manual') {
        // Manual split: get the specific amount for this member
        amountToPay = parseFloat(splitData[parse.data.memberName] || 0);
      }
      
      // ROOT CAUSE FIX: Create payment/transfer record when marking as paid
      if (payerUser && memberWhoPaid && amountToPay > 0 && payerUser._id.toString() !== req.user.id.toString()) {
        const Payment = (await import('../models/Payment.js')).default;
        
        try {
          // ROOT CAUSE FIX: Payment amount is in expense.currency, so payment currency must match expense.currency
          // The frontend will convert to the viewing user's preferred currency when displaying
          const payment = await Payment.create({
            sender_id: req.user.id,
            receiver_id: payerUser._id,
            amount: amountToPay,
            status: 'success',
            note: `Payment for "${expense.description}" in group "${group.name}"`,
            group_id: req.params.groupId,
            expense_id: expense._id,
            currency: expense.currency || 'INR' // ROOT CAUSE FIX: Use expense currency, not payer's currency
          });
          
          console.log('✅ Payment record created:', payment._id);
        } catch (paymentError) {
          console.error('Error creating payment record:', paymentError);
          // Continue even if payment record creation fails
        }
        
        // Send notification to payer
        await createNotificationsForUsers([payerUser._id], {
          type: 'payment_marked',
          title: `Payment received in ${group.name}`,
          message: `${req.user.name || 'Someone'} marked their payment as paid for "${expense.description}"`,
          group_id: req.params.groupId,
          expense_id: expense._id,
          metadata: {
            description: expense.description,
            groupName: group.name,
            payer: req.user.name || 'Someone',
            amount: amountToPay
          }
        });
      }
    }

    return res.json(createStandardResponse(true, { marked: true }));

  } catch (error) {
    console.error('Mark paid error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});


export default groupsRouter;
