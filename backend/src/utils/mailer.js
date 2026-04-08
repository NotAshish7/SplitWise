import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

/**
 * Email routing:
 *  - Automated emails (OTP, welcome, payment, reminders) → MAIL_FROM (noreply@splitwise.space)
 *  - Support / manual replies → MAIL_SUPPORT (support@splitwise.space)
 *
 * Provider detection (via MAIL_USER env var):
 *   MAIL_USER = 'resend'  → use Resend HTTP API (recommended for production)
 *   MAIL_USER = anything else → use nodemailer SMTP (Gmail, etc.)
 */

// ─── Resend HTTP API sender ───────────────────────────────────────────────────
async function sendViaResend(to, subject, text, html, fromAddress) {
  const apiKey = (process.env.MAIL_PASS || '').replace(/\s+/g, '');
  if (!apiKey) throw new Error('MAIL_PASS (Resend API key) is not set');

  const body = {
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    ...(html ? { html } : {}),
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  console.log(`✅ Email sent via Resend API to ${to} (id: ${data.id})`);
  return { messageId: data.id };
}

// ─── Nodemailer SMTP sender (fallback / local dev) ───────────────────────────
let _smtpTransporter = null;
function getSmtpTransporter() {
  if (_smtpTransporter) return _smtpTransporter;
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;
  if (MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS) {
    const port = Number(MAIL_PORT);
    _smtpTransporter = nodemailer.createTransport({
      host: MAIL_HOST, port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user: MAIL_USER, pass: MAIL_PASS.replace(/\s+/g, '') },
      connectionTimeout: 10000, greetingTimeout: 8000, socketTimeout: 15000,
      encoding: 'utf8', pool: true, maxConnections: 1, maxMessages: 3,
    });
    console.log(`✅ SMTP transporter configured (${MAIL_HOST}:${port})`);
  } else {
    // Console fallback — logs emails to terminal instead of sending
    _smtpTransporter = {
      sendMail: async (opts) => {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                  📧 EMAIL (LOCAL DEV - NOT SENT)');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📬 To: ${opts.to}`);
        console.log(`📋 Subject: ${opts.subject}`);
        const otpMatch = (opts.text || '').match(/(\d{6})/);
        if (otpMatch) {
          console.log(`\n        ╔══════════════════════════════╗`);
          console.log(`        ║  🔐 OTP CODE: ${otpMatch[1]}       ║`);
          console.log(`        ╚══════════════════════════════╝\n`);
        }
        console.log(`💬 Message: ${opts.text || ''}`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        return { messageId: 'console-mail' };
      }
    };
  }
  return _smtpTransporter;
}

// ─── Public sendEmail ─────────────────────────────────────────────────────────
export async function sendEmail(to, subject, text, html = null, replyTo = null) {
  const mailFrom  = process.env.MAIL_FROM  || process.env.MAIL_USER || '';
  const fromName  = process.env.MAIL_FROM_NAME || 'SplitWise';
  const fromAddr  = mailFrom.includes('@') ? `${fromName} <${mailFrom}>` : fromName;

  // Format subject: [SplitWise] Subject
  let formattedSubject = subject.replace(/^\[.*?\]\s*/, '');
  if (!formattedSubject.startsWith('[')) formattedSubject = `[${fromName}] ${formattedSubject}`;

  try {
    if (process.env.MAIL_USER === 'resend') {
      // ── Resend HTTP API ───────────────────────────────
      return await sendViaResend(to, formattedSubject, text, html, fromAddr);
    } else {
      // ── Nodemailer SMTP (Gmail / local) ───────────────
      const t = getSmtpTransporter();
      const opts = {
        from: { name: fromName, address: mailFrom },
        to, subject: formattedSubject,
        headers: {
          'X-Mailer': fromName,
          ...(replyTo ? { 'Reply-To': replyTo } : {}),
        },
        ...(html ? { html, text } : { text }),
      };
      const result = await t.sendMail(opts);
      if (result.messageId && !result.messageId.includes('console')) {
        console.log(`✅ Email sent via SMTP to ${to}`);
      }
      return result;
    }
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    throw error;
  }
}


export async function sendSupportEmail(to, subject, text, html = null, inReplyTo = null) {
  const supportFrom = process.env.MAIL_SUPPORT || process.env.MAIL_FROM || '';
  const brand       = process.env.MAIL_FROM_NAME || 'SplitWise';
  const fromName    = `${brand} Support`;
  const fromAddr    = supportFrom.includes('@') ? `${fromName} <${supportFrom}>` : fromName;
  const formattedSubject = `[${brand}] ${subject.replace(/^\[.*?\]\s*/, '')}`;
  const messageId   = `<${Date.now()}.${Math.random().toString(36).substring(7)}@${supportFrom.split('@')[1] || 'splitwise.space'}>`;

  try {
    if (process.env.MAIL_USER === 'resend') {
      // ── Resend HTTP API ─────────────────────────────────
      const body = {
        from: fromAddr,
        to: Array.isArray(to) ? to : [to],
        subject: formattedSubject,
        text,
        ...(html ? { html } : {}),
        headers: {
          'Reply-To': supportFrom, // user replies go to support inbox
          ...(inReplyTo ? { 'In-Reply-To': inReplyTo, 'References': inReplyTo } : {}),
        },
      };
      const apiKey = (process.env.MAIL_PASS || '').replace(/\s+/g, '');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Resend API error ${res.status}: ${data.message || JSON.stringify(data)}`);
      console.log(`✅ Support email sent via Resend API to ${to} (id: ${data.id})`);
      return { messageId: data.id, sentMessageId: messageId };
    } else {
      // ── Nodemailer SMTP fallback ────────────────────────
      const t = getSmtpTransporter();
      const opts = {
        from: { name: fromName, address: supportFrom },
        to, subject: formattedSubject,
        headers: { 'Message-ID': messageId, 'Reply-To': supportFrom,
          ...(inReplyTo ? { 'In-Reply-To': inReplyTo, 'References': inReplyTo } : {}) },
        ...(html ? { html, text } : { text }),
      };
      const result = await t.sendMail(opts);
      console.log(`✅ Support email sent via SMTP to ${to}`);
      return { ...result, sentMessageId: messageId };
    }
  } catch (error) {
    console.error('❌ Support Email Error:', error.message);
    throw error;
  }
}

