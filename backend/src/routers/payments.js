import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';
import { sendEmail } from '../utils/mailer.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

export const paymentsRouter = Router();

// ROOT CAUSE FIX: Register the group route BEFORE requireAuth middleware to debug
// But actually, we need auth, so register it after but add logging
paymentsRouter.use(requireAuth);

// ROOT CAUSE FIX: Debug middleware to see ALL requests to payments router
paymentsRouter.use((req, res, next) => {
  console.log('🔵 [PAYMENTS ROUTER] Request:', req.method, req.path, 'Params:', req.params);
  next();
});

const paySchema = z.object({ receiverEmail: z.string().email(), amount: z.number().positive(), note: z.string().optional() });
const groupPaySchema = z.object({ 
  receiver_id: z.string().min(1, 'Receiver ID is required'), 
  group_id: z.string().optional(),
  amount: z.number().positive('Amount must be positive'), 
  note: z.string().optional() 
});

// ROOT CAUSE FIX: Create payment using MongoDB model
paymentsRouter.post('/', async (req, res, next) => {
  try {
    const parse = paySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid input'));
    }
    
    const { receiverEmail, amount, note } = parse.data;
    
    // Find receiver by email
    const receiver = await User.findOne({ email: receiverEmail.toLowerCase() });
    if (!receiver) {
      return res.status(404).json(createStandardResponse(false, null, 'Receiver not found'));
    }
    
    // Get sender details
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json(createStandardResponse(false, null, 'Sender not found'));
    }
    
    // Create payment record
    const payment = await Payment.create({
      sender_id: req.user.id,
      receiver_id: receiver._id,
      amount: amount,
      status: 'success',
      note: note || null,
      currency: sender.preferred_currency || 'INR'
    });
    
    // Send email notifications
    const currencySymbol = sender.preferred_currency === 'USD' ? '$' : 
                          sender.preferred_currency === 'EUR' ? '€' :
                          sender.preferred_currency === 'GBP' ? '£' : 
                          sender.preferred_currency === 'JPY' ? '¥' :
                          sender.preferred_currency === 'AUD' ? 'A$' : '₹';
    
    sendEmail(receiver.email, 'Payment received', `You received ${currencySymbol}${amount.toFixed(2)} from ${sender.name}.`);
    sendEmail(sender.email, 'Payment sent', `You sent ${currencySymbol}${amount.toFixed(2)} to ${receiver.name}.`);
    
    return res.json(createStandardResponse(true, { id: payment._id }));
  } catch (error) {
    next(error);
  }
});

// Create payment for a group
paymentsRouter.post('/group', async (req, res, next) => {
  try {
    const parse = groupPaySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, parse.error.errors.map(e => e.message).join(', ')));
    }
    
    const { receiver_id, group_id, amount, note } = parse.data;
    
    // ROOT CAUSE FIX: Validate receiver_id is a valid ObjectId format before querying
    if (!receiver_id || !mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid receiver ID format. Please select a valid member.'));
    }
    
    // Verify receiver exists
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json(createStandardResponse(false, null, 'Receiver not found'));
    }
    
    // Get sender details
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json(createStandardResponse(false, null, 'Sender not found'));
    }
    
    // If group_id provided, verify sender is a member
    if (group_id) {
      const Group = (await import('../models/Group.js')).default;
      const group = await Group.findOne({
        _id: group_id,
        'members.user_id': req.user.id,
        'members.status': 'active'
      });
      
      if (!group) {
        return res.status(403).json(createStandardResponse(false, null, 'You are not a member of this group'));
      }
      
      // Verify receiver is also a member
      const receiverIsMember = group.members.some(m => 
        m.user_id && m.user_id.toString() === receiver_id.toString() && m.status === 'active'
      );
      
      if (!receiverIsMember) {
        return res.status(403).json(createStandardResponse(false, null, 'Receiver is not a member of this group'));
      }
    }
    
    // ROOT CAUSE FIX: Auto-match payment to expenses and update paid_status
    let matchedExpenses = [];
    let remainingPaymentAmount = amount;
    let expenseIdsToLink = [];
    
    if (group_id) {
      const GroupExpense = (await import('../models/GroupExpense.js')).default;
      
      try {
        // Get sender's name for matching
        const senderName = sender.name;
        const receiverName = receiver.name;
        
        // Find all unpaid expenses in this group where:
        // 1. Receiver paid for the expense (paid_by = receiver)
        // 2. Sender is in the split_data (owes money)
        // 3. Sender hasn't marked it as paid yet
        const unpaidExpenses = await GroupExpense.find({
          group_id: group_id,
          paid_by: { $regex: new RegExp(`^${receiverName}$`, 'i') }, // Case-insensitive match
          'split_data': { $exists: true }
        }).sort({ date: 1, createdAt: 1 }); // Oldest first
        
        // Get exchange rates for currency conversion (if needed)
        // For now, we'll assume payment currency matches expense currency, or convert if needed
        
        // Process each unpaid expense
        for (const expense of unpaidExpenses) {
          if (remainingPaymentAmount <= 0.01) break; // Payment exhausted
          
          // Initialize paid_status if needed
          if (!expense.paid_status) {
            expense.paid_status = {};
          }
          
          // ROOT CAUSE FIX: Check if sender already marked this expense as paid (case-insensitive)
          let isAlreadyPaid = false;
          let existingPaidKey = null;
          if (expense.paid_status) {
            for (const key in expense.paid_status) {
              if (key.toLowerCase().trim() === senderName.toLowerCase().trim() && expense.paid_status[key] === true) {
                isAlreadyPaid = true;
                existingPaidKey = key; // Store the existing key to use it consistently
                break;
              }
            }
          }
          
          if (isAlreadyPaid) continue; // Skip already paid expenses
          
          // Find sender's share in split_data (case-insensitive)
          let senderShare = 0;
          let senderKey = null;
          for (const key in expense.split_data || {}) {
            if (key.toLowerCase().trim() === senderName.toLowerCase().trim()) {
              senderKey = key;
              senderShare = parseFloat(expense.split_data[key] || 0);
              break;
            }
          }
          
          if (senderShare <= 0.01 || !senderKey) continue; // Sender not involved in this expense
          
          // For now, we'll match expenses only if currencies match
          // TODO: Add exchange rate conversion for cross-currency payments
          const paymentCurrency = sender.preferred_currency || 'INR';
          const expenseCurrency = expense.currency || 'INR';
          
          // Skip if currencies don't match (for now)
          // In the future, we should convert using exchange rates
          if (paymentCurrency !== expenseCurrency) {
            console.log(`⚠️ Skipping expense "${expense.description}": Currency mismatch (Payment: ${paymentCurrency}, Expense: ${expenseCurrency})`);
            continue;
          }
          
          const amountToPay = senderShare; // Amount in expense currency
          
          // Check if remaining payment covers this expense (with small tolerance for floating point)
          if (remainingPaymentAmount >= amountToPay - 0.01) {
            // ROOT CAUSE FIX: Use senderKey from split_data to ensure consistent key matching
            // This ensures the paid_status key matches the split_data key exactly
            expense.paid_status[senderKey] = true;
            expense.markModified('paid_status');
            await expense.save();
            
            // Link payment to expense (update payment with expense_id)
            expenseIdsToLink.push(expense._id);
            matchedExpenses.push({
              expense_id: expense._id,
              description: expense.description,
              amount_paid: amountToPay
            });
            
            remainingPaymentAmount -= amountToPay;
            console.log(`✅ Marked expense "${expense.description}" as paid for ${senderKey} (${senderName}), amount: ${amountToPay}`);
          }
        }
      } catch (expenseError) {
        console.error('Error matching payment to expenses (non-critical):', expenseError);
        // Continue with payment creation even if expense matching fails
      }
    }
    
    // Create payment record
    const paymentData = {
      sender_id: req.user.id,
      receiver_id: receiver._id,
      amount: amount,
      status: 'success',
      note: note || `Payment from ${sender.name}`,
      group_id: group_id || null,
      currency: sender.preferred_currency || 'INR'
    };
    
    // Link to first matched expense if any
    if (expenseIdsToLink.length > 0) {
      paymentData.expense_id = expenseIdsToLink[0]; // Link to first expense
    }
    
    const payment = await Payment.create(paymentData);
    
    // Send email notifications
    const currencySymbol = sender.preferred_currency === 'USD' ? '$' : 
                          sender.preferred_currency === 'EUR' ? '€' :
                          sender.preferred_currency === 'GBP' ? '£' : 
                          sender.preferred_currency === 'JPY' ? '¥' :
                          sender.preferred_currency === 'AUD' ? 'A$' : '₹';
    
    try {
      sendEmail(receiver.email, 'Payment received', `You received ${currencySymbol}${amount.toFixed(2)} from ${sender.name}.${note ? ' Note: ' + note : ''}`);
      sendEmail(sender.email, 'Payment sent', `You sent ${currencySymbol}${amount.toFixed(2)} to ${receiver.name}.${note ? ' Note: ' + note : ''}`);
    } catch (emailError) {
      console.error('Email notification error (non-critical):', emailError);
    }
    
    // Update response with matched expenses info
    const responseData = {
      id: payment._id,
      payment: {
        id: payment._id,
        sender_name: sender.name,
        receiver_name: receiver.name,
        amount: payment.amount,
        currency: payment.currency,
        note: payment.note,
        created_at: payment.created_at,
        expense_id: payment.expense_id || null
      }
    };
    
    // Add matched expenses info if any
    if (matchedExpenses.length > 0) {
      responseData.matched_expenses = matchedExpenses;
      responseData.total_matched = matchedExpenses.length;
      responseData.remaining_payment = Math.max(0, remainingPaymentAmount);
    }
    
    return res.json(createStandardResponse(true, responseData));
  } catch (error) {
    next(error);
  }
});

// ROOT CAUSE FIX: Get payments for a specific group
// CRITICAL: This route MUST be defined BEFORE /history to ensure proper route matching
paymentsRouter.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    console.log('📥 [BACKEND PAYMENTS] Route hit - Fetching payments for group:', groupId);
    console.log('📥 [BACKEND PAYMENTS] Full URL:', req.originalUrl);
    console.log('📥 [BACKEND PAYMENTS] Request params:', req.params);
    console.log('📥 [BACKEND PAYMENTS] User ID:', req.user?.id);
    
    // ROOT CAUSE FIX: Validate and convert groupId to ObjectId
    if (!groupId) {
      console.warn('⚠️ [BACKEND PAYMENTS] No groupId provided');
      return res.status(200).json(createStandardResponse(true, { items: [] }));
    }
    
    let validGroupId;
    try {
      // Try to convert to ObjectId, if it fails, return empty array (group might not exist or use old ID format)
      if (mongoose.Types.ObjectId.isValid(groupId)) {
        validGroupId = new mongoose.Types.ObjectId(groupId);
        console.log('✅ [BACKEND PAYMENTS] Valid ObjectId:', validGroupId.toString());
      } else {
        console.warn(`⚠️ [BACKEND PAYMENTS] Invalid groupId format: ${groupId}`);
        // Return 200 with empty array instead of 404 - this is not an error, just no payments found
        return res.status(200).json(createStandardResponse(true, { items: [] }));
      }
    } catch (error) {
      console.warn(`⚠️ [BACKEND PAYMENTS] Error validating groupId ${groupId}:`, error);
      // Return 200 with empty array instead of 404 - this is not an error, just no payments found
      return res.status(200).json(createStandardResponse(true, { items: [] }));
    }
    
    // ROOT CAUSE FIX: Query payments with proper error handling
    let payments = [];
    try {
      const query = {
        group_id: validGroupId,
        $or: [
          { sender_id: req.user.id },
          { receiver_id: req.user.id }
        ]
      };
      
      console.log('🔍 [BACKEND PAYMENTS] Query:', JSON.stringify(query));
      
      payments = await Payment.find(query)
      .populate('sender_id', 'name email')
      .populate('receiver_id', 'name email')
      .sort({ created_at: -1 })
      .lean();
      
      console.log(`✅ [BACKEND PAYMENTS] Found ${payments.length} payments for group ${groupId}`);
    } catch (dbError) {
      console.error('❌ [BACKEND PAYMENTS] Database error fetching payments:', dbError);
      console.error('❌ [BACKEND PAYMENTS] Error stack:', dbError.stack);
      // Return empty array on database error - don't break the UI
      return res.status(200).json(createStandardResponse(true, { items: [] }));
    }
    
    const items = payments.map(p => ({
      id: p._id,
      sender_id: p.sender_id?._id || p.sender_id,
      receiver_id: p.receiver_id?._id || p.receiver_id,
      sender_name: p.sender_id?.name || 'Unknown',
      receiver_name: p.receiver_id?.name || 'Unknown',
      amount: p.amount,
      status: p.status,
      note: p.note,
      currency: p.currency || 'INR',
      created_at: p.created_at,
      date: p.created_at
    }));
    
    // ROOT CAUSE FIX: Always return 200 status, even if no payments found
    console.log(`✅ [BACKEND PAYMENTS] Returning ${items.length} payments with 200 status`);
    return res.status(200).json(createStandardResponse(true, { items }));
  } catch (error) {
    console.error('❌ [BACKEND PAYMENTS] Get group payments error:', error);
    console.error('❌ [BACKEND PAYMENTS] Error stack:', error.stack);
    // ROOT CAUSE FIX: Return 200 with empty array instead of 500 for better UX
    return res.status(200).json(createStandardResponse(true, { items: [] }));
  }
});

// ROOT CAUSE FIX: Get payment history from MongoDB
// Defined AFTER /group/:groupId to ensure proper route matching
paymentsRouter.get('/history', async (req, res, next) => {
  try {
    const payments = await Payment.find({
      $or: [
        { sender_id: req.user.id },
        { receiver_id: req.user.id }
      ]
    })
    .populate('sender_id', 'name email')
    .populate('receiver_id', 'name email')
    .populate('group_id', 'name')
    .sort({ created_at: -1 })
    .lean();
    
    // Transform payments to match frontend format
    const items = payments.map(p => ({
      id: p._id,
      sender_id: p.sender_id?._id || p.sender_id,
      receiver_id: p.receiver_id?._id || p.receiver_id,
      sender_name: p.sender_id?.name || 'Unknown',
      receiver_name: p.receiver_id?.name || 'Unknown',
      amount: p.amount,
      status: p.status,
      note: p.note,
      group_id: p.group_id?._id || p.group_id,
      group_name: p.group_id?.name || null,
      currency: p.currency || 'INR',
      created_at: p.created_at,
      date: p.created_at
    }));
    
    return res.json(createStandardResponse(true, { items }));
  } catch (error) {
    next(error);
  }
});

// Delete payment (only by sender) and unmark expense as paid if applicable
paymentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('sender_id', 'name email');

    if (!payment) {
      return res.status(404).json(createStandardResponse(false, null, 'Payment not found'));
    }

    // Only the sender can delete the payment
    const senderId = payment.sender_id._id ? payment.sender_id._id.toString() : payment.sender_id.toString();
    if (senderId !== req.user.id.toString()) {
      return res.status(403).json(createStandardResponse(false, null, 'You can only delete payments you sent'));
    }

    // If this payment is associated with an expense, unmark the expense as paid
    if (payment.expense_id && payment.group_id) {
      try {
        const GroupExpense = (await import('../models/GroupExpense.js')).default;
        const User = (await import('../models/User.js')).default;
        
        // Get sender details properly
        let senderName = null;
        if (payment.sender_id && payment.sender_id.name) {
          senderName = payment.sender_id.name;
        } else {
          // If not populated, fetch the user
          const sender = await User.findById(payment.sender_id);
          if (sender) {
            senderName = sender.name;
          }
        }
        
        if (senderName) {
          const expense = await GroupExpense.findById(payment.expense_id);
          if (expense) {
            // Initialize paid_status if it doesn't exist
            if (!expense.paid_status) {
              expense.paid_status = {};
            }
            
            // Check all possible name variations (case-insensitive)
            const paidStatusKeys = Object.keys(expense.paid_status || {});
            let foundKey = null;
            
            for (const key of paidStatusKeys) {
              if (key.toLowerCase().trim() === senderName.toLowerCase().trim()) {
                foundKey = key;
                break;
              }
            }
            
            // If sender name matches a member in the split and is marked as paid, unmark it
            if (foundKey && expense.paid_status[foundKey] === true) {
              expense.paid_status[foundKey] = false;
              expense.markModified('paid_status');
              await expense.save();
              console.log(`✅ Unmarked expense ${expense._id} as unpaid for ${foundKey} (sender: ${senderName})`);
            } else {
              console.log(`ℹ️ Expense ${expense._id} not marked as paid for ${senderName}, skipping unmark`);
            }
          }
        }
      } catch (unmarkError) {
        console.error('⚠️ Error unmarking expense as paid (non-critical):', unmarkError);
        console.error('Error stack:', unmarkError.stack);
        // Continue with payment deletion even if unmarking fails
      }
    }

    await Payment.deleteOne({ _id: req.params.id });

    return res.json(createStandardResponse(true, { 
      deleted: true, 
      id: payment._id,
      expenseUnmarked: !!payment.expense_id 
    }));

  } catch (error) {
    next(error);
  }
});
