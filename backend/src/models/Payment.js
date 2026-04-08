import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  },
  note: {
    type: String,
    default: null
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  expense_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupExpense',
    default: null
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ sender_id: 1, created_at: -1 });
paymentSchema.index({ receiver_id: 1, created_at: -1 });
paymentSchema.index({ group_id: 1 });

export default mongoose.model('Payment', paymentSchema);

