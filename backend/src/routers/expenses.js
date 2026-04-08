import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import GroupExpense from '../models/GroupExpense.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';
import AppError from '../utils/AppError.js';
import { broadcastToUser } from '../utils/sseEmitter.js';

export const expensesRouter = Router();

// All routes require authentication
expensesRouter.use(requireAuth);

// ==================== CREATE EXPENSE ====================
const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  spentAt: z.string().min(1, 'Date is required'),
  notes: z.string().optional()
});

expensesRouter.post('/', async (req, res, next) => {
  try {
    const parse = expenseSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { title, amount, category, spentAt, notes } = parse.data;

    // ROOT CAUSE FIX: Get user's preferred currency
    const user = await User.findById(req.user.id).select('preferred_currency').lean();
    const currency = user?.preferred_currency || 'INR';

    const expense = await Expense.create({
      user_id: req.user.id,
      title,
      amount,
      currency: currency, // ROOT CAUSE FIX: Store currency with expense
      category,
      spent_at: new Date(spentAt),
      notes: notes || null
    });

    broadcastToUser(req.user.id, 'expense:created', {
      id: expense._id, title: expense.title, amount: expense.amount,
      category: expense.category, spent_at: expense.spent_at,
    });

    return res.json(createStandardResponse(true, {
      id: expense._id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      spent_at: expense.spent_at,
      notes: expense.notes
    }));

  } catch (error) {
    next(error);
  }
});

// ==================== GET EXPENSES (with filters) ====================
expensesRouter.get('/', async (req, res, next) => {
  try {
    const { start, end, category, q } = req.query;

    // Build query for personal expenses
    const query = { user_id: req.user.id };

    if (start || end) {
      query.spent_at = {};
      if (start) query.spent_at.$gte = new Date(start);
      if (end) query.spent_at.$lte = new Date(end);
    }

    if (category) {
      query.category = category;
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } }
      ];
    }

    // Fetch personal expenses
    const personalExpenses = await Expense.find(query)
      .sort({ spent_at: -1, created_at: -1 })
      .lean();

    // Fetch group expenses where user is a member
    const userGroups = await Group.find({
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).select('_id name').lean();

    const groupIds = userGroups.map(g => g._id);
    
    let groupExpensesQuery = { group_id: { $in: groupIds } };
    
    if (start || end) {
      groupExpensesQuery.date = {};
      if (start) groupExpensesQuery.date.$gte = new Date(start);
      if (end) groupExpensesQuery.date.$lte = new Date(end);
    }
    
    if (q) {
      groupExpensesQuery.description = { $regex: q, $options: 'i' };
    }

    const groupExpenses = await GroupExpense.find(groupExpensesQuery)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Get user's name to filter expenses where user is involved in split
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).lean();
    const userName = user?.name || 'You';

    // Transform group expenses to match expense format for compatibility
    // ROOT CAUSE FIX: Only include expenses where user is involved in the split
    // Use case-insensitive matching for user name
    const transformedGroupExpenses = groupExpenses
      .filter(ge => {
        // Check if user is involved in this expense's split
        const splitData = ge.split_data || {};
        const splitKeys = Object.keys(splitData);
        
        // Case-insensitive matching for user name
        const userInSplit = splitKeys.some(key => 
          key.toLowerCase().trim() === userName.toLowerCase().trim()
        );
        
        // If user is in split, check their share
        if (userInSplit) {
          const matchingKey = splitKeys.find(key => 
            key.toLowerCase().trim() === userName.toLowerCase().trim()
          );
          const userShare = splitData[matchingKey];
          return userShare !== undefined && userShare !== null && parseFloat(userShare) > 0;
        }
        
        // If split_data is empty, include the expense (fallback for legacy data)
        if (splitKeys.length === 0) {
          return true;
        }
        
        return false;
      })
      .map(ge => {
        // ROOT CAUSE FIX: Find group name from userGroups array
        const group = userGroups.find(g => g._id.toString() === ge.group_id.toString());
        const groupName = group?.name || 'Unknown Group';
        
        return {
          _id: ge._id,
          user_id: req.user.id,
          title: ge.description,
          description: ge.description,
          amount: ge.amount,
          currency: ge.currency || 'INR', // ROOT CAUSE FIX: Include currency field for charts
          category: `Group: ${groupName}`, // ROOT CAUSE FIX: Use group name instead of ID
          spent_at: ge.date,
          date: ge.date,
          notes: `Paid by: ${ge.paid_by}`,
          type: 'group',
          group_id: ge.group_id,
          paid_by: ge.paid_by,
          split_method: ge.split_method,
          split_data: ge.split_data
        };
      });

    // Combine and sort all expenses
    const allExpenses = [...personalExpenses.map(e => ({ ...e, type: 'personal' })), ...transformedGroupExpenses]
      .sort((a, b) => {
        const dateA = new Date(a.spent_at || a.date);
        const dateB = new Date(b.spent_at || b.date);
        return dateB - dateA;
      });

    // Apply category filter to combined results if needed
    let filteredExpenses = allExpenses;
    if (category) {
      filteredExpenses = allExpenses.filter(e => e.category === category);
    }

    return res.json(createStandardResponse(true, { items: filteredExpenses }));

  } catch (error) {
    next(error);
  }
});

// ==================== GET EXPENSE SUMMARY ====================
expensesRouter.get('/summary', async (req, res, next) => {
  try {
    // Fetch personal expenses
    const personalExpenses = await Expense.find({ user_id: req.user.id }).lean();

    // Fetch group expenses where user is a member
    const userGroups = await Group.find({
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).select('_id name').lean();

    const groupIds = userGroups.map(g => g._id);
    const groupExpenses = await GroupExpense.find({ group_id: { $in: groupIds } }).lean();

    // Get user's share from group expenses
    const user = await User.findById(req.user.id).lean(); // ROOT CAUSE FIX: Use imported User model instead of dynamic import
    const userName = user?.name || 'You';

    let totalPersonal = 0;
    let totalGroup = 0;
    let totalGroupShare = 0; // User's actual share

    // Calculate personal totals
    personalExpenses.forEach(e => {
      totalPersonal += e.amount;
    });

    // Calculate group totals and user's share
    const byCategory = {};
    const byMonth = {};

    // Process personal expenses
    personalExpenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      const date = new Date(e.spent_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[month] = (byMonth[month] || 0) + e.amount;
    });

    // Process group expenses
    groupExpenses.forEach(ge => {
      totalGroup += ge.amount;
      
      // Calculate user's share
      const splitData = ge.split_data || {};
      const userShare = splitData[userName] || 0;
      totalGroupShare += userShare;

      // Add to category as group expense
      const group = userGroups.find(g => g._id.toString() === ge.group_id.toString());
      const categoryKey = `Group: ${group?.name || 'Unknown'}`;
      byCategory[categoryKey] = (byCategory[categoryKey] || 0) + ge.amount;

      // Add to monthly breakdown
      const date = new Date(ge.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[month] = (byMonth[month] || 0) + ge.amount;
    });

    const total = totalPersonal + totalGroup;
    const totalUserShare = totalPersonal + totalGroupShare;

    return res.json(createStandardResponse(true, {
      total,
      totalPersonal,
      totalGroup,
      totalUserShare, // User's actual financial obligation (personal + their share in groups)
      byCategory: Object.entries(byCategory).map(([category, total]) => ({ category, total })),
      byMonth: Object.entries(byMonth).map(([ym, total]) => ({ ym, total })).sort((a, b) => a.ym.localeCompare(b.ym))
    }));

  } catch (error) {
    next(error);
  }
});

// ==================== GET SINGLE EXPENSE ====================
expensesRouter.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError('Invalid expense ID format', 400);
    }
    const expense = await Expense.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    return res.json(createStandardResponse(true, expense));

  } catch (error) {
    next(error);
  }
});

// ==================== UPDATE EXPENSE ====================
expensesRouter.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError('Invalid expense ID format', 400);
    }
    const parse = expenseSchema.partial().safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const updates = {};
    const { title, amount, category, spentAt, notes } = parse.data;

    if (title) updates.title = title;
    if (amount) updates.amount = amount;
    if (category) updates.category = category;
    if (spentAt) updates.spent_at = new Date(spentAt);
    if (notes !== undefined) updates.notes = notes;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    broadcastToUser(req.user.id, 'expense:updated', { id: expense._id });
    return res.json(createStandardResponse(true, expense));

  } catch (error) {
    next(error);
  }
});

// ==================== DELETE EXPENSE ====================
expensesRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError('Invalid expense ID format', 400);
    }
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!expense) {
      return res.status(404).json(createStandardResponse(false, null, 'Expense not found'));
    }

    broadcastToUser(req.user.id, 'expense:deleted', { id: expense._id });
    return res.json(createStandardResponse(true, { deleted: true, id: expense._id }));

  } catch (error) {
    next(error);
  }
});

export default expensesRouter;
