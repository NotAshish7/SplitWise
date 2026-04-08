import { Router } from 'express';
import jwt from 'jsonwebtoken';
import SupportAgent from '../models/SupportAgent.js';
import SupportTicket from '../models/SupportTicket.js';
import { sendSupportEmail, sendEmail } from '../utils/mailer.js';
import { createStandardResponse } from '../utils/responses.js';
import { broadcast } from '../utils/sseEmitter.js';

export const supportRouter = Router();

const BRAND   = process.env.MAIL_FROM_NAME || 'SplitWise';
const JWT_SECRET = process.env.SUPPORT_JWT_SECRET || process.env.JWT_SECRET || 'support-jwt-secret';
const ADMIN_TOKEN = process.env.SUPPORT_DASHBOARD_TOKEN;

// ── JWT helpers ───────────────────────────────────────────────────────────────
function signToken(agent, expiresIn = '12h') {
  return jwt.sign(
    { id: agent._id, accessToken: agent.accessToken, name: agent.name,
      needsPasswordChange: agent.needsPasswordChange, needsProfileSetup: agent.needsProfileSetup },
    JWT_SECRET, { expiresIn }
  );
}

function requireAgent(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.replace(/^Bearer\s+/i, '').trim() || req.query.token;
  if (!token) return res.status(401).json(createStandardResponse(false, null, 'No auth token'));
  try {
    req.agent = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json(createStandardResponse(false, null, 'Token expired or invalid')); }
}

function requireActivated(req, res, next) {
  if (req.agent.needsPasswordChange) return res.status(403).json(createStandardResponse(false, null, 'Password change required', { step: 'change_password' }));
  if (req.agent.needsProfileSetup)   return res.status(403).json(createStandardResponse(false, null, 'Profile setup required', { step: 'setup_profile' }));
  next();
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.replace(/^Bearer\s+/i, '').trim() || req.query.token;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json(createStandardResponse(false, null, 'Admin access required'));
  }
  next();
}

// ── Admin: create access token (manual) ───────────────────────────────────────
supportRouter.post('/admin/create-token', requireAdmin, async (req, res) => {
  try {
    const { accessToken, tempPassword } = req.body;
    if (!accessToken || !tempPassword)
      return res.status(400).json(createStandardResponse(false, null, 'accessToken and tempPassword required'));

    const exists = await SupportAgent.findOne({ accessToken: accessToken.toUpperCase() });
    if (exists)
      return res.status(409).json(createStandardResponse(false, null, 'Token already exists'));

    const agent = new SupportAgent({ accessToken: accessToken.toUpperCase(), tempPassword });
    await agent.save();
    res.json(createStandardResponse(true, { accessToken: agent.accessToken, created: true }));
  } catch (err) {
    console.error('Create token error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── Admin: AUTO-GENERATE random token + password ───────────────────────────────
supportRouter.post('/admin/generate-token', requireAdmin, async (req, res) => {
  try {
    // Generate unique SW-XXXX token
    let accessToken, attempts = 0;
    do {
      const num = Math.floor(1000 + Math.random() * 9000);
      accessToken = `SW-${num}`;
      attempts++;
    } while (await SupportAgent.findOne({ accessToken }) && attempts < 20);

    // Generate secure 12-char password: 2 upper + 2 digits + 2 symbols + rest lower
    const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower  = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const syms   = '!@#$%&*';
    const rand   = (s) => s[Math.floor(Math.random() * s.length)];
    const parts  = [rand(upper), rand(upper), rand(digits), rand(digits),
                    rand(syms), rand(lower), rand(lower), rand(lower),
                    rand(lower), rand(lower), rand(upper), rand(digits)];
    // Shuffle
    const tempPassword = parts.sort(() => Math.random() - 0.5).join('');

    const agent = new SupportAgent({ accessToken, tempPassword });
    await agent.save();

    res.json(createStandardResponse(true, {
      accessToken, tempPassword,
      message: `Share these credentials with the agent. Password shown only once.`,
    }));
  } catch (err) {
    console.error('Generate token error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── Admin: setup admin account (multi-admin via same SUPPORT_DASHBOARD_TOKEN) ──
// Same key can create multiple admins — email must be unique per admin.
supportRouter.post('/admin/setup-admin', requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !password || password.length < 8)
      return res.status(400).json(createStandardResponse(false, null,
        'name and password (min 8 chars) required'));

    // Email uniqueness check — no two accounts may share the same email
    if (email) {
      const emailTaken = await SupportAgent.findOne({ email: email.trim().toLowerCase() });
      if (emailTaken)
        return res.status(409).json(createStandardResponse(false, null,
          'An account with this email already exists. Use a different email.'));
    }

    // Auto-generate sequential ADMIN-XXX token
    const allAdmins = await SupportAgent.find({ role: 'admin' }, { accessToken: 1 }).lean();
    const maxNum = allAdmins.reduce((max, a) => {
      const m = /^ADMIN-(\d+)$/.exec(a.accessToken || '');
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    const accessToken = `ADMIN-${String(maxNum + 1).padStart(3, '0')}`;

    const agent = new SupportAgent({
      accessToken,
      tempPassword: password,
      password,
      needsPasswordChange: false,
      needsProfileSetup:   false,
      isActivated:         true,
      name:  name.trim(),
      email: email?.trim().toLowerCase() || '',
      role:  'admin',
      avatarColor: '#667eea',
    });
    await agent.save();

    res.json(createStandardResponse(true, {
      accessToken: agent.accessToken,
      message: `Admin account created! Token: ${agent.accessToken}. Login with this token and your password.`,
    }));
  } catch (err) {
    console.error('Setup admin error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── Admin: create additional admin (called by logged-in admin) ─────────────────
// Allows creating ADMIN-002, ADMIN-003, etc. Protected by JWT admin session.
supportRouter.post('/admin/create-admin', requireAgent, async (req, res) => {
  try {
    // Only existing admins can create more admins
    const caller = await SupportAgent.findById(req.agent.id, { role: 1 }).lean();
    if (!caller || caller.role !== 'admin')
      return res.status(403).json(createStandardResponse(false, null, 'Only admins can create additional admin accounts'));

    const { name, email, password } = req.body;
    if (!name || !password || password.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'name and password (min 8 chars) required'));

    // Email uniqueness check
    if (email) {
      const emailTaken = await SupportAgent.findOne({ email: email.trim().toLowerCase() });
      if (emailTaken)
        return res.status(409).json(createStandardResponse(false, null,
          'An account with this email already exists. Use a different email.'));
    }

    // Auto-generate sequential ADMIN-XXX token
    const existingAdmins = await SupportAgent.find({ role: 'admin' }, { accessToken: 1 }).lean();
    const maxNum = existingAdmins.reduce((max, a) => {
      const m = /^ADMIN-(\d+)$/.exec(a.accessToken || '');
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    const accessToken = `ADMIN-${String(maxNum + 1).padStart(3, '0')}`;

    const existing = await SupportAgent.findOne({ accessToken });
    if (existing)
      return res.status(409).json(createStandardResponse(false, null, `Token ${accessToken} already exists`));

    const agent = new SupportAgent({
      accessToken,
      tempPassword: password,
      password,
      needsPasswordChange: false,
      needsProfileSetup:   false,
      isActivated:         true,
      name:  name.trim(),
      email: email?.trim().toLowerCase() || '',
      role:  'admin',
      avatarColor: '#c53030',
    });
    await agent.save();

    // Send welcome email to the new admin
    try {
      const P = '#c53030', V = '#744210';
      const welcomeHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f7">
<tr><td align="center" style="padding:36px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.1);margin:0 auto">
  <tr><td style="background:linear-gradient(135deg,#c53030,#744210);padding:32px 24px 26px;text-align:center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
      <tr><td align="center"
              style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                     border-radius:18px;padding:14px 24px;">
        <div style="font-size:34px;line-height:1;margin-bottom:8px;">🛡️</div>
        <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;font-family:Arial,sans-serif;white-space:nowrap;">${BRAND} Support</div>
      </td></tr>
    </table>
    <h1 style="margin:0 0 4px;color:#fff;font-size:21px;font-weight:900;font-family:Arial,sans-serif;">Admin Account Created</h1>
    <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Admin Access — ${BRAND} Portal</p>
  </td></tr>
  <tr><td style="padding:32px 36px">
    <p style="margin:0 0 8px;font-size:16px;color:#1e293b">Hi <strong>${name.trim()}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7">An admin account has been created for you on the <strong>${BRAND} Support Portal</strong>. Use the credentials below to sign in.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr><td style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;padding:20px 22px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:900;color:#c53030;text-transform:uppercase;letter-spacing:1.5px">Your Admin Credentials</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#64748b;font-weight:700;padding:4px 0;width:110px">Admin Token</td>
            <td style="font-size:14px;color:#1e293b;font-weight:900;font-family:'Courier New',monospace;padding:4px 0">
              <span style="background:#fef2f2;padding:3px 10px;border-radius:6px;color:#c53030">${accessToken}</span>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;font-weight:700;padding:4px 0">Role</td>
            <td style="font-size:13px;color:#1e293b;padding:4px 0">🛡️ Admin</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
      <tr><td style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:14px 18px">
        <p style="margin:0;font-size:13px;color:#c2410c;font-weight:700">🔒 Keep your Admin Token and password secret. Do not share with unauthorized personnel.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center">
    <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">${BRAND} Support Team &bull; Automated Notification</p>
    <p style="margin:0;font-size:11px;color:#cbd5e1">This email was sent from a no-reply address. Please do not reply.</p>
  </td></tr>
</table></td></tr></table></body></html>`;

      if (email) {
        await sendEmail(email.trim().toLowerCase(), `Your ${BRAND} Admin Account is Ready`, `Hi ${name.trim()},\n\nYour admin account has been created.\nAdmin Token: ${accessToken}\nRole: Admin\n\nUse your admin token and the password set for you to login at the admin portal.\n\n— The ${BRAND} Support Team`, welcomeHtml);
      }
    } catch (mailErr) {
      console.warn('Admin welcome email failed (non-critical):', mailErr.message);
    }

    res.json(createStandardResponse(true, {
      accessToken: agent.accessToken,
      name: agent.name,
      email: agent.email,
      role: 'admin',
      message: `Admin ${name.trim()} created with token ${accessToken}.`,
    }));
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── Admin: list all tokens ────────────────────────────────────────────────────
supportRouter.get('/admin/tokens', requireAdmin, async (req, res) => {
  try {
    const agents = await SupportAgent.find({}, { tempPassword: 0, password: 0 }).lean();
    res.json(createStandardResponse(true, agents));
  } catch (err) {
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── Admin: send test email ────────────────────────────────────────────────────
supportRouter.post('/admin/test-email', requireAgent, async (req, res) => {
  try {
    const caller = await SupportAgent.findById(req.agent.id, { role: 1, name: 1 }).lean();
    if (!caller || caller.role !== 'admin')
      return res.status(403).json(createStandardResponse(false, null, 'Admin access required'));

    const { email } = req.body;
    if (!email) return res.status(400).json(createStandardResponse(false, null, 'email is required'));

    const P = '#667eea', V = '#764ba2';
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f7">
<tr><td align="center" style="padding:36px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,.15);margin:0 auto">
  <tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 24px 22px;text-align:center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
      <tr><td align="center"
              style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                     border-radius:18px;padding:14px 24px;">
        <div style="font-size:32px;line-height:1;margin-bottom:8px;">⚡</div>
        <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;font-family:Arial,sans-serif;white-space:nowrap;">${BRAND} Support</div>
      </td></tr>
    </table>
    <h1 style="margin:0 0 4px;color:#fff;font-size:20px;font-weight:900;font-family:Arial,sans-serif;">${BRAND} — Email Delivery Test</h1>
    <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">SMTP Configuration Verified</p>
  </td></tr>
  <tr><td style="padding:28px 36px">
    <p style="margin:0 0 14px;color:#1e293b;font-size:15px">Your <strong>${BRAND}</strong> email configuration is working correctly!</p>
    <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.7">This test was triggered by <strong>${caller.name || 'Admin'}</strong> from the Support Dashboard.</p>
    <p style="margin:0;color:#94a3b8;font-size:12px">If you did not expect this, someone with admin access sent a test from the dashboard.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;text-align:center">
    <p style="margin:0;font-size:11px;color:#cbd5e1">${BRAND} Support Team &bull; This email was sent from a no-reply address.</p>
  </td></tr>
</table></td></tr></table></body></html>`;

    await sendEmail(email, `${BRAND} — Email Delivery Test`, `Your ${BRAND} email configuration is working correctly! This test was triggered from the Support Dashboard.`, html);
    res.json(createStandardResponse(true, { message: `Test email sent to ${email}` }));
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json(createStandardResponse(false, null, `Email failed: ${err.message}`));
  }
});

// ── Admin: reset admin password (recovery) ────────────────────────────────────
supportRouter.post('/admin/reset-admin-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'newPassword (min 8 chars) required'));
    const admin = await SupportAgent.findOne({ role: 'admin' });
    if (!admin) return res.status(404).json(createStandardResponse(false, null, 'No admin account found.'));
    admin.password = newPassword;
    admin.needsPasswordChange = false;
    admin.needsProfileSetup   = false;
    admin.isActivated         = true;
    await admin.save();
    res.json(createStandardResponse(true, { accessToken: admin.accessToken, message: 'Admin password reset successfully.' }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── OTP helpers ────────────────────────────────────────────────────────────────
function genOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function otpEmailHtml(otp, name) {
  const P = '#667eea', V = '#764ba2';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f7">
<tr><td align="center" style="padding:36px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,.15);margin:0 auto">
  <tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 24px 26px;text-align:center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
      <tr><td align="center"
              style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                     border-radius:18px;padding:14px 24px;">
        <div style="font-size:32px;line-height:1;margin-bottom:8px;">🔑</div>
        <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;font-family:Arial,sans-serif;white-space:nowrap;">${BRAND} Support</div>
      </td></tr>
    </table>
    <h1 style="margin:0 0 6px;color:#fff;font-size:20px;font-weight:900;font-family:Arial,sans-serif;">Password Reset — One-Time Code</h1>
    <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Security Verification</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px 36px">
    <p style="margin:0 0 10px;font-size:16px;color:#1e293b">Hi <strong>${name || 'Team Member'}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7">We received a request to reset your <strong>${BRAND} Support Portal</strong> account password. Use the code below to proceed. This code is valid for <strong>2 minutes only</strong>.</p>
    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td align="center">
        <div style="display:inline-block;background:linear-gradient(135deg,${P},${V});border-radius:16px;padding:20px 36px">
          <span style="font-size:38px;font-weight:900;color:#fff;letter-spacing:14px;font-family:'Courier New',monospace">${otp}</span>
        </div>
      </td></tr>
    </table>
    <!-- Expiry warning -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:14px 18px;text-align:center">
        <p style="margin:0;font-size:13px;color:#dc2626;font-weight:700">⏰ This code expires in 2 minutes. Do not share it with anyone.</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center">
    <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">${BRAND} Support Team &bull; Automated Security Email</p>
    <p style="margin:0;font-size:11px;color:#cbd5e1">This email was sent from a no-reply address. Please do not reply to this email.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Agent: request OTP (no master key needed) ─────────────────────────────────
supportRouter.post('/auth/request-otp', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json(createStandardResponse(false, null, 'accessToken required'));
    const agent = await SupportAgent.findOne({ accessToken: accessToken.toUpperCase() });
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'No agent found with that access token'));
    if (!agent.email) return res.status(400).json(createStandardResponse(false, null,
      'No email on file. Ask your admin to reset your password manually.'));
    const otp = genOTP();
    agent.otpCode   = otp;
    agent.otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
    await agent.save();
    await sendEmail(agent.email, 'Support Portal — Password Reset OTP',
      `Your OTP is: ${otp}\n\nValid for 2 minutes. Do not share this code.`,
      otpEmailHtml(otp, agent.name));
    res.json(createStandardResponse(true, {
      email: agent.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
      message: 'OTP sent to your registered email.',
    }));
  } catch (err) { console.error('Request OTP:', err); res.status(500).json(createStandardResponse(false, null, 'Failed to send OTP')); }
});

// ── Agent: verify OTP + set new password ─────────────────────────────────────
supportRouter.post('/auth/verify-otp-reset', async (req, res) => {
  try {
    const { accessToken, otp, newPassword } = req.body;
    if (!accessToken || !otp || !newPassword || newPassword.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'accessToken, otp, and newPassword (min 8) required'));
    const agent = await SupportAgent.findOne({ accessToken: accessToken.toUpperCase() });
    if (!agent || !agent.otpCode || !agent.otpExpiry)
      return res.status(400).json(createStandardResponse(false, null, 'No OTP found. Request a new one.'));
    if (new Date() > agent.otpExpiry)
      return res.status(400).json(createStandardResponse(false, null, 'OTP has expired. Request a new one.'));
    if (agent.otpCode !== otp.toString().trim())
      return res.status(400).json(createStandardResponse(false, null, 'Incorrect OTP.'));
    agent.password = newPassword;
    agent.otpCode  = null; agent.otpExpiry = null;
    agent.needsPasswordChange = false; agent.isActivated = true;
    await agent.save();
    res.json(createStandardResponse(true, { message: 'Password reset. You can now log in.' }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Admin: request OTP via master key ─────────────────────────────────────────
supportRouter.post('/admin/request-admin-otp', requireAdmin, async (req, res) => {
  try {
    const admin = await SupportAgent.findOne({ role: 'admin' });
    if (!admin) return res.status(404).json(createStandardResponse(false, null, 'Admin not set up.'));
    if (!admin.email) return res.status(400).json(createStandardResponse(false, null,
      'No email on record. Use the master-key direct reset instead.'));
    const otp = genOTP();
    admin.otpCode = otp; admin.otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
    await admin.save();
    await sendEmail(admin.email, 'Admin Portal — Password Reset OTP',
      `Your admin OTP is: ${otp}\n\nValid for 2 minutes.`,
      otpEmailHtml(otp, admin.name || 'Admin'));
    res.json(createStandardResponse(true, {
      email: admin.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
      message: 'OTP sent to admin email.',
    }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Failed to send OTP')); }
});

// ── Admin: verify OTP + reset password ────────────────────────────────────────
supportRouter.post('/admin/verify-admin-otp-reset', requireAdmin, async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword || newPassword.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'otp and newPassword (min 8) required'));
    const admin = await SupportAgent.findOne({ role: 'admin' });
    if (!admin || !admin.otpCode || !admin.otpExpiry)
      return res.status(400).json(createStandardResponse(false, null, 'No OTP found. Request a new one.'));
    if (new Date() > admin.otpExpiry)
      return res.status(400).json(createStandardResponse(false, null, 'OTP expired.'));
    if (admin.otpCode !== otp.toString().trim())
      return res.status(400).json(createStandardResponse(false, null, 'Incorrect OTP.'));
    admin.password = newPassword; admin.otpCode = null; admin.otpExpiry = null;
    await admin.save();
    res.json(createStandardResponse(true, { message: 'Admin password reset. Log in with new password.' }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Admin: block/unblock agent ────────────────────────────────────────────────
supportRouter.patch('/admin/agents/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const agent = await SupportAgent.findById(req.params.id);
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'Agent not found'));
    if (agent.role === 'admin') return res.status(403).json(createStandardResponse(false, null, 'Cannot block admin'));
    agent.isActive = !agent.isActive;
    await agent.save();
    res.json(createStandardResponse(true, { id: agent._id, accessToken: agent.accessToken, isActive: agent.isActive,
      message: `Agent ${agent.isActive ? 'unblocked' : 'blocked'} successfully` }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Admin: delete agent ───────────────────────────────────────────────────────
supportRouter.delete('/admin/agents/:id', requireAdmin, async (req, res) => {
  try {
    const agent = await SupportAgent.findById(req.params.id);
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'Agent not found'));
    if (agent.role === 'admin') return res.status(403).json(createStandardResponse(false, null, 'Cannot delete admin'));
    await SupportAgent.findByIdAndDelete(req.params.id);
    res.json(createStandardResponse(true, { message: `Agent ${agent.accessToken} deleted` }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Admin: reset agent password (recovery using master key) ──────────────────
supportRouter.post('/admin/reset-agent-password', requireAdmin, async (req, res) => {
  try {
    const { accessToken, newPassword } = req.body;
    if (!accessToken || !newPassword || newPassword.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'accessToken and newPassword (min 8 chars) required'));

    const agent = await SupportAgent.findOne({ accessToken: accessToken.toUpperCase() });
    if (!agent)
      return res.status(404).json(createStandardResponse(false, null, 'Agent not found with that token'));

    agent.password = newPassword;        // pre-save hook hashes it
    agent.needsPasswordChange = false;
    agent.isActivated = true;
    await agent.save();

    res.json(createStandardResponse(true, {
      accessToken: agent.accessToken,
      name: agent.name,
      message: `Password reset for ${agent.name || agent.accessToken}. They can now log in.`,
    }));
  } catch (err) {
    console.error('Reset agent password error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── Public: stats (used on landing page — no auth required) ───────────────────
supportRouter.get('/stats', async (_req, res) => {
  try {
    const [open, inProgress, resolved, closed] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
    ]);
    res.json(createStandardResponse(true, { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Public: active agent count (used on landing page) ────────────────────────
supportRouter.get('/agents', async (_req, res) => {
  try {
    const agents = await SupportAgent.find({ isActive: true, role: { $ne: 'admin' } }, 'accessToken name role avatarColor');
    res.json(createStandardResponse(true, agents));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── STEP 1: Login (token + temp or permanent password) ────────────────────────
supportRouter.post('/auth/login', async (req, res) => {
  try {
    const { accessToken, password } = req.body;
    if (!accessToken || !password)
      return res.status(400).json(createStandardResponse(false, null, 'Access token and password are required'));

    const agent = await SupportAgent.findOne({ accessToken: accessToken.toUpperCase() });
    if (!agent)
      return res.status(401).json(createStandardResponse(false, null, 'Invalid access token'));
    if (!agent.isActive)
      return res.status(403).json(createStandardResponse(false, null, 'Account is disabled'));

    let valid = false;
    if (agent.needsPasswordChange) {
      // First login — try temp password
      valid = await agent.verifyTempPassword(password);
      if (!valid) return res.status(401).json(createStandardResponse(false, null, 'Invalid password'));
    } else {
      // Already activated — try permanent password
      valid = await agent.verifyPassword(password);
      if (!valid) return res.status(401).json(createStandardResponse(false, null, 'Invalid password'));
    }

    agent.lastLoginAt = new Date();
    agent.lastLoginIP = req.ip || req.connection?.remoteAddress || 'unknown';
    await agent.save();

    const tok = signToken(agent);
    return res.json(createStandardResponse(true, {
      token: tok,
      agent: { accessToken: agent.accessToken, name: agent.name, email: agent.email, role: agent.role, avatarColor: agent.avatarColor },
      needsPasswordChange: agent.needsPasswordChange,
      needsProfileSetup:   agent.needsProfileSetup,
      isActivated: agent.isActivated,
    }));
  } catch (err) {
    console.error('Support login error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── STEP 2: Change password (first-time activation) ───────────────────────────
supportRouter.post('/auth/change-password', requireAgent, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'Password must be at least 8 characters'));

    const agent = await SupportAgent.findById(req.agent.id);
    agent.password = newPassword;    // pre-save hook hashes it
    agent.needsPasswordChange = false;
    await agent.save();

    const tok = signToken(agent);
    res.json(createStandardResponse(true, {
      token: tok, needsProfileSetup: agent.needsProfileSetup,
    }));
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── STEP 3: Profile setup ─────────────────────────────────────────────────────
supportRouter.post('/auth/setup-profile', requireAgent, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email)
      return res.status(400).json(createStandardResponse(false, null, 'Name and email are required'));

    const agent = await SupportAgent.findById(req.agent.id);

    // Email uniqueness — ensure no other account uses this email
    if (email) {
      const emailTaken = await SupportAgent.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: agent._id }
      });
      if (emailTaken)
        return res.status(409).json(createStandardResponse(false, null,
          'This email is already in use by another account. Please use a different email.'));
    }

    agent.name              = name.trim();
    agent.email             = email.trim().toLowerCase();
    if (role) agent.role   = role;
    agent.needsProfileSetup = false;
    agent.isActivated       = !agent.needsPasswordChange;
    const colors = ['#667eea','#764ba2','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4'];
    agent.avatarColor = colors[Math.floor(Math.random() * colors.length)];
    await agent.save();

    // ── Send welcome email to the agent ───────────────────────────────────────
    try {
      const P = '#667eea', V = '#764ba2';
      const welcomeHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f7">
<tr><td align="center" style="padding:36px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,.15);margin:0 auto">
  <tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px 24px 26px;text-align:center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
      <tr><td align="center"
              style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                     border-radius:18px;padding:14px 24px;">
        <div style="font-size:32px;line-height:1;margin-bottom:8px;">🚀</div>
        <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;font-family:Arial,sans-serif;white-space:nowrap;">${BRAND} Support</div>
      </td></tr>
    </table>
    <h1 style="margin:0 0 6px;color:#fff;font-size:21px;font-weight:900;font-family:Arial,sans-serif;">Welcome to ${BRAND} Support!</h1>
    <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Account Successfully Activated</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px 36px">
    <p style="margin:0 0 8px;font-size:16px;color:#1e293b">Hi <strong>${agent.name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7">You have successfully completed your <strong>${BRAND} Support Portal</strong> account setup. You can now access your dashboard and start managing support tickets.</p>
    <!-- Access Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr><td style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-radius:14px;padding:20px 22px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:900;color:#4338ca;text-transform:uppercase;letter-spacing:1.5px">Your Portal Access</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#64748b;font-weight:700;padding:4px 0;width:110px">Access Token</td>
            <td style="font-size:14px;color:#1e293b;font-weight:900;font-family:'Courier New',monospace;padding:4px 0">
              <span style="background:#eef2ff;padding:3px 10px;border-radius:6px;color:#3730a3">${agent.accessToken}</span>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;font-weight:700;padding:4px 0">Role</td>
            <td style="font-size:13px;color:#1e293b;padding:4px 0">${agentRole.charAt(0).toUpperCase() + agentRole.slice(1)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;font-weight:700;padding:4px 0">Email</td>
            <td style="font-size:13px;color:#1e293b;padding:4px 0">${agent.email}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <!-- Warning -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr><td style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:14px 18px">
        <p style="margin:0;font-size:13px;color:#dc2626;font-weight:700">🔒 Keep your Access Token safe — it's required to log in and recover your password.</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:14px;color:#64748b">Welcome to the team! We're glad to have you on board. 🚀</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center">
    <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">${BRAND} Support Team &bull; Automated Notification</p>
    <p style="margin:0;font-size:11px;color:#cbd5e1">This email was sent from a no-reply address. Please do not reply to this email.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
      await sendEmail(
        agent.email,
        `Welcome to ${BRAND} Support — Account Activated!`,
        `Hi ${agent.name},\n\nYour ${BRAND} Support account is now active.\nAccess Token: ${agent.accessToken}\nRole: ${agentRole}\n\nKeep your access token safe — you'll need it to log in and recover your password.\n\nWelcome to the team!\n— The ${BRAND} Support Team`,
        welcomeHtml
      );
    } catch (mailErr) {
      console.warn('Welcome email failed (non-critical):', mailErr.message);
    }

    const tok = signToken(agent);
    res.json(createStandardResponse(true, {
      token: tok,
      agent: { accessToken: agent.accessToken, name: agent.name, email: agent.email, role: agent.role, avatarColor: agent.avatarColor },
      isActivated: true,
    }));
  } catch (err) {
    console.error('Profile setup error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── GET current agent profile ─────────────────────────────────────────────────
supportRouter.get('/auth/me', requireAgent, async (req, res) => {
  try {
    const agent = await SupportAgent.findById(req.agent.id, { tempPassword: 0, password: 0 }).lean();
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'Agent not found'));
    res.json(createStandardResponse(true, agent));
  } catch (err) {
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── All routes below require a fully activated agent ──────────────────────────
supportRouter.use(requireAgent, requireActivated);

// ── Stats ─────────────────────────────────────────────────────────────────────
supportRouter.get('/stats', async (req, res) => {
  try {
    const [open, inProgress, closed, urgent, unassigned, all] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments({ status: { $in: ['open','in_progress'] }, priority: 'urgent' }),
      SupportTicket.countDocuments({ status: { $in: ['open','in_progress'] }, assignedTo: null }),
      SupportTicket.find({ status: 'closed', closedAt: { $ne: null } }, { createdAt: 1, closedAt: 1 }),
    ]);
    let avgDays = 0;
    if (all.length) {
      avgDays = +((all.reduce((s,t) => s + (new Date(t.closedAt) - new Date(t.createdAt)), 0)
                  / all.length / 86400000).toFixed(1));
    }
    res.json(createStandardResponse(true, { open, inProgress, closed, urgent, unassigned, avgDays, total: open+inProgress }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Ticket list ───────────────────────────────────────────────────────────────
supportRouter.get('/tickets', async (req, res) => {
  try {
    const { status, priority, assignedTo, search='', sort='-createdAt', page=1, limit=30 } = req.query;
    const filter = {};
    if (status)     filter.status   = status;
    if (priority)   filter.priority = priority;
    if (assignedTo === 'unassigned') filter.assignedTo = null;
    else if (assignedTo) filter.assignedTo = assignedTo;
    if (search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [{ ticketId: re },{ name: re },{ email: re },{ subject: re }];
    }
    const skip = (Number(page)-1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort(sort).skip(skip).limit(Number(limit))
        .select('-replies -internalNotes -message -activityLog').lean(),
      SupportTicket.countDocuments(filter),
    ]);
    const now = Date.now();
    tickets.forEach(t => {
      const end = t.closedAt ? new Date(t.closedAt).getTime() : now;
      t.daysOpen = +((end - new Date(t.createdAt).getTime()) / 86400000).toFixed(1);
    });
    res.json(createStandardResponse(true, {
      tickets,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total/Number(limit)) },
    }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Single ticket ─────────────────────────────────────────────────────────────
supportRouter.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.id }).lean();
    if (!ticket) return res.status(404).json(createStandardResponse(false, null, 'Ticket not found'));
    const now = Date.now(), start = new Date(ticket.createdAt).getTime();
    const end = ticket.closedAt ? new Date(ticket.closedAt).getTime() : now;
    ticket.daysOpen = +((end - start) / 86400000).toFixed(1);
    res.json(createStandardResponse(true, ticket));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Update ticket (assign / priority / status) ────────────────────────────────
supportRouter.patch('/tickets/:id', async (req, res) => {
  try {
    const { assignedTo, priority, status, agent } = req.body;
    const agentName = req.agent.name || agent || 'Agent';
    const ticket = await SupportTicket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json(createStandardResponse(false, null, 'Ticket not found'));

    if (assignedTo !== undefined) {
      const prev = ticket.assignedTo;
      ticket.assignedTo = assignedTo || null;
      const action = prev ? 'transferred' : 'assigned';
      const detail = prev ? `Transferred from ${prev} to ${assignedTo||'nobody'}` : `Assigned to ${assignedTo}`;
      ticket.activityLog.push({ action, agent: agentName, detail });
    }
    if (priority && priority !== ticket.priority) {
      ticket.activityLog.push({ action: 'status_changed', agent: agentName, detail: `Priority changed to ${priority}` });
      ticket.priority = priority;
    }
    if (status && status !== ticket.status) {
      if (status === 'closed') {
        ticket.closedAt = new Date(); ticket.closedBy = agentName;
        // Send closed notification to user (noreply)
        const P = '#667eea', V = '#764ba2';
        const closedHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f7"><tr><td align="center" style="padding:36px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(16,185,129,.15);margin:0 auto">
  <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 24px 26px;text-align:center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
      <tr><td align="center"
              style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                     border-radius:18px;padding:14px 24px;">
        <div style="font-size:32px;line-height:1;margin-bottom:8px;">✅</div>
        <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;font-family:Arial,sans-serif;white-space:nowrap;">${BRAND} Support</div>
      </td></tr>
    </table>
    <h1 style="margin:0 0 4px;color:#fff;font-size:20px;font-weight:900;font-family:Arial,sans-serif;">${BRAND} Support</h1>
    <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Ticket Resolved</p>
  </td></tr>
  <tr><td style="padding:28px 36px">
    <h2 style="margin:0 0 12px;font-size:18px;font-weight:900;color:#1a1f36">Your ticket has been resolved, ${ticket.name}!</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.7">
      We've marked your support ticket as resolved. We hope your issue has been addressed!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(16,185,129,0.07),rgba(5,150,105,0.07));border:1.5px solid #6ee7b7;border-radius:16px;margin-bottom:20px">
      <tr>
        <td style="padding:16px 20px">
          <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:2px">Closed Ticket</p>
          <p style="margin:0;font-size:22px;font-weight:900;color:#065f46;font-family:'Courier New',monospace;letter-spacing:4px">${ticket.ticketId}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6c757d">Subject: <strong>${ticket.subject}</strong></p>
        </td>
        <td style="padding:16px 20px;text-align:right;white-space:nowrap;vertical-align:middle">
          <span style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:10.5px;font-weight:800;padding:5px 14px;border-radius:20px">🔒 CLOSED</span>
        </td>
      </tr>
    </table>
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px 18px;text-align:center">
      <p style="margin:0;font-size:13.5px;color:#166534;line-height:1.7">
        Thank you for using <strong>${BRAND} Support</strong>. If you need further help,
        please create a new ticket from our website. 😊
      </p>
    </div>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;text-align:center">
    <p style="margin:0;font-size:11px;color:#cbd5e1">${BRAND} Support Team · Automated message — please do not reply</p>
  </td></tr>
</table></td></tr></table></body></html>`;
        sendEmail(ticket.email,
          `[${ticket.ticketId}] Your ticket has been closed — ${BRAND} Support`,
          `Hi ${ticket.name},\n\nYour ticket ${ticket.ticketId} has been resolved and closed.\nIf you need more help, please create a new ticket from our website.\n\n---\n${BRAND} Support`,
          closedHtml
        ).catch(e => console.error('Close email error:', e.message));
      }
      if (status === 'open') { ticket.closedAt = null; ticket.closedBy = null; }
      ticket.activityLog.push({ action: 'status_changed', agent: agentName, detail: `Status → ${status}` });
      ticket.status = status;
    }
    await ticket.save();
    broadcast('ticket:updated', { ticketId: ticket.ticketId, status: ticket.status, assignedTo: ticket.assignedTo });
    res.json(createStandardResponse(true, { ticketId: ticket.ticketId, status: ticket.status }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Reply to user ─────────────────────────────────────────────────────────────
supportRouter.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    const agentName = req.agent.name || 'Support Agent';
    if (!message) return res.status(400).json(createStandardResponse(false, null, 'message required'));

    const ticket = await SupportTicket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json(createStandardResponse(false, null, 'Ticket not found'));
    if (ticket.status === 'closed') return res.status(400).json(createStandardResponse(false, null, 'Ticket is closed'));

    // Send email
    const subject = `[${ticket.ticketId}] Reply from ${BRAND} Support`;
    const text    = `Hi ${ticket.name},\n\n${message}\n\n---\n${agentName}\n${BRAND} Support Team`;
    await sendSupportEmail(ticket.email, subject, text,
      buildReplyHtml(ticket, agentName, message), ticket.confirmationMessageId || null);

    // If not yet in_progress, auto-advance
    if (ticket.status === 'open') {
      ticket.status     = 'in_progress';
      ticket.assignedTo = ticket.assignedTo || agentName;
      ticket.activityLog.push({ action: 'status_changed', agent: agentName, detail: 'Status → in_progress (first reply)' });
    }
    ticket.replies.push({ from: 'support', agent: agentName, text: message });
    ticket.activityLog.push({ action: 'replied', agent: agentName, detail: `Replied to ${ticket.email}` });
    await ticket.save();

    broadcast('ticket:replied', { ticketId: ticket.ticketId, agent: agentName });
    res.json(createStandardResponse(true, { ticketId: ticket.ticketId, sent: true }));
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Failed to send reply'));
  }
});

// ── Internal note ─────────────────────────────────────────────────────────────
supportRouter.post('/tickets/:id/note', async (req, res) => {
  try {
    const { text } = req.body;
    const agentName = req.agent.name || 'Agent';
    if (!text) return res.status(400).json(createStandardResponse(false, null, 'text required'));
    const ticket = await SupportTicket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json(createStandardResponse(false, null, 'Ticket not found'));
    ticket.internalNotes.push({ agent: agentName, text });
    ticket.activityLog.push({ action: 'note_added', agent: agentName, detail: 'Internal note added' });
    await ticket.save();
    broadcast('ticket:note', { ticketId: ticket.ticketId });
    res.json(createStandardResponse(true, { added: true }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Agents list ───────────────────────────────────────────────────────────────
supportRouter.get('/agents', async (req, res) => {
  try {
    const agents = await SupportAgent.find({ isActivated: true, role: { $ne: 'admin' } }, { tempPassword: 0, password: 0 }).lean();
    res.json(createStandardResponse(true, agents));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── Reply email HTML ──────────────────────────────────────────────────────────
function buildReplyHtml(ticket, agent, message) {
  const P = '#667eea', V = '#764ba2';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf0f7">
<tr><td align="center" style="padding:32px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,.16);margin:0 auto">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px 24px 22px;text-align:center">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
    <tr><td align="center"
            style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                   border-radius:18px;padding:14px 24px;">
      <div style="font-size:32px;line-height:1;margin-bottom:8px;">💬</div>
      <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;font-family:Arial,sans-serif;white-space:nowrap;">${BRAND} Support</div>
    </td></tr>
  </table>
  <h1 style="margin:0 0 4px;color:#fff;font-size:20px;font-weight:900;font-family:Arial,sans-serif;">Reply from ${BRAND} Support</h1>
  <p style="margin:0;color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Ticket ${ticket.ticketId}</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="margin:0 0 20px;font-size:14px;color:#2c3e50">Hi <strong>${ticket.name}</strong>,</p>
  <div style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-left:5px solid ${P};border-radius:12px;padding:18px 20px;margin-bottom:24px">
    <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#4338ca;text-transform:uppercase;letter-spacing:1px">📨 Reply from ${agent}</p>
    <p style="margin:0;font-size:14px;color:#2c3e50;line-height:1.8;white-space:pre-wrap">${message}</p>
  </div>
  <div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-radius:12px;padding:12px 16px">
    <p style="margin:0;font-size:13px;color:#374151">💬 <strong>Reply to this email</strong> to respond to our support team. Thread stays open until resolved.</p>
  </div>
</td></tr>
</table></td></tr></table></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JWT-PROTECTED ADMIN ENDPOINTS (require logged-in admin, no master key needed)
// All routes below inherit requireAgent + requireActivated from line 743
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: enforce admin role on JWT-protected routes
async function requireAdminRole(req, res, next) {
  try {
    const caller = await SupportAgent.findById(req.agent.id, { role: 1 }).lean();
    if (!caller || caller.role !== 'admin')
      return res.status(403).json(createStandardResponse(false, null, 'Admin role required'));
    next();
  } catch { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
}

// ── GET all agents (admin view — includes inactive/admin accounts) ─────────────
supportRouter.get('/admin/agents-all', requireAdminRole, async (req, res) => {
  try {
    const agents = await SupportAgent.find({}, { tempPassword: 0, password: 0, otpCode: 0, otpExpiry: 0 }).lean();
    res.json(createStandardResponse(true, agents));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── PATCH toggle agent active/inactive ────────────────────────────────────────
supportRouter.patch('/admin/agents/:id/activate', requireAdminRole, async (req, res) => {
  try {
    const agent = await SupportAgent.findById(req.params.id);
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'Agent not found'));
    if (agent._id.toString() === req.agent.id)
      return res.status(400).json(createStandardResponse(false, null, 'Cannot deactivate yourself'));
    const { activate } = req.body;
    agent.isActive = activate !== undefined ? !!activate : !agent.isActive;
    await agent.save();
    res.json(createStandardResponse(true, { id: agent._id, isActive: agent.isActive,
      message: `Agent ${agent.isActive ? 'activated' : 'deactivated'} successfully` }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── DELETE agent (admin only, cannot delete self) ─────────────────────────────
supportRouter.delete('/admin/agents/:id/remove', requireAdminRole, async (req, res) => {
  try {
    const agent = await SupportAgent.findById(req.params.id);
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'Agent not found'));
    if (agent._id.toString() === req.agent.id)
      return res.status(400).json(createStandardResponse(false, null, 'Cannot delete yourself'));
    await SupportAgent.findByIdAndDelete(req.params.id);
    res.json(createStandardResponse(true, { message: `Agent ${agent.accessToken} deleted` }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── POST reset any agent's password (admin only) ──────────────────────────────
supportRouter.post('/admin/reset-agent-pw', requireAdminRole, async (req, res) => {
  try {
    const { agentId, newPassword } = req.body;
    if (!agentId || !newPassword || newPassword.length < 8)
      return res.status(400).json(createStandardResponse(false, null, 'agentId and newPassword (min 8) required'));
    const agent = await SupportAgent.findById(agentId);
    if (!agent) return res.status(404).json(createStandardResponse(false, null, 'Agent not found'));
    agent.password = newPassword;
    agent.needsPasswordChange = false;
    agent.isActivated = true;
    await agent.save();
    res.json(createStandardResponse(true, { accessToken: agent.accessToken, name: agent.name,
      message: `Password reset for ${agent.name || agent.accessToken}` }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, 'Server error')); }
});

// ── POST auto-generate agent credentials (admin only via JWT) ─────────────────
supportRouter.post('/admin/gen-agent', requireAdminRole, async (req, res) => {
  try {
    const { name, email, role: agentRole = 'agent' } = req.body;
    // Generate unique SW-XXXX token
    let accessToken, attempts = 0;
    do {
      const num = Math.floor(1000 + Math.random() * 9000);
      accessToken = `SW-${num}`;
      attempts++;
    } while (await SupportAgent.findOne({ accessToken }) && attempts < 20);

    // Generate secure 12-char password
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ', lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789', syms = '!@#$%&*';
    const rand = (s) => s[Math.floor(Math.random() * s.length)];
    const parts = [rand(upper),rand(upper),rand(digits),rand(digits),rand(syms),
                   rand(lower),rand(lower),rand(lower),rand(lower),rand(lower),rand(upper),rand(digits)];
    const tempPassword = parts.sort(() => Math.random() - 0.5).join('');

    const agent = new SupportAgent({
      accessToken, tempPassword,
      name: name?.trim() || '',
      email: email?.trim().toLowerCase() || '',
      role: agentRole === 'admin' ? 'agent' : agentRole, // safety: only 'agent' via this path
      needsPasswordChange: true,
      needsProfileSetup: !name,
      isActivated: false,
      isActive: true,
    });
    await agent.save();
    res.json(createStandardResponse(true, { accessToken, tempPassword, name: agent.name,
      message: 'Share these credentials with the agent. Password shown only once.' }));
  } catch (err) {
    console.error('Gen agent error:', err);
    res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ── POST send test email (JWT admin) ─────────────────────────────────────────
supportRouter.post('/admin/test-email-jwt', requireAdminRole, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json(createStandardResponse(false, null, 'email required'));
    const caller = await SupportAgent.findById(req.agent.id, { name: 1 }).lean();
    await sendEmail(email, `${BRAND} — Email Delivery Test`,
      `Email delivery is working correctly. Sent by ${caller?.name || 'Admin'}.`,
      `<p>Your <strong>${BRAND}</strong> email config is working!</p>`);
    res.json(createStandardResponse(true, { message: `Test email sent to ${email}` }));
  } catch (err) { res.status(500).json(createStandardResponse(false, null, `Email failed: ${err.message}`)); }
});
