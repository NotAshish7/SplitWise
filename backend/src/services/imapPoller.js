/**
 * IMAP IDLE Email Handler — SplitWise Support
 * =============================================
 * Uses IMAP IDLE for real-time email detection (fires the moment an email arrives).
 * Processes each new (UNSEEN) email with these rules:
 *
 *   CASE A — Sender has an OPEN ticket + no agent has replied yet + 1st direct email:
 *     → Record in ticket replies, set directEmailReceived=true, mark email SEEN (stays in inbox for agent)
 *
 *   CASE A2 — Sender has an OPEN ticket + agent HAS replied + user emails back:
 *     → Record reply, mark Seen (NEVER delete — it's a live reply thread until ticket closes)
 *
 *   CASE B — Sender has an OPEN ticket + no agent reply yet + keeps emailing again & again:
 *     → Reply: "Please be patient" → DELETE only that new email (original ticket email untouched)
 *
 *   CASE C — Sender has a CLOSED ticket:
 *     → Reply: "Ticket closed, create a new one at [website]" → DELETE email
 *
 *   CASE D — Sender has NO ticket and NO account (fresh/unknown user):
 *     → Reply: "Create an account & submit via the website form" → DELETE email
 *
 * Reconnects automatically if connection drops.
 * Uses: imap-simple + mailparser (already in package.json)
 */

import imapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { google } from 'googleapis';
import SupportTicket from '../models/SupportTicket.js';
import { sendEmail }  from '../utils/mailer.js';

// ─── Config ───────────────────────────────────────────────────────────────────
const BRAND       = process.env.MAIL_FROM_NAME || 'SplitWise';
const PURPLE      = '#667eea';
const WEBSITE_URL = (process.env.FRONTEND_URL || 'https://splitwise.space') + '/contact.html';

const SKIP_SENDERS = [
  'mailer-daemon', 'postmaster', 'noreply', 'no-reply',
  'splitwise.noreply', 'support.splitwise',
];

let isRunning = false;

// ─── OAuth2 access token helper — returns XOAUTH2 base64 token ───────────────
async function getXoauth2Token(user) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_IMAP_CLIENT_ID,
    process.env.GMAIL_IMAP_CLIENT_SECRET,
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_IMAP_REFRESH_TOKEN });
  const { token } = await oAuth2Client.getAccessToken();
  // node-imap requires XOAUTH2 string base64-encoded in this exact format:
  // "user=<email>\x01auth=Bearer <token>\x01\x01"
  const xoauth2Str = `user=${user}\x01auth=Bearer ${token}\x01\x01`;
  return Buffer.from(xoauth2Str).toString('base64');
}

// ─── Build IMAP config from .env ─────────────────────────────────────────────
async function buildConfig() {
  const user = process.env.GMAIL_IMAP_USER || process.env.MAIL_SUPPORT;

  // OAuth2 path (preferred — works from cloud servers)
  if (process.env.GMAIL_IMAP_REFRESH_TOKEN && process.env.GMAIL_IMAP_CLIENT_ID) {
    try {
      const xoauth2 = await getXoauth2Token(user);
      return {
        imap: {
          user,
          xoauth2,
          host:        'imap.gmail.com',
          port:        993,
          tls:         true,
          tlsOptions:  { rejectUnauthorized: false },
          authTimeout: 10000,
          connTimeout: 30000,
          keepalive:   true,
        },
      };
    } catch (err) {
      console.error('❌ IMAP OAuth2 token error:', err.message);
      return null;
    }
  }

  // Fallback: App Password path (may not work from cloud IPs)
  const pass = process.env.MAIL_SUPPORT_PASS;
  if (!user || !pass) {
    console.warn('⚠️  IMAP: credentials not set — email watcher disabled');
    return null;
  }
  console.warn('⚠️  IMAP: Using App Password (may fail from cloud servers). Prefer OAuth2.');
  return {
    imap: {
      user,
      password:    pass.replace(/\s+/g, ''),
      host:        'imap.gmail.com',
      port:        993,
      tls:         true,
      tlsOptions:  { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 30000,
      keepalive:   true,
    },
  };
}

// ─── Main: open connection, scan existing UNSEEN, then IDLE for real-time ────
async function runImapWatcher() {
  const config = await buildConfig();
  if (!config) return;

  try {
    console.log('📧 IMAP: Connecting to support inbox…');
    const connection = await imapSimple.connect(config);
    await connection.openBox('INBOX');
    console.log('✅ IMAP: Connected — watching for new emails in real-time (IDLE)');

    // Process any unseen emails already in the inbox on startup
    await scanAndProcess(connection);

    // ── IDLE: fires immediately when a new email arrives ──────────────────────
    connection.imap.on('mail', async (numNewMsgs) => {
      console.log(`📬 IMAP: ${numNewMsgs} new email(s) arrived — processing…`);
      await scanAndProcess(connection);
    });

    // Reconnect on connection error or close
    connection.imap.on('error', (err) => {
      console.error('IMAP connection error:', err.message);
      scheduleReconnect();
    });
    connection.imap.on('close', () => {
      console.warn('IMAP: Connection closed — reconnecting…');
      scheduleReconnect();
    });
    connection.imap.on('end', () => {
      console.warn('IMAP: Connection ended — reconnecting…');
      scheduleReconnect();
    });

  } catch (err) {
    console.error('IMAP: Connection failed:', err.message);
    scheduleReconnect();
  }
}

let reconnectTimer = null;
function scheduleReconnect(delayMs = 30000) {
  if (reconnectTimer) return; // already scheduled
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await runImapWatcher();
  }, delayMs);
}

// ─── Scan INBOX for UNSEEN, process each ─────────────────────────────────────
async function scanAndProcess(connection) {
  try {
    const messages = await connection.search(['UNSEEN'], {
      bodies:   [''],   // fetch full RFC822 body for mailparser
      markSeen: false,  // we decide manually
      struct:   true,
    });

    if (!messages.length) return;
    console.log(`IMAP: Processing ${messages.length} unseen message(s)…`);

    for (const msg of messages) {
      await processSingleMsg(connection, msg);
    }
  } catch (err) {
    console.error('IMAP scan error:', err.message);
  }
}

// ─── Process one email ────────────────────────────────────────────────────────
async function processSingleMsg(connection, rawMsg) {
  const uid = rawMsg.attributes.uid;

  // Parse with mailparser for reliable header extraction
  const rawBody = rawMsg.parts.find(p => p.which === '')?.body || '';
  const parsed  = await simpleParser(rawBody);

  const fromAddr = parsed.from?.value?.[0];
  if (!fromAddr?.address) {
    // Unknown sender — mark seen so we don't re-process
    await addFlag(connection, uid, '\\Seen');
    return;
  }

  const email   = fromAddr.address.toLowerCase().trim();
  const name    = fromAddr.name?.trim() || email.split('@')[0] || 'there';
  const subject = parsed.subject || '(no subject)';

  // Skip own emails / system senders
  if (SKIP_SENDERS.some(s => email.includes(s))) {
    await addFlag(connection, uid, '\\Seen');
    return;
  }

  console.log(`IMAP: Email from "${name}" <${email}> — "${subject}"`);

  // ── NOREPLY BOUNCE: If the email was sent TO noreply@splitwise.space ─────────
  // This handles replies to OTP/welcome emails when someone accidentally hits Reply.
  // Route noreply@splitwise.space → support.splitwise@gmail.com in Cloudflare
  // so this inbox catches them and sends the bounce.
  const toAddresses = [
    ...(parsed.to?.value  || []),
    ...(parsed.cc?.value  || []),
  ].map(a => a.address?.toLowerCase() || '');

  const isToNoreply = toAddresses.some(a =>
    a.includes('noreply@splitwise.space') ||
    a.includes('splitwise.noreply@gmail')
  );

  if (isToNoreply) {
    console.log(`IMAP: Email to noreply address from ${email} — sending bounce reply`);
    try {
      await sendEmail(
        email,
        `Re: ${subject}`,
        `Hi ${name},\n\nThis is an automated message. The address noreply@splitwise.space is not monitored and cannot receive replies.\n\nIf you need help, please visit our support page: ${WEBSITE_URL}\n\n---\n${BRAND} — This message was sent automatically. Do not reply to this email.`,
        noreplyBounceHtml(name, subject)
      );
    } catch (e) { console.error('Bounce reply error:', e.message); }
    await addFlag(connection, uid, '\\Deleted');
    await expunge(connection);
    return;
  }

  const active = await SupportTicket.findOne(
    { email, status: { $in: ['open', 'in_progress'] } },
    {}, { sort: { createdAt: -1 } }
  );

  if (active) {
    // Check if any agent (not auto-system) has already replied to this ticket
    const agentHasReplied = active.replies.some(r => r.from === 'support');

    if (agentHasReplied) {
      // ── CASE A2: Agent has replied → active reply thread.
      //    Keep ALL emails from user — mark Seen so they don't re-process but
      //    stay in inbox for the agent to read. NEVER delete while ticket is open.
      console.log(`IMAP: Active reply thread for ${active.ticketId} (agent replied) — recording user reply, keeping email`);

      active.replies.push({
        from:  'auto',
        agent: name,
        text:  `[User reply via email]\nSubject: ${subject}\n\n${parsed.text || '(no body)'}`,
      });
      active.activityLog.push({
        action: 'replied',
        agent:  name,
        detail: `User replied via email (post-agent reply): "${subject}"`,
      });
      await active.save();

      // Mark Seen only — stays in inbox for the agent, never deleted
      await addFlag(connection, uid, '\\Seen');
      return;
    }

    if (!active.directEmailReceived) {
      // ── CASE A: First direct email, no agent reply yet.
      //    Record for agent, mark Seen — stays in inbox as an unread signal.
      console.log(`IMAP: First direct email for ticket ${active.ticketId} — recording for agent`);

      active.replies.push({
        from:  'auto',
        agent: name,
        text:  `[Direct email from user]\nSubject: ${subject}\n\n${parsed.text || '(no body)'}`,
      });
      active.activityLog.push({
        action: 'replied',
        agent:  name,
        detail: `Direct email from user: "${subject}"`,
      });
      active.directEmailReceived = true;
      await active.save();

      // Mark Seen — stays in inbox (ticket original email remains unread for agent)
      await addFlag(connection, uid, '\\Seen');
      return;

    } else {
      // ── CASE B: Repeated email, no agent reply yet.
      //    Send patience reply — but KEEP the email in inbox (mark Seen only).
      //    Agent can still see all messages the user sent.
      console.log(`IMAP: Repeated email for ticket ${active.ticketId} (no agent reply yet) — patience reply, keeping email in inbox`);

      active.replies.push({
        from:  'auto',
        agent: name,
        text:  `[Follow-up email from user]\nSubject: ${subject}\n\n${parsed.text || '(no body)'}`,
      });
      active.activityLog.push({
        action: 'replied',
        agent:  name,
        detail: `User sent follow-up email (no agent reply yet): "${subject}"`,
      });
      await active.save();

      await sendEmail(email,
        `[${active.ticketId}] We've received your message — ${BRAND} Support`,
        `Hi ${name},\n\nThank you for following up. Our team has your ticket ${active.ticketId} and will respond within 24–48 hours.\n\nPlease avoid sending multiple emails as it does not speed up the process — your ticket is already in our queue.\n\n---\n${BRAND} Support`,
        patienceHtml(name, active)
      );

      // Keep email in inbox — mark Seen so it doesn't re-process, but agent can still read it
      await addFlag(connection, uid, '\\Seen');
      return;
    }
  }

  // ── CASE C: Closed ticket ─────────────────────────────────────────────────
  const lastClosed = await SupportTicket.findOne(
    { email, status: 'closed' }, {}, { sort: { closedAt: -1 } }
  );

  if (lastClosed) {
    console.log(`IMAP: Closed ticket ${lastClosed.ticketId} — sending redirect + deleting`);
    await sendEmail(email,
      `Your previous ticket is closed — ${BRAND} Support`,
      `Hi ${name},\n\nYour previous ticket ${lastClosed.ticketId} has been resolved and closed.\nPlease create a new ticket:\n${WEBSITE_URL}\n\n---\n${BRAND} Support`,
      closedTicketHtml(name, lastClosed)
    );
    await addFlag(connection, uid, '\\Deleted');
    await expunge(connection);
    return;
  }

  // ── CASE D: No ticket at all — send "create account" auto-reply, then delete ──
  console.log(`IMAP: No ticket for ${email} — sending "create account" reply + deleting`);
  await sendEmail(
    email,
    `Get support via SplitWise — ${BRAND} Support`,
    `Hi ${name},\n\nThank you for reaching out to ${BRAND} Support!\n\nIt looks like you don't have a ${BRAND} account yet, or your message was sent directly to this inbox.\n\nTo get help, please:\n1. Create a free account at our website\n2. Log in and submit your query through our support form\n\nVisit: ${WEBSITE_URL}\n\nOur team will respond to all website submissions within 24–48 hours.\n\n---\n${BRAND} Support`,
    noAccountHtml(name)
  );
  await addFlag(connection, uid, '\\Deleted');
  await expunge(connection);
}

// ─── IMAP helpers ─────────────────────────────────────────────────────────────
async function addFlag(connection, uid, flag) {
  try { await connection.addFlags(uid, [flag]); }
  catch (e) { console.error('IMAP addFlags error:', e.message); }
}

async function expunge(connection) {
  try {
    await new Promise((resolve, reject) => {
      connection.imap.expunge((err) => err ? reject(err) : resolve());
    });
  } catch (e) {
    console.error('IMAP expunge error:', e.message);
  }
}

// ─── Shared email shell ───────────────────────────────────────────────────────
// icon: emoji  |  iconLabel: e.g. "SplitWise Support"  |  accentColor: gradient start
function shell(icon, iconLabel, headline, bodyHtml, accentColor = PURPLE) {
  const grad = `linear-gradient(135deg,${accentColor} 0%,#764ba2 100%)`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${BRAND} Support</title>
  <style>
    @media screen and (max-width:600px){
      .card  { border-radius:0 !important; }
      .hpad  { padding:24px 16px 20px !important; }
      .bpad  { padding:22px 18px !important; }
      .badge { padding:14px 20px !important; }
      .h1    { font-size:17px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf0f7;">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" class="card"
           style="max-width:560px;width:100%;background:#fff;border-radius:22px;overflow:hidden;
                  box-shadow:0 20px 60px rgba(102,126,234,0.18);">

      <!-- Header -->
      <tr><td class="hpad" style="background:${grad};padding:32px 24px 26px;text-align:center;">
        <!-- Frosted-glass badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
          <tr><td class="badge" align="center"
                  style="background:rgba(255,255,255,0.18);
                         border:1.5px solid rgba(255,255,255,0.38);
                         border-radius:18px;padding:16px 28px;">
            <div style="font-size:36px;line-height:1;margin-bottom:8px;">${icon}</div>
            <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:0.5px;
                        white-space:nowrap;font-family:Arial,sans-serif;">${iconLabel}</div>
          </td></tr>
        </table>
        <h1 class="h1" style="margin:0;color:#fff;font-size:20px;font-weight:900;
                   line-height:1.3;font-family:Arial,sans-serif;">${headline}</h1>
      </td></tr>

      <!-- Body -->
      <tr><td class="bpad" style="padding:28px 30px;font-family:Arial,sans-serif;">
        ${bodyHtml}
        <p style="margin:22px 0 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.65;">
          Automated message from <strong style="color:${PURPLE};">${BRAND} Support</strong>.
          Please do not reply directly to this email.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:14px 24px;background:#f8f9fc;border-top:1px solid #e5e7eb;
                     text-align:center;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif;">
        &copy; ${new Date().getFullYear()} ${BRAND} &nbsp;&middot;&nbsp; All rights reserved
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Email templates ──────────────────────────────────────────────────────────

function patienceHtml(name, ticket) {
  return shell('⏳', `${BRAND} Support`, `We have your message, ${name}!`, `
    <p style="color:#374151;font-size:14px;line-height:1.75;margin:0 0 16px;">
      Thank you for following up. Your ticket is in our queue and being reviewed.
    </p>
    <div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-left:5px solid ${PURPLE};
                border-radius:12px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#4338ca;
                text-transform:uppercase;letter-spacing:1.5px;">Your Ticket</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:22px;font-weight:900;
                color:#1e1b4b;letter-spacing:3px;">${ticket.ticketId}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${ticket.subject}</p>
    </div>
    <div style="background:#fefce8;border:1.5px solid #fde68a;border-left:5px solid #f59e0b;
                border-radius:12px;padding:14px 18px;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.7;">
        ⏱ <strong>Please be patient.</strong> Our team responds within
        <strong>24–48 hours</strong>. Sending more emails will not speed up the process.
      </p>
    </div>
    <p style="font-size:13px;color:#374151;line-height:1.7;margin:0;">
      To add information, <strong>reply to your original ticket confirmation email</strong>
      so it stays linked to <strong style="color:${PURPLE};">${ticket.ticketId}</strong>.
    </p>
  `, '#f59e0b');
}

function closedTicketHtml(name, ticket) {
  return shell('🔒', `${BRAND} Support`, `Your ticket is resolved, ${name}`, `
    <p style="color:#374151;font-size:14px;line-height:1.75;margin:0 0 16px;">
      Your previous support ticket has been resolved and closed. For a new issue, please create a fresh ticket.
    </p>
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-left:5px solid #10b981;
                border-radius:12px;padding:14px 18px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#059669;
                text-transform:uppercase;letter-spacing:1px;">✅ Resolved</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;font-weight:900;
                color:#065f46;letter-spacing:3px;">${ticket.ticketId}</p>
    </div>
    <div style="text-align:center;margin-bottom:6px;">
      <a href="${WEBSITE_URL}" style="display:inline-block;
                background:linear-gradient(135deg,${PURPLE},#764ba2);
                color:#fff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:10px;
                text-decoration:none;letter-spacing:.3px;">Create a New Ticket</a>
    </div>
  `, '#10b981');
}

function noAccountHtml(name) {
  const SIGNUP_URL = (process.env.FRONTEND_URL || 'https://splitwise.space') + '/signup.html';
  return shell('👋', `${BRAND} Support`, `Hi ${name}, we received your email!`, `
    <p style="color:#374151;font-size:14px;line-height:1.75;margin:0 0 16px;">
      Thanks for reaching out to <strong>${BRAND} Support</strong>! To make sure we can help
      you as quickly as possible, all support requests are handled through our
      <strong>website ticketing system</strong>.
    </p>
    <div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-left:5px solid ${PURPLE};
                border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:#4338ca;
                text-transform:uppercase;letter-spacing:1px;">How to get support</p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151;line-height:1.65;">
        <strong style="color:${PURPLE};">Step 1:</strong>
        <a href="${SIGNUP_URL}" style="color:${PURPLE};font-weight:700;">Create a free ${BRAND} account</a>
        (or log in if you already have one)
      </p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">
        <strong style="color:${PURPLE};">Step 2:</strong>
        Visit our <a href="${WEBSITE_URL}" style="color:${PURPLE};font-weight:700;">Support Form</a>
        and submit your query — our team will respond within <strong>24–48 hours</strong>.
      </p>
    </div>
    <div style="text-align:center;margin-bottom:6px;">
      <a href="${WEBSITE_URL}"
         style="display:inline-block;background:linear-gradient(135deg,${PURPLE},#764ba2);
                color:#fff;font-weight:800;font-size:13px;padding:13px 32px;border-radius:10px;
                text-decoration:none;letter-spacing:.3px;">Submit a Support Ticket →</a>
    </div>
    <p style="font-size:12px;color:#9ca3af;text-align:center;margin:16px 0 0;line-height:1.6;">
      Direct emails to this address are not monitored for new issue reports.<br>
      Please use the form above so your request is tracked and prioritised.
    </p>
  `);
}

function noreplyBounceHtml(name, originalSubject) {
  return shell('📩', `${BRAND}`, `This address does not accept replies`, `
    <p style="color:#374151;font-size:14px;line-height:1.75;margin:0 0 16px;">
      Hi <strong>${name}</strong>, you recently replied to an automated email from
      <strong style="color:${PURPLE};">noreply@splitwise.space</strong>.
    </p>
    <div style="background:#fef3c7;border:1.5px solid #fde68a;border-left:5px solid #f59e0b;
                border-radius:12px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.7;">
        ⚠️ <strong>This address is not monitored.</strong> Replies sent to this address
        are not received by our team.
      </p>
    </div>
    <p style="color:#374151;font-size:13px;line-height:1.75;margin:0 0 16px;">
      If you need help or have a question, please use our support portal:
    </p>
    <div style="text-align:center;margin-bottom:6px;">
      <a href="${WEBSITE_URL}"
         style="display:inline-block;background:linear-gradient(135deg,${PURPLE},#764ba2);
                color:#fff;font-weight:800;font-size:13px;padding:13px 32px;border-radius:10px;
                text-decoration:none;letter-spacing:.3px;">Visit Support Portal →</a>
    </div>
    <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0;">
      Original subject: ${originalSubject}
    </p>
  `, '#f59e0b');
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function startImapPoller() {
  if (isRunning) return;
  isRunning = true;
  runImapWatcher();
}
