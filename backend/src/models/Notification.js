import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['expense_added', 'expense_edited', 'expense_deleted', 'payment_marked', 'member_added', 'member_removed', 'group_deleted']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  expense_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupExpense'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user_id: 1, createdAt: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

