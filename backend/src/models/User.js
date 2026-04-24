import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  preferred_currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD'] // ROOT CAUSE FIX: Added JPY and AUD to match frontend and validation
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark']
  },
  sidebar_collapsed: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  profile_picture: {
    type: String,
    default: null
  },
  google_id: {
    type: String,
    default: null,
    sparse: true // Allow multiple null values but unique non-null values
  },
  facebook_id: {
    type: String,
    default: null,
    sparse: true
  },
  password_history: [{
    hash: String,
    changed_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Note: email index is created automatically by unique: true
// google_id and facebook_id indexes are created automatically by sparse: true in schema

const User = mongoose.model('User', userSchema);

export default User;


