import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const supportAgentSchema = new mongoose.Schema({
  // ── Credentials ──────────────────────────────────────────────────────────────
  accessToken:   { type: String, required: true, unique: true, uppercase: true }, // e.g. SW-9939
  tempPassword:  { type: String, required: true },    // bcrypt hashed, used only on first login
  password:      { type: String, default: null },      // bcrypt hashed, set by agent on first login
  isActivated:   { type: Boolean, default: false },    // true after password changed + profile set
  needsPasswordChange: { type: Boolean, default: true },
  needsProfileSetup:   { type: Boolean, default: true },

  // ── Profile ───────────────────────────────────────────────────────────────────
  name:          { type: String, default: null },
  email:         { type: String, default: null, lowercase: true },
  role:          { type: String, enum: ['support_agent','senior_agent','team_lead','admin'], default: 'support_agent' },
  avatarColor:   { type: String, default: '#667eea' },

  // ── Status ────────────────────────────────────────────────────────────────────
  isActive:      { type: Boolean, default: true },
  lastLoginAt:   { type: Date,   default: null },
  lastLoginIP:   { type: String, default: null },

  // ── OTP (password-reset via email) ───────────────────────────────────────────
  otpCode:       { type: String, default: null },   // 6-digit, stored as bcrypt hash
  otpExpiry:     { type: Date,   default: null },   // 2-minute expiry

}, { timestamps: true });

// Hash password before save
supportAgentSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.isModified('tempPassword') && this.tempPassword) {
    this.tempPassword = await bcrypt.hash(this.tempPassword, 10);
  }
  next();
});

supportAgentSchema.methods.verifyTempPassword = function(plain) {
  return bcrypt.compare(plain, this.tempPassword);
};
supportAgentSchema.methods.verifyPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('SupportAgent', supportAgentSchema);
