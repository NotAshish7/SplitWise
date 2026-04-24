import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';
import Expense from '../models/Expense.js';
import GroupExpense from '../models/GroupExpense.js';
import Group from '../models/Group.js';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify';

export const reportsRouter = Router();
reportsRouter.use(authRequired);

reportsRouter.get('/charts', async (req, res, next) => {
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

    // Get user's name for share calculation
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).lean();
    const userName = user?.name || 'You';

    // ROOT CAUSE FIX: Only include group expenses where user is involved in split
    // Calculate user's share instead of full expense amount
    const filteredGroupExpenses = groupExpenses
      .filter(ge => {
        // Check if user is involved in this expense's split
        const splitData = ge.split_data || {};
        const userShare = splitData[userName];
        return userShare !== undefined && userShare !== null && parseFloat(userShare) > 0;
      })
      .map(ge => {
        const group = userGroups.find(g => g._id.toString() === ge.group_id.toString());
        const splitData = ge.split_data || {};
        const userShare = parseFloat(splitData[userName]) || 0;
        
        return {
          category: `Group: ${group?.name || 'Unknown'}`,
          amount: userShare, // ROOT CAUSE FIX: Use user's share instead of full amount
          spent_at: ge.date,
          type: 'group'
        };
      });

    // Combine all expenses for charts
    const allExpenses = [
      ...personalExpenses.map(e => ({
        category: e.category,
        amount: e.amount,
        spent_at: e.spent_at,
        type: 'personal'
      })),
      ...filteredGroupExpenses
    ];
    
    const byCategory = {};
    allExpenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    
    const byMonth = {};
    allExpenses.forEach(e => {
      const date = new Date(e.spent_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[month] = (byMonth[month] || 0) + e.amount;
    });
    
    const timeline = allExpenses.map(e => ({ date: e.spent_at, amount: e.amount }));
    
    return res.json(createStandardResponse(true, { 
      byCategory: Object.entries(byCategory).map(([category, total]) => ({ category, total })), 
      byMonth: Object.entries(byMonth).sort().map(([ym, total]) => ({ ym, total })),
      timeline 
    }));
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/download/pdf', async (req, res, next) => {
  try {
    // Fetch personal expenses
    const personalExpenses = await Expense.find({ user_id: req.user.id }).lean();
    
    // Fetch group expenses
    const userGroups = await Group.find({
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).select('_id name').lean();

    const groupIds = userGroups.map(g => g._id);
    const groupExpenses = await GroupExpense.find({ group_id: { $in: groupIds } }).lean();

    // Get user's name for filtering
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).lean();
    const userName = user?.name || 'You';

    // ROOT CAUSE FIX: Only include group expenses where user is involved in split
    const filteredGroupExpenses = groupExpenses.filter(ge => {
      const splitData = ge.split_data || {};
      const userShare = splitData[userName];
      return userShare !== undefined && userShare !== null && parseFloat(userShare) > 0;
    });

    // Transform expenses to common format
    const personalItems = personalExpenses.map(e => ({
      spent_at: e.spent_at,
      category: e.category,
      title: e.title,
      amount: e.amount,
      type: 'Personal'
    }));

    const groupItems = filteredGroupExpenses.map(ge => {
      const group = userGroups.find(g => g._id.toString() === ge.group_id.toString());
      const splitData = ge.split_data || {};
      const userShare = parseFloat(splitData[userName]) || 0;
      
      return {
        spent_at: ge.date,
        category: `Group: ${group?.name || 'Unknown'}`,
        title: ge.description,
        amount: userShare, // ROOT CAUSE FIX: Use user's share instead of full amount
        type: 'Group',
        paid_by: ge.paid_by
      };
    });

    const items = [...personalItems, ...groupItems].sort((a, b) => new Date(b.spent_at) - new Date(a.spent_at));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses-report.pdf"');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('SplitWise - Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    items.forEach((row) => {
      const dateStr = new Date(row.spent_at).toLocaleDateString();
      const paidBy = row.paid_by ? ` (Paid by: ${row.paid_by})` : '';
      doc.text(`${dateStr} | ${row.category} | ${row.title} | ₹${row.amount.toFixed(2)}${paidBy}`);
    });
    doc.end();
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/download/csv', async (req, res, next) => {
  try {
    // Fetch personal expenses
    const personalExpenses = await Expense.find({ user_id: req.user.id }).lean();
    
    // Fetch group expenses
    const userGroups = await Group.find({
      'members.user_id': req.user.id,
      'members.status': 'active'
    }).select('_id name').lean();

    const groupIds = userGroups.map(g => g._id);
    const groupExpenses = await GroupExpense.find({ group_id: { $in: groupIds } }).lean();

    // Transform expenses to common format
    const personalItems = personalExpenses.map(e => ({
      title: e.title,
      category: e.category,
      amount: e.amount,
      spent_at: e.spent_at,
      type: 'Personal'
    }));

    const groupItems = groupExpenses.map(ge => {
      const group = userGroups.find(g => g._id.toString() === ge.group_id.toString());
      return {
        title: ge.description,
        category: `Group: ${group?.name || 'Unknown'}`,
        amount: ge.amount,
        spent_at: ge.date,
        type: 'Group',
        paid_by: ge.paid_by
      };
    });

    const items = [...personalItems, ...groupItems].sort((a, b) => new Date(b.spent_at) - new Date(a.spent_at));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses-report.csv"');
    const stringifier = stringify({ header: true, columns: ['title', 'category', 'amount', 'spent_at', 'type', 'paid_by'] });
    stringifier.pipe(res);
    items.forEach(row => stringifier.write(row));
    stringifier.end();
  } catch (error) {
    next(error);
  }
});
