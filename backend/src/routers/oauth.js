import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { issueJwt } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';
import { sendEmail } from '../utils/mailer.js';

export const oauthRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://splitwise.space';
const BRAND        = process.env.MAIL_FROM_NAME || 'SplitWise';
const PURPLE       = '#667eea';
const ORANGE       = '#f59e0b';

// ─── Generate a secure temporary password ────────────────────────────────────
function generateTempPassword() {
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const syms   = '!@#$%&*';
  const rand   = (s) => s[Math.floor(Math.random() * s.length)];
  const parts  = [
    rand(upper), rand(upper),
    rand(lower), rand(lower), rand(lower),
    rand(digits), rand(digits),
    rand(syms),
    rand(upper), rand(lower), rand(digits), rand(syms),
  ];
  return parts.sort(() => Math.random() - 0.5).join('');
}

// ─── Professional temp password email ────────────────────────────────────────
async function sendTempPasswordEmail(email, name, tempPassword, provider) {
  const providerLabel = provider === 'google' ? 'Google' : 'Facebook';
  const providerColor = provider === 'google' ? '#4285f4' : '#1877f2';
  const settingsUrl   = `${FRONTEND_URL}/settings.html`;
  const year          = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your ${BRAND} Password</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;">
  <tr><td align="center" style="padding:36px 12px;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;
                  box-shadow:0 20px 60px rgba(245,158,11,0.13);margin:0 auto;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:32px 24px 26px;text-align:center;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr><td align="center"
                  style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                         border-radius:18px;padding:16px 28px;">
            <div style="font-size:32px;font-weight:900;color:#fff;line-height:1;">&#128272;</div><div style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.85);letter-spacing:1px;white-space:nowrap;font-family:Arial,sans-serif;margin-top:5px;">${BRAND}</div>
          </td></tr>
        </table>
        <h1 style="margin:0 0 6px;color:#fff;font-size:21px;font-weight:900;font-family:Arial,sans-serif;">Your Temporary Password</h1>
        <p style="margin:0;color:rgba(255,255,255,.8);font-size:12px;text-transform:uppercase;
                  letter-spacing:2px;font-family:Arial,sans-serif;">Account Security Setup</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:32px 36px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 6px;font-size:16px;color:#1e293b;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
          You signed up using <strong style="color:${providerColor};">${providerLabel}</strong>.
          We've generated a temporary password so you can also log in directly with your email.
        </p>

        <!-- Password box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:linear-gradient(135deg,rgba(245,158,11,0.07),rgba(217,119,6,0.07));
                         border:1.5px solid #fcd34d;border-left:5px solid #f59e0b;
                         border-radius:16px;padding:22px 24px;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:900;color:#92400e;
                      text-transform:uppercase;letter-spacing:1.5px;">Your Temporary Password</p>
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:900;
                      color:#1e1b4b;letter-spacing:4px;word-break:break-all;">${tempPassword}</p>
            <p style="margin:10px 0 0;font-size:12px;color:#92400e;">
              <strong>(!)</strong> Please change this password after your first login.
            </p>
          </td></tr>
        </table>

        <!-- Warning box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
          <tr><td style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#dc2626;font-weight:700;"><strong>&#128274;</strong> Keep this password private. Do not share it with anyone.</p>
          </td></tr>
        </table>

        <!-- How to change -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
          <tr><td style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-radius:14px;padding:18px 20px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:900;color:#4338ca;
                      text-transform:uppercase;letter-spacing:1px;">How to change your password</p>
            <p style="margin:0 0 6px;font-size:13px;color:#374151;line-height:1.7;">
              <strong style="color:${PURPLE};">Step 1:</strong> Log in to ${BRAND}
            </p>
            <p style="margin:0 0 6px;font-size:13px;color:#374151;line-height:1.7;">
              <strong style="color:${PURPLE};">Step 2:</strong> Go to <strong>Settings &rarr; Security</strong>
            </p>
            <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">
              <strong style="color:${PURPLE};">Step 3:</strong> Set your own secure password
            </p>
          </td></tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          <tr><td align="center">
            <a href="${settingsUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);
                      color:#fff;font-weight:800;font-size:14px;padding:14px 36px;border-radius:12px;
                      text-decoration:none;letter-spacing:.3px;
                      box-shadow:0 4px 14px rgba(245,158,11,0.35);">Go to Settings &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">${BRAND} &middot; Automated Security Email</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">Do not reply to this email. &copy; ${year} ${BRAND}</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `Hi ${name},\n\nYou signed up via ${providerLabel}. Here is your temporary password for ${BRAND}:\n\n${tempPassword}\n\nPlease change it immediately: ${settingsUrl}\n\nNever share this password with anyone.\n\n---\n${BRAND}`;

  await sendEmail(email, `Your ${BRAND} Temporary Password`, text, html);
  console.log(`🔐 Temp password email sent to ${email} (${provider} signup)`);
}

// ─── Welcome email for new OAuth users ───────────────────────────────────────
async function sendOAuthWelcomeEmail(email, name, provider) {
  const providerLabel = provider === 'google' ? 'Google' : 'Facebook';
  const providerColor = provider === 'google' ? '#4285f4' : '#1877f2';
  const settingsUrl   = `${FRONTEND_URL}/settings.html`;
  const appUrl        = `${FRONTEND_URL}/index.html`;
  const year          = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to ${BRAND}!</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;">
  <tr><td align="center" style="padding:36px 12px;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;
                  box-shadow:0 20px 60px rgba(16,185,129,0.13);margin:0 auto;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:32px 24px 26px;text-align:center;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr><td align="center"
                  style="background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.38);
                         border-radius:18px;padding:16px 28px;">
            <div style="font-size:32px;font-weight:900;color:#fff;line-height:1;">🎉</div>
            <div style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.85);letter-spacing:1px;white-space:nowrap;font-family:Arial,sans-serif;margin-top:5px;">${BRAND}</div>
          </td></tr>
        </table>
        <h1 style="margin:0 0 6px;color:#fff;font-size:21px;font-weight:900;font-family:Arial,sans-serif;">Welcome to ${BRAND}!</h1>
        <p style="margin:0;color:rgba(255,255,255,.8);font-size:12px;text-transform:uppercase;
                  letter-spacing:2px;font-family:Arial,sans-serif;">Your account is ready</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:32px 36px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 6px;font-size:16px;color:#1e293b;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.7;">
          You've successfully signed up with <strong style="color:${providerColor};">${providerLabel}</strong>.
          Your SplitWise account is ready to use!
        </p>

        <!-- Features -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:linear-gradient(135deg,rgba(16,185,129,0.07),rgba(5,150,105,0.07));
                         border:1.5px solid #6ee7b7;border-left:5px solid #10b981;
                         border-radius:16px;padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:900;color:#065f46;text-transform:uppercase;letter-spacing:1.5px;">✨ What you can do</p>
            <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">📊 <strong>Track Expenses</strong> — Record personal and group expenses effortlessly</p>
            <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">👥 <strong>Manage Groups</strong> — Split bills with friends and family seamlessly</p>
            <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">📈 <strong>View Reports</strong> — Get insights into your spending habits</p>
            <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">💰 <strong>Set Budgets</strong> — Stay on top of your financial goals</p>
          </td></tr>
        </table>

        <!-- Notice -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#fff8f2;border:1.5px solid #fcd9b0;border-radius:12px;padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
              🔑 <strong>Coming up next:</strong> You'll receive an email with your temporary password in about 2 minutes.
              Please change it after your first login for security.
            </p>
          </td></tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          <tr><td align="center">
            <a href="${appUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);
                      color:#fff;font-weight:800;font-size:14px;padding:14px 36px;border-radius:12px;
                      text-decoration:none;letter-spacing:.3px;
                      box-shadow:0 4px 14px rgba(16,185,129,0.35);">Get Started →</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">${BRAND} · Welcome Email</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">Do not reply to this email. &copy; ${year} ${BRAND}</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `Hi ${name},\n\nWelcome to ${BRAND}! You signed up via ${providerLabel}.\n\nWe're thrilled to have you on board.\n\nYou'll receive your temporary password in about 2 minutes.\n\nGet started: ${appUrl}\n\n---\n${BRAND}`;

  await sendEmail(email, `Welcome to ${BRAND}! 🎉`, text, html);
  console.log(`🎉 Welcome email sent to ${email} (${provider} OAuth)`);
}


// ==================== GOOGLE OAUTH ====================

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Get Google OAuth URL
oauthRouter.get('/google/url', (req, res) => {
  try {
    // ROOT CAUSE FIX: Use dynamic frontend URL from request origin
    const origin = req.get('origin') || req.get('referer')?.replace(/\/$/, '');
    const frontendUrl = process.env.FRONTEND_URL || origin || 'http://localhost:5500';
    const frontendCallbackUrl = `${frontendUrl}/oauth-callback.html`;

    console.log(`📍 Google OAuth: Frontend URL = ${frontendUrl}, Callback = ${frontendCallbackUrl}`);
    const tempClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      frontendCallbackUrl
    );

    const authUrl = tempClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      // Force account selection every time
      prompt: 'select_account',
    });

    return res.json(createStandardResponse(true, { url: authUrl }));
  } catch (error) {
    console.error('Google OAuth URL error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to generate OAuth URL'));
  }
});

// Google OAuth callback
oauthRouter.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(createStandardResponse(false, null, 'Authorization code required'));
    }

    // ROOT CAUSE FIX: Use dynamic frontend URL from request origin
    const origin = req.get('origin') || req.get('referer')?.replace(/\/$/, '');
    const frontendUrl = process.env.FRONTEND_URL || origin || 'http://localhost:5500';
    const frontendCallbackUrl = `${frontendUrl}/oauth-callback.html`;
    const tempClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      frontendCallbackUrl
    );

    // Exchange code for tokens
    const { tokens } = await tempClient.getToken(code);
    tempClient.setCredentials(tokens);

    // Get user info
    const ticket = await tempClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('📧 Google OAuth - User info received:', { email, name });

    let user = await User.findOne({ email: email.toLowerCase() });
    let accountExists = false;

    if (user) {
      // User exists - update Google ID if not set
      accountExists = true;
      if (!user.google_id) {
        user.google_id = googleId;
        // ROOT CAUSE FIX: Update avatar field (preferred) or profile_picture (fallback)
        if (picture && !user.avatar) {
          user.avatar = picture;
        } else if (picture) {
          user.profile_picture = picture;
        }
        await user.save();
      }

      console.log('✅ Existing user logged in via Google:', email);
    } else {
      // Create new user with a real temporary password
      const tempPw   = generateTempPassword();
      const pwHash   = await bcrypt.hash(tempPw, 12);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        google_id: googleId,
        avatar: picture,
        profile_picture: picture,
        email_verified: true,
        password_hash: pwHash,
      });

      console.log('✅ New user created via Google:', email);

      // 1️⃣ Send welcome email immediately (fire-and-forget)
      sendOAuthWelcomeEmail(email, name, 'google').catch(e =>
        console.warn('⚠️  Welcome email failed (non-fatal):', e.message));

      // 2️⃣ Send temp password email after 2-minute delay
      setTimeout(() => {
        sendTempPasswordEmail(email, name, tempPw, 'google').catch(e =>
          console.warn('⚠️  Temp password email failed (non-fatal):', e.message));
      }, 2 * 60 * 1000); // 2 minutes
    }

    // Generate JWT token
    const token = issueJwt(user._id.toString(), user.email);

    return res.json(createStandardResponse(true, {
      token,
      account_exists: accountExists, // Flag for frontend
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        preferred_currency: user.preferred_currency,
        theme: user.theme,
        avatar: user.avatar || user.profile_picture, // ROOT CAUSE FIX: Use avatar if available, fallback to profile_picture
        phone: user.phone
      }
    }));

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return res.status(500).json(createStandardResponse(false, null, error.message || 'Google authentication failed'));
  }
});

// ==================== FACEBOOK OAUTH ====================

// Get Facebook OAuth URL
oauthRouter.get('/facebook/url', (req, res) => {
  try {
    // ROOT CAUSE FIX: Use dynamic frontend URL from request origin
    const origin = req.get('origin') || req.get('referer')?.replace(/\/$/, '');
    const frontendUrl = process.env.FRONTEND_URL || origin || 'http://localhost:5500';
    const frontendCallbackUrl = `${frontendUrl}/oauth-callback.html`;
    const appId = process.env.FACEBOOK_APP_ID;

    console.log(`📍 Facebook OAuth: Frontend URL = ${frontendUrl}, Callback = ${frontendCallbackUrl}`);

    if (!appId || !frontendCallbackUrl) {
      return res.status(500).json(createStandardResponse(false, null, 'Facebook OAuth not configured'));
    }

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(frontendCallbackUrl)}` +
      `&scope=email,public_profile` +
      `&response_type=code` +
      `&auth_type=rerequest`; // Force account selection

    return res.json(createStandardResponse(true, { url: authUrl }));
  } catch (error) {
    console.error('Facebook OAuth URL error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to generate OAuth URL'));
  }
});

// Facebook OAuth callback
oauthRouter.post('/facebook/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(createStandardResponse(false, null, 'Authorization code required'));
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // ROOT CAUSE FIX: Use dynamic frontend URL from request origin
    const origin = req.get('origin') || req.get('referer')?.replace(/\/$/, '');
    const frontendUrl = process.env.FRONTEND_URL || origin || 'http://localhost:5500';
    const frontendCallbackUrl = `${frontendUrl}/oauth-callback.html`;

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&redirect_uri=${encodeURIComponent(frontendCallbackUrl)}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token from Facebook');
    }

    // Get user info
    const userUrl = `https://graph.facebook.com/me?` +
      `fields=id,name,email,picture` +
      `&access_token=${tokenData.access_token}`;

    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();

    if (!userData.email) {
      return res.status(400).json(createStandardResponse(false, null, 'Email permission required'));
    }

    const { id: facebookId, email, name, picture } = userData;
    const profilePicture = picture?.data?.url;

    console.log('📘 Facebook OAuth - User info received:', { email, name });

    // ROOT CAUSE FIX: Facebook accounts are SEPARATE - check by facebook_id only, not email
    // This allows Facebook login to create separate accounts even if email matches Google/Email signup
    let user = await User.findOne({ facebook_id: facebookId });
    let accountExists = false;

    if (user) {
      // User exists with this Facebook ID - just log them in
      accountExists = true;
      console.log('✅ Existing Facebook user logged in:', email);
    } else {
      // Create NEW Facebook account with a real temporary password
      const tempPw   = generateTempPassword();
      const pwHash   = await bcrypt.hash(tempPw, 12);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        facebook_id: facebookId,
        avatar: profilePicture,
        profile_picture: profilePicture,
        email_verified: true,
        password_hash: pwHash,
      });

      console.log('✅ New user created via Facebook:', email);

      // 1️⃣ Send welcome email immediately (fire-and-forget)
      sendOAuthWelcomeEmail(email, name, 'facebook').catch(e =>
        console.warn('⚠️  Welcome email failed (non-fatal):', e.message));

      // 2️⃣ Send temp password email after 2-minute delay
      setTimeout(() => {
        sendTempPasswordEmail(email, name, tempPw, 'facebook').catch(e =>
          console.warn('⚠️  Temp password email failed (non-fatal):', e.message));
      }, 2 * 60 * 1000); // 2 minutes
    }

    // Generate JWT token
    const token = issueJwt(user._id.toString(), user.email);

    return res.json(createStandardResponse(true, {
      token,
      account_exists: accountExists, // Flag for frontend notification
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        preferred_currency: user.preferred_currency,
        theme: user.theme,
        avatar: user.avatar || user.profile_picture, // ROOT CAUSE FIX: Use avatar if available
        phone: user.phone
      }
    }));

  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return res.status(500).json(createStandardResponse(false, null, error.message || 'Facebook authentication failed'));
  }
});

// ==================== VERIFY TOKEN (for both OAuth and regular login) ====================
oauthRouter.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json(createStandardResponse(false, null, 'No token provided'));
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    return res.json(createStandardResponse(true, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile_picture: user.profile_picture,
        currency: user.currency,
        phone: user.phone
      }
    }));

  } catch (error) {
    return res.status(401).json(createStandardResponse(false, null, 'Invalid token'));
  }
});

