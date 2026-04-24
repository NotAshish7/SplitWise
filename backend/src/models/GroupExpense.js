import mongoose from 'mongoose';

const groupExpenseSchema = new mongoose.Schema({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD']
  },
  paid_by: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  split_method: {
    type: String,
    enum: ['equal', 'select', 'percent', 'manual'],
    default: 'equal'
  },
  split_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  paid_status: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Legacy fields for backward compatibility
  payer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    trim: true
  },
  category: {
    type: String
  },
  spent_at: {
    type: Date
  },
  splits: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    paid: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster group lookups
groupExpenseSchema.index({ group_id: 1, date: -1 });
groupExpenseSchema.index({ group_id: 1, createdAt: -1 });

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);

export default GroupExpense;


