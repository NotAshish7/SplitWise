import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
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
  category: {
    type: String,
    required: true
  },
  spent_at: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Index for faster user lookups
expenseSchema.index({ user_id: 1, spent_at: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;


