import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invite_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  members: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'left', 'removed'], // ROOT CAUSE FIX: Added 'removed' as valid enum value
      default: 'active'
    },
    joined_at: {
      type: Date,
      default: Date.now
    },
    left_at: {
      type: Date,
      default: null
    },
    removed_at: {
      type: Date,
      default: null
    },
    removed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Index for faster invite code lookups
groupSchema.index({ invite_code: 1 });
groupSchema.index({ owner_id: 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;


