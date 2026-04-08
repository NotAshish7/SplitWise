import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: ['forgot-password', 'email-verification', 'two-factor']
  },
  expires_at: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'created_at'
  }
});

// Index for expiration
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;


