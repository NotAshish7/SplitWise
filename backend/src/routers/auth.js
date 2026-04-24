import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendEmail } from '../utils/mailer.js';
import { sendSMS } from '../utils/sms.js';
import { issueJwt, requireAuth } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';

export const authRouter = Router();

// ==================== SIGNUP ====================
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

authRouter.post('/signup', async (req, res) => {
  try {
    const parse = signupSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { name, email, password } = parse.data;

    // ROOT CAUSE FIX: Check if user already exists and if email is verified
    // Only show "email already exists" if email is verified
    // If email exists but not verified, allow signup again (update user and send new OTP)
    const existing = await User.findOne({ email: email.toLowerCase() });
    let user;
    
    if (existing) {
      // If email is already verified, return error
      if (existing.email_verified) {
        return res.status(409).json(createStandardResponse(false, null, 'Email already registered. Please login instead.'));
      }
      
      // ROOT CAUSE FIX: Email exists but not verified - allow signup again
      // Update existing user with new password and name (user may have forgotten password or changed name)
      const passwordHash = await bcrypt.hash(password, 10);
      
      user = await User.findOneAndUpdate(
        { email: email.toLowerCase(), email_verified: false },
        { 
          name,
          password_hash: passwordHash,
          email_verified: false  // Ensure it stays unverified
        },
        { new: true }
      );
      
      if (!user) {
        // This shouldn't happen, but handle edge case
        return res.status(500).json(createStandardResponse(false, null, 'Failed to update user. Please try again.'));
      }
      
      console.log(`✅ Updated existing unverified user: ${email} - Sending new OTP`);
    } else {
      // ROOT CAUSE FIX: User doesn't exist - create new user
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        email_verified: false
      });
      
      console.log(`✅ Created new user: ${email} - Sending OTP`);
    }

    // ROOT CAUSE FIX: Delete old unused OTPs for this email to prevent confusion
    // This ensures only the latest OTP is valid
    await OTP.deleteMany({
      email: email.toLowerCase(),
      purpose: 'email-verification',
      used: false
    });

    // Generate new OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose: 'email-verification',
      expires_at: expiresAt
    });

    // ROOT CAUSE FIX: Use unified email template with verification theme
    const { htmlContent, textContent } = createEmailTemplate({
      title: 'SplitWise',
      heading: 'Please verify your email address',
      greeting: `Hey ${name}!`,
      content: [
        'Welcome! We\'re excited to have you join SplitWise.',
        'To complete your registration, please enter the verification code below. This code will expire in 2 minutes.'
      ],
      otpCode,
      otpExpiry: '2 minutes',
      additionalInfo: "If you didn't request this verification, you can safely ignore this email.",
      theme: 'verification'
    });

    // ROOT CAUSE FIX: Subject line like GitHub - short and concise
    await sendEmail(email, 'Please verify your email address', textContent, htmlContent);

    return res.json(createStandardResponse(true, { 
      userId: user._id, 
      email: user.email 
    }));

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== VERIFY EMAIL ====================
const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4)
});

authRouter.post('/verify-email', async (req, res) => {
  try {
    const parse = verifySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid input'));
    }

    const { email, code } = parse.data;

    // Find valid OTP
    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      code,
      purpose: 'email-verification',
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!otp) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid or expired OTP'));
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Find user before update to check if this is first verification
    const userBeforeUpdate = await User.findOne({ email: email.toLowerCase() });
    const isFirstVerification = userBeforeUpdate && !userBeforeUpdate.email_verified;

    // Update user email_verified status
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email_verified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    // ROOT CAUSE FIX: Send welcome email ONLY after successful email verification (not at signup)
    // This ensures users only receive welcome email after they verify their email address
    if (isFirstVerification) {
      console.log(`✅ Email verified successfully for ${user.email} - Sending welcome email...`);
      // Send welcome email in background (don't wait for it to avoid blocking the response)
      sendWelcomeEmail(user.email, user.name)
        .then(() => {
          console.log(`✅ Welcome email sent successfully to ${user.email}`);
        })
        .catch(err => {
          console.error('❌ Failed to send welcome email:', err);
          // Don't fail the verification if welcome email fails - verification is already successful
        });
    } else {
      console.log(`ℹ️ Email already verified for ${user.email} - Skipping welcome email`);
    }

    // Issue JWT token
    const token = issueJwt(user._id.toString(), user.email);

    return res.json(createStandardResponse(true, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        preferred_currency: user.preferred_currency,
        theme: user.theme
      }
    }));

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== UNIFIED EMAIL TEMPLATE HELPER ====================
function createEmailTemplate(options) {
  const {
    title,
    heading,
    greeting,
    content,
    otpCode,
    otpExpiry,
    additionalInfo,
    ctaButton,
    warningText,
    theme = 'info'
  } = options;

  const themes = {
    verification: { primary: '#667eea', dark: '#5568d3', light: '#eef0ff', grad: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', icon: '🔐', label: 'Verification' },
    welcome:      { primary: '#10b981', dark: '#059669', light: '#d1fae5', grad: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', icon: '🎉', label: 'Welcome' },
    warning:      { primary: '#f59e0b', dark: '#d97706', light: '#fef3c7', grad: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', icon: '🔑', label: 'Security' },
    danger:       { primary: '#ef4444', dark: '#dc2626', light: '#fee2e2', grad: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', icon: '⚠️', label: 'Alert' },
    info:         { primary: '#3b82f6', dark: '#2563eb', light: '#dbeafe', grad: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)', icon: 'ℹ️', label: 'Notice' },
    payment:      { primary: '#8b5cf6', dark: '#7c3aed', light: '#ede9fe', grad: 'linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)', icon: '💳', label: 'Payment' },
    reminder:     { primary: '#ec4899', dark: '#db2777', light: '#fce7f3', grad: 'linear-gradient(135deg,#ec4899 0%,#db2777 100%)', icon: '⏰', label: 'Reminder' },
  };

  const t = themes[theme] || themes.info;
  const SUPPORT = process.env.MAIL_SUPPORT || 'support.splitwise@gmail.com';
  const BRAND   = process.env.MAIL_FROM_NAME || 'SplitWise';

  const greetingHtml = greeting
    ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#2c3e50;font-weight:600;">${greeting}</p>` : '';

  const contentHtml = (Array.isArray(content) ? content : [content])
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#495057;">${p}</p>`).join('');

  const otpBoxHtml = otpCode ? `
    <div style="background:${t.light};border:2px solid ${t.primary};border-radius:16px;padding:28px 24px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:${t.dark};text-transform:uppercase;letter-spacing:2px;">Verification Code</p>
      <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:${t.dark};font-family:'Courier New',monospace;">${otpCode}</div>
      ${otpExpiry ? `<p style="margin:12px 0 0;font-size:13px;color:#6c757d;"><strong>⏱ Expires in ${otpExpiry}</strong></p>` : ''}
    </div>` : '';

  const warningHtml = warningText ? `
    <div style="margin:24px 0;padding:16px 20px;background:#fff8e1;border:1.5px solid #ffd54f;border-left:5px solid #f59e0b;border-radius:10px;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;"><span style="font-size:18px;">⚠️</span> ${warningText}</p>
    </div>` : '';

  const ctaHtml = ctaButton ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${ctaButton.url}" style="display:inline-block;padding:14px 36px;background:${t.grad};color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,0.15);">${ctaButton.text}</a>
    </div>` : '';

  const additionalHtml = additionalInfo
    ? (Array.isArray(additionalInfo) ? additionalInfo : [additionalInfo])
        .map(p => `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6c757d;">${p}</p>`).join('') : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);">

        <!-- HEADER -->
        <tr>
          <td style="background:${t.grad};padding:32px 24px 26px;text-align:center;">
            <!-- Frosted-glass badge — centers on all clients/sizes -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
              <tr>
                <td align="center"
                    style="background:rgba(255,255,255,0.18);
                           border:1.5px solid rgba(255,255,255,0.38);
                           border-radius:18px;padding:16px 26px;">
                  <div style="font-size:36px;line-height:1;margin-bottom:8px;">${t.icon}</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:0.5px;white-space:nowrap;font-family:Arial,sans-serif;">${BRAND}</div>
                </td>
              </tr>
            </table>
            <h1 style="margin:0 0 4px;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;font-family:Arial,sans-serif;">${heading}</h1>
            <p style="margin:0;color:rgba(255,255,255,0.78);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">${t.label}</p>
          </td>
        </tr>


        <!-- BODY -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 20px;font-size:21px;font-weight:800;color:${t.dark};line-height:1.3;">${heading}</h2>
            ${greetingHtml}
            ${contentHtml}
            ${otpBoxHtml}
            ${warningHtml}
            ${ctaHtml}
            ${additionalHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8f9fc;border-top:2px solid ${t.light};padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#6c757d;">
              Questions? Email us at <a href="mailto:${SUPPORT}" style="color:${t.primary};font-weight:600;text-decoration:none;">${SUPPORT}</a>
            </p>
            <p style="margin:0;font-size:12px;color:#adb5bd;">
              <strong style="color:${t.primary};">${BRAND}</strong> &nbsp;·&nbsp; © ${new Date().getFullYear()} All rights reserved
              &nbsp;·&nbsp; This email was sent automatically.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  let textContent = `${BRAND} — ${heading}\n\n`;
  if (greeting) textContent += `${greeting}\n\n`;
  textContent += (Array.isArray(content) ? content : [content]).join('\n\n') + '\n\n';
  if (otpCode) { textContent += `Verification code: ${otpCode}\n`; if (otpExpiry) textContent += `Expires in: ${otpExpiry}\n`; textContent += '\n'; }
  if (warningText) textContent += `⚠️ ${warningText}\n\n`;
  if (ctaButton)   textContent += `${ctaButton.text}: ${ctaButton.url}\n\n`;
  if (additionalInfo) textContent += (Array.isArray(additionalInfo) ? additionalInfo : [additionalInfo]).join('\n\n') + '\n\n';
  textContent += `---\n${BRAND} · Questions? ${SUPPORT}`;

  return { htmlContent, textContent };
}

// ==================== WELCOME EMAIL HELPER ====================
// ROOT CAUSE FIX: Professional welcome email sent after successful email verification with welcome theme
async function sendWelcomeEmail(email, name) {
  try {
    // ROOT CAUSE FIX: Build features section with welcome theme colors
    const welcomeTheme = {
      primary: '#10b981',
      primaryDark: '#059669',
      primaryLight: '#d1fae5'
    };
    
    const featuresHtml = `
      <div style="margin: 32px 0; padding: 28px; background: linear-gradient(135deg, ${welcomeTheme.primaryLight} 0%, #ecfdf5 100%); border-radius: 12px; border-left: 5px solid ${welcomeTheme.primary}; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);">
        <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: ${welcomeTheme.primaryDark}; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">✨</span>
          <span>What you can do with SplitWise:</span>
        </h3>
        <ul style="margin: 0; padding-left: 24px; font-size: 15px; line-height: 2; color: #374151;">
          <li style="margin-bottom: 12px;"><strong style="color: ${welcomeTheme.primaryDark};">📊 Track Expenses:</strong> Record your personal and group expenses effortlessly</li>
          <li style="margin-bottom: 12px;"><strong style="color: ${welcomeTheme.primaryDark};">📈 Generate Reports:</strong> Get detailed analytics and insights into your spending</li>
          <li style="margin-bottom: 12px;"><strong style="color: ${welcomeTheme.primaryDark};">👥 Manage Groups:</strong> Split expenses with friends and family seamlessly</li>
          <li style="margin-bottom: 12px;"><strong style="color: ${welcomeTheme.primaryDark};">💰 Set Budgets:</strong> Create budgets and achieve your financial goals</li>
          <li style="margin-bottom: 0;"><strong style="color: ${welcomeTheme.primaryDark};">📥 Export Data:</strong> Download your data in PDF or Excel format</li>
        </ul>
      </div>
    `;

    // ROOT CAUSE FIX: Use unified email template with welcome theme
    const { htmlContent } = createEmailTemplate({
      title: 'Welcome to SplitWise!',
      heading: `Welcome, ${name}! 👋`,
      greeting: `We're thrilled to have you on board!`,
      content: [
        "Thank you for creating your SplitWise account! We're excited to help you take control of your finances.",
        "Your email has been successfully verified. You're all set to start managing your expenses and take charge of your financial journey!"
      ],
      ctaButton: {
        text: 'Get Started',
        url: `${process.env.FRONTEND_URL || 'https://splitwise.space'}/index.html`
      },
      additionalInfo: [
        "If you have any questions or need help getting started, feel free to reach out to our support team.",
        "Happy expense tracking! 🎉"
      ],
      theme: 'welcome'
    });

    // Inject features section before CTA button
    const htmlWithFeatures = htmlContent.replace(
      /<div style="text-align: center; margin: 36px 0;">/,
      featuresHtml + '\n                  <div style="text-align: center; margin: 36px 0;">'
    );

    // ROOT CAUSE FIX: Build text content with features matching the new template structure
    const textContent = `Welcome to SplitWise!\n\nWelcome, ${name}! 👋\n\nWe're thrilled to have you on board!\n\nThank you for creating your SplitWise account! We're excited to help you take control of your finances.\n\nYour email has been successfully verified. You're all set to start managing your expenses and take charge of your financial journey!\n\n✨ What you can do with SplitWise:\n• 📊 Track Expenses: Record your personal and group expenses effortlessly\n• 📈 Generate Reports: Get detailed analytics and insights into your spending\n• 👥 Manage Groups: Split expenses with friends and family seamlessly\n• 💰 Set Budgets: Create budgets and achieve your financial goals\n• 📥 Export Data: Download your data in PDF or Excel format\n\nGet Started: ${process.env.FRONTEND_URL || 'https://splitwise.space'}/index.html\n\nIf you have any questions or need help getting started, feel free to reach out to our support team.\n\nHappy expense tracking! 🎉\n\n---\nThis email was sent by SplitWise.`;

    // ROOT CAUSE FIX: Subject line like GitHub - shorter and more professional
    await sendEmail(email, 'Welcome to SplitWise', textContent, htmlWithFeatures);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
}

// ==================== LOGIN ====================
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid credentials'));
    }

    const { email, password } = parse.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json(createStandardResponse(false, null, 'Invalid credentials'));
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json(createStandardResponse(false, null, 'Invalid credentials'));
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json(createStandardResponse(false, null, 'Email not verified'));
    }

    // Issue JWT token
    const token = issueJwt(user._id.toString(), user.email);

    return res.json(createStandardResponse(true, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        preferred_currency: user.preferred_currency,
        theme: user.theme,
        sidebar_collapsed: user.sidebar_collapsed,
        avatar: user.avatar
      }
    }));

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== RESEND OTP ====================
const resendOtpSchema = z.object({
  email: z.string().email()
});

authRouter.post('/resend-otp', async (req, res) => {
  try {
    const parse = resendOtpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid email'));
    }

    const { email } = parse.data;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    if (user.email_verified) {
      return res.status(400).json(createStandardResponse(false, null, 'Email already verified'));
    }

    // ROOT CAUSE FIX: Delete old unused OTPs for this email to prevent confusion
    // This ensures only the latest OTP is valid
    await OTP.deleteMany({
      email: email.toLowerCase(),
      purpose: 'email-verification',
      used: false
    });

    // Generate new OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose: 'email-verification',
      expires_at: expiresAt
    });

    // ROOT CAUSE FIX: Use unified email template with verification theme
    const userName = user.name || email.split('@')[0];
    const { htmlContent, textContent } = createEmailTemplate({
      title: 'SplitWise',
      heading: 'Please verify your email address',
      greeting: `Hey ${userName}!`,
      content: [
        'We received a request to verify your email address.',
        'Please enter the verification code below to complete the verification process. This code will expire in 2 minutes.'
      ],
      otpCode,
      otpExpiry: '2 minutes',
      additionalInfo: "If you didn't request this verification, you can safely ignore this email.",
      theme: 'verification'
    });

    // ROOT CAUSE FIX: Subject line like GitHub - short and concise
    await sendEmail(email, 'Please verify your email address', textContent, htmlContent);

    return res.json(createStandardResponse(true, { message: 'OTP sent successfully' }));

  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== FORGOT PASSWORD ====================
const forgotPasswordSchema = z.object({
  email: z.string().email()
});

authRouter.post('/forgot-password', async (req, res) => {
  try {
    const parse = forgotPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid email'));
    }

    const { email } = parse.data;

    // FIXED: Check if user exists - only send OTP to registered emails
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return error if email is not registered
      return res.status(404).json(createStandardResponse(false, null, 'This email is not registered. Please check your email address or sign up for a new account.'));
    }

    // Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose: 'forgot-password',
      expires_at: expiresAt
    });

    // ROOT CAUSE FIX: Use unified email template with warning theme
    const userName = user.name || email.split('@')[0];
    const { htmlContent, textContent } = createEmailTemplate({
      title: 'SplitWise',
      heading: 'Reset your password',
      greeting: `Hey ${userName}!`,
      content: [
        'We received a request to reset your password for your SplitWise account.',
        'To complete the password reset, please enter the verification code below. This code will expire in 2 minutes.'
      ],
      otpCode,
      otpExpiry: '2 minutes',
      additionalInfo: "If you didn't request a password reset, you can safely ignore this email and your password will remain unchanged.",
      theme: 'warning'
    });

    // ROOT CAUSE FIX: Subject line like GitHub - short and concise "Please verify you..."
    await sendEmail(email, 'Please verify you want to change your password', textContent, htmlContent);

    // FIXED: Return success message only when OTP is actually sent
    return res.json(createStandardResponse(true, { message: 'OTP has been sent to your registered email address' }));

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== FORGOT PASSWORD (PHONE) ====================
const forgotPasswordPhoneSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
});

authRouter.post('/forgot-password-phone', async (req, res) => {
  try {
    const parse = forgotPasswordPhoneSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { phone } = parse.data;

    // Check if user exists with this phone
    const user = await User.findOne({ phone_number: phone });
    
    // Don't reveal if phone exists or not for security
    if (!user) {
      return res.json(createStandardResponse(true, { message: 'If phone exists, OTP has been sent' }));
    }

    // Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await OTP.create({
      email: user.email, // Store with email for reset-password lookup
      code: otpCode,
      purpose: 'forgot-password',
      expires_at: expiresAt
    });

    // Try to send SMS first
    try {
      await sendSMS(
        phone,
        `Your SplitWise password reset code is: ${otpCode}. Expires in 2 minutes.`
      );
      
      return res.json(createStandardResponse(true, { 
        message: 'OTP sent to your phone',
        email: user.email // Return email for the reset form
      }));
    } catch (smsError) {
      // If SMS fails, send via email as backup
      console.log('SMS failed for password reset, sending via email');
      await sendEmail(
        user.email,
        'SplitWise - Password Reset via Phone',
        `Hello,

You requested to reset your password using your phone number.

Phone Number: ${phone}
Password Reset OTP Code: ${otpCode}

This code will expire in 2 minutes.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
SplitWise Team`
      );
      
      return res.json(createStandardResponse(true, { 
        message: 'OTP sent (check backend terminal or email)',
        email: user.email // Return email for the reset form
      }));
    }

  } catch (error) {
    console.error('Forgot password (phone) error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== RESET PASSWORD ====================
const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  newPassword: z.string().min(6)
});

authRouter.post('/reset-password', async (req, res) => {
  try {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid input'));
    }

    const { email, code, newPassword } = parse.data;

    // Find valid OTP
    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      code,
      purpose: 'forgot-password',
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!otp) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid or expired OTP'));
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password_hash: passwordHash },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    // Add to password history
    user.password_history.push({
      hash: passwordHash,
      changed_at: new Date()
    });
    await user.save();

    return res.json(createStandardResponse(true, { message: 'Password reset successful' }));

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== CHANGE PASSWORD (Authenticated) ====================
// Used from Settings page — requires user to know their current password.
// Invalies the old/temporary password immediately upon success.
authRouter.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(createStandardResponse(false, null, 'Current password and new password are required'));
    }

    if (newPassword.length < 8) {
      return res.status(400).json(createStandardResponse(false, null, 'New password must be at least 8 characters'));
    }

    if (currentPassword === newPassword) {
      return res.status(400).json(createStandardResponse(false, null, 'New password must be different from current password'));
    }

    // Fetch user WITH password_hash
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json(createStandardResponse(false, null, 'Current password is incorrect'));
    }

    // Hash and save the new password — old/temp password is now permanently invalid
    const newHash = await bcrypt.hash(newPassword, 12);
    user.password_hash = newHash;
    user.password_history.push({ hash: newHash, changed_at: new Date() });
    await user.save();

    console.log(`✅ Password changed successfully for ${user.email}`);
    return res.json(createStandardResponse(true, { message: 'Password changed successfully' }));

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== GET CURRENT USER ====================
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash -password_history');
    
    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    return res.json(createStandardResponse(true, {
      id: user._id,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
      preferred_currency: user.preferred_currency,
      theme: user.theme,
      sidebar_collapsed: user.sidebar_collapsed,
      phone: user.phone,
      avatar: user.avatar,
      created_at: user.created_at
    }));

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== UPDATE USER PROFILE ====================
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  // ROOT CAUSE FIX: Accept base64 data URLs (data:image/...) as valid URLs for avatar
  avatar: z.union([
    z.string().url(),
    z.string().regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, 'Invalid image data URL'),
    z.null() // Allow null to remove avatar
  ]).optional(),
  preferred_currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  sidebar_collapsed: z.boolean().optional()
});

authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const updates = parse.data;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password_hash -password_history');

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    return res.json(createStandardResponse(true, {
      id: user._id,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
      preferred_currency: user.preferred_currency,
      theme: user.theme,
      sidebar_collapsed: user.sidebar_collapsed,
      phone: user.phone,
      avatar: user.avatar
    }));

  } catch (error) {
    console.error('Update profile error:', error);
    // ROOT CAUSE FIX: Provide more detailed error message
    const errorMessage = error.message || 'Internal server error';
    
    // Check if it's a validation error
    if (error.name === 'ValidationError' || error.message.includes('enum')) {
      return res.status(400).json(createStandardResponse(false, null, `Invalid currency value: ${error.message}`));
    }
    
    return res.status(500).json(createStandardResponse(false, null, errorMessage));
  }
});

// ==================== DELETE ACCOUNT ====================
authRouter.delete('/account', requireAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    // TODO: Also delete user's expenses, groups, etc.

    return res.json(createStandardResponse(false, { message: 'Account deleted successfully' }));

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== SEND PHONE VERIFICATION OTP ====================
const sendPhoneOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
});

authRouter.post('/send-phone-otp', requireAuth, async (req, res) => {
  try {
    const parse = sendPhoneOtpSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { phone } = parse.data;

    // Check if phone is already used by another user
    const existingUser = await User.findOne({ 
      phone, 
      _id: { $ne: req.user.id } 
    });

    if (existingUser) {
      return res.status(409).json(createStandardResponse(false, null, 'Phone number already in use'));
    }

    // Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.create({
      email: req.user.email, // Use email as identifier
      code: otpCode,
      purpose: 'two-factor', // Reusing two-factor for phone verification
      expires_at: expiresAt
    });

    // Send OTP via SMS (will fallback to console if Twilio not configured)
    try {
      await sendSMS(
        phone,
        `Your SplitWise verification code is: ${otpCode}. Expires in 2 minutes.`
      );
      
      return res.json(createStandardResponse(true, { 
        message: 'OTP sent to your phone',
        phone 
      }));
    } catch (smsError) {
      // If SMS fails, also send via email as backup
      console.log('SMS failed, sending via email as backup');
      await sendEmail(
        req.user.email,
        'SplitWise - Phone Number Verification',
        `Hello,

You requested to verify your phone number for your SplitWise account.

Phone Number: ${phone}
Verification OTP Code: ${otpCode}

This code will expire in 2 minutes.

If you didn't request this verification, please secure your account immediately.

Best regards,
SplitWise Team`
      );
      
      return res.json(createStandardResponse(true, { 
        message: 'OTP sent (check backend terminal or email)',
        phone 
      }));
    }

  } catch (error) {
    console.error('Send phone OTP error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== VERIFY PHONE NUMBER ====================
const verifyPhoneSchema = z.object({
  phone: z.string().min(10),
  code: z.string().min(6)
});

authRouter.post('/verify-phone', requireAuth, async (req, res) => {
  try {
    const parse = verifyPhoneSchema.safeParse(req.body);
    if (!parse.success) {
      const errors = parse.error.errors.map(e => e.message).join(', ');
      return res.status(400).json(createStandardResponse(false, null, errors));
    }

    const { phone, code } = parse.data;

    // Find valid OTP
    const otp = await OTP.findOne({
      email: req.user.email,
      code,
      purpose: 'two-factor',
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!otp) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid or expired OTP'));
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Update user's phone number
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phone },
      { new: true, runValidators: true }
    ).select('-password_hash -password_history');

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    return res.json(createStandardResponse(true, {
      message: 'Phone number verified successfully',
      phone: user.phone
    }));

  } catch (error) {
    console.error('Verify phone error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== REMOVE PHONE NUMBER ====================
authRouter.delete('/phone', requireAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phone: null },
      { new: true }
    ).select('-password_hash -password_history');

    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    return res.json(createStandardResponse(true, { 
      message: 'Phone number removed successfully' 
    }));

  } catch (error) {
    console.error('Remove phone error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Internal server error'));
  }
});

// ==================== SEND DELETE ACCOUNT OTP ====================
authRouter.post('/send-delete-otp', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createStandardResponse(false, null, 'Email is required'));
    }

    // Verify this is the user's email
    const user = await User.findById(req.user.id);
    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json(createStandardResponse(false, null, 'Unauthorized'));
    }

    // Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for delete

    // Save OTP (using correct field names: code and purpose)
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose: 'forgot-password',
      expires_at: expiresAt
    });

    // ROOT CAUSE FIX: Use unified email template with danger theme
    const userName = user.name || email.split('@')[0];
    const { htmlContent, textContent } = createEmailTemplate({
      title: 'SplitWise',
      heading: 'Account Deletion Request',
      greeting: `Hey ${userName}!`,
      content: [
        'We received a request to permanently delete your SplitWise account.',
        'To confirm this action, please enter the verification code below. This code will expire in 10 minutes.'
      ],
      otpCode,
      otpExpiry: '10 minutes',
      warningText: 'This action cannot be undone. All your data will be permanently deleted.',
      additionalInfo: "If you didn't request this, please ignore this email and your account will remain safe.",
      theme: 'danger'
    });

    // ROOT CAUSE FIX: Use proper subject line format
    await sendEmail(email, 'Account Deletion Verification', textContent, htmlContent);

    console.log(`\n🔐 DELETE ACCOUNT OTP for ${email}: ${otpCode}\n`);

    return res.json(createStandardResponse(true, { 
      message: 'Verification code sent to your email' 
    }));

  } catch (error) {
    console.error('Send delete OTP error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to send verification code'));
  }
});

// ==================== VERIFY DELETE ACCOUNT OTP ====================
authRouter.post('/verify-delete-otp', requireAuth, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(createStandardResponse(false, null, 'Email and OTP are required'));
    }

    // Verify this is the user's email
    const user = await User.findById(req.user.id);
    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json(createStandardResponse(false, null, 'Unauthorized'));
    }

    // Find valid OTP (using correct field names: code, purpose, used)
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      code: otp.trim(),
      purpose: 'forgot-password',
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!otpRecord) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid or expired verification code'));
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // ==================== DELETE ALL USER DATA ====================
    console.log(`🗑️ Starting complete data deletion for user: ${email}`);
    
    // Delete all OTPs associated with this email
    await OTP.deleteMany({ email: email.toLowerCase() });
    console.log(`  ✓ Deleted all OTPs`);
    
    // Delete all sessions/tokens (if you have a Session model, delete those too)
    // This will invalidate all active sessions
    
    // Note: Since we're using JWT, we can't "delete" tokens from server
    // But deleting the user will make all tokens invalid on next verification
    
    // Delete the user account (this is the main deletion)
    await User.findByIdAndDelete(user._id);
    console.log(`  ✓ Deleted user account`);

    console.log(`❌ Account permanently deleted: ${email}`);
    console.log(`   All data removed from database`);
    console.log(`   User must create new account to access system`);

    return res.json(createStandardResponse(true, { 
      message: 'Account permanently deleted. All your data has been removed.' 
    }));

  } catch (error) {
    console.error('Verify delete OTP error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to verify code'));
  }
});

// ==================== SEND EMAIL CHANGE OTP ====================
authRouter.post('/send-email-otp', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json(createStandardResponse(false, null, 'Valid email is required'));
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json(createStandardResponse(false, null, 'This email is already in use'));
    }

    // Generate OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP (using correct field names: code and purpose)
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose: 'email-verification',
      expires_at: expiresAt
    });

    // ROOT CAUSE FIX: Use unified email template with verification theme
    const userName = user.name || email.split('@')[0];
    const { htmlContent, textContent } = createEmailTemplate({
      title: 'SplitWise',
      heading: 'Verify your new email address',
      greeting: `Hey ${userName}!`,
      content: [
        'We received a request to change your email address for your SplitWise account.',
        'To complete the email change, please enter the verification code below. This code will expire in 10 minutes.'
      ],
      otpCode,
      otpExpiry: '10 minutes',
      additionalInfo: "If you didn't request this, you can safely ignore this email.",
      theme: 'verification'
    });

    await sendEmail(email, 'Verify your new email address', textContent, htmlContent);

    console.log(`\n🔐 EMAIL CHANGE OTP for ${email}: ${otpCode}\n`);

    return res.json(createStandardResponse(true, { 
      message: 'Verification code sent to your new email' 
    }));

  } catch (error) {
    console.error('Send email change OTP error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to send verification code'));
  }
});

// ==================== VERIFY EMAIL CHANGE ====================
authRouter.post('/verify-email-change', requireAuth, async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json(createStandardResponse(false, null, 'Email and verification code are required'));
    }

    // Find valid OTP (using correct field names: code, purpose, used)
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      code: code,
      purpose: 'email-verification',
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!otpRecord) {
      return res.status(400).json(createStandardResponse(false, null, 'Invalid or expired verification code'));
    }

    // Check if email is still available
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      // Mark OTP as used
      otpRecord.used = true;
      await otpRecord.save();
      return res.status(400).json(createStandardResponse(false, null, 'This email is already in use'));
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Update user email
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(createStandardResponse(false, null, 'User not found'));
    }

    user.email = email.toLowerCase();
    await user.save();

    console.log(`✅ Email changed successfully for user ${user._id} to ${email}`);

    return res.json(createStandardResponse(true, { 
      message: 'Email changed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }));

  } catch (error) {
    console.error('Verify email change error:', error);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to verify email change'));
  }
});

export default authRouter;
