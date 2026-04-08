import { Router } from 'express';
import { z } from 'zod';
import { sendEmail, sendSupportEmail } from '../utils/mailer.js';
import { createStandardResponse } from '../utils/responses.js';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

export const contactRouter = Router();

// ─── Design tokens ────────────────────────────────────────────────────────────
const PURPLE  = '#667eea';
const VIOLET  = '#764ba2';
const GRAD    = `linear-gradient(135deg,${PURPLE} 0%,${VIOLET} 100%)`;
const SUPPORT = process.env.MAIL_SUPPORT || 'support.splitwise@gmail.com';
const BRAND   = process.env.MAIL_FROM_NAME || 'SplitWise';
const YEAR    = new Date().getFullYear();
// Website URL shown in emails — override via env
const WEBSITE_URL = (process.env.FRONTEND_URL || 'https://splitwise.space') + '/contact.html';

// ─── Core responsive email shell ─────────────────────────────────────────────
// Works in Gmail, Outlook, Apple Mail, mobile & desktop
function shell(opts) {
  const {
    headerGrad = GRAD,
    headerIcon = '📬',
    headerLabel = 'SplitWise',
    headerSub = '',
    body = '',
    footerExtra = '',
  } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${BRAND}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    * { box-sizing: border-box; }
    @media screen and (max-width:620px){
      .email-wrap   { padding: 0 !important; }
      .email-card   { border-radius: 0 !important; width: 100% !important; }
      .header-pad   { padding: 28px 20px 24px !important; }
      .icon-wrap    { width: 52px !important; height: 52px !important;
                      line-height: 52px !important; font-size: 24px !important; }
      .h1           { font-size: 19px !important; }
      .email-body   { padding: 24px 18px !important; }
      .email-footer { padding: 16px 18px !important; }
      .ticket-badge { font-size: 18px !important; letter-spacing: 2px !important; }
      .btn-cell     { display: block !important; width: 100% !important;
                      padding: 0 0 10px !important; }
      .btn-a        { display: block !important; width: 100% !important;
                      text-align: center !important; box-sizing: border-box !important;
                      padding: 15px 20px !important; }
      .info-table td{ font-size: 13px !important; }
      .step-td      { font-size: 13px !important; padding: 5px 0 !important; }
      .why-label    { font-size: 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#edf0f7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#edf0f7"><tr><td><![endif]-->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
       style="background:#edf0f7;min-width:100%;">
  <tr>
    <td class="email-wrap" align="center" valign="top" style="padding:32px 12px;">

      <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="margin:0 auto;"><tr><td><![endif]-->
      <!-- Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"
             class="email-card"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;
                    overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,0.16);
                    margin:0 auto;">

        <!-- ══ HEADER ══ -->
        <tr>
          <td class="header-pad"
              style="background:${headerGrad};padding:36px 40px 30px;text-align:center;">

            <!-- Frosted-glass badge — centers on mobile/tablet/desktop -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                   style="margin-bottom:16px;">
              <tr>
                <td align="center">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center"
                          style="background:rgba(255,255,255,0.18);
                                 border:1.5px solid rgba(255,255,255,0.38);
                                 border-radius:18px;
                                 padding:16px 28px;">
                        <!--[if mso]>
                        <div style="font-size:34px;line-height:1;font-family:Arial;">${headerIcon}</div>
                        <div style="font-size:13px;font-weight:700;color:#fff;font-family:Arial;">${headerLabel}</div>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <div style="font-size:34px;line-height:1;margin-bottom:8px;font-family:Arial,sans-serif;">${headerIcon}</div>
                        <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:0.5px;
                                    white-space:nowrap;font-family:Arial,sans-serif;">${headerLabel}</div>
                        <!--<![endif]-->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <h1 class="h1" style="margin:0;color:#ffffff;font-size:22px;font-weight:900;
                       letter-spacing:-0.3px;line-height:1.2;text-align:center;
                       font-family:Arial,sans-serif;">
              ${headerSub || ''}
            </h1>

          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td class="email-body" style="padding:36px 40px;text-align:left;
                                        font-family:Arial,sans-serif;">
            ${body}
          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td class="email-footer" style="background:#f5f6fb;border-top:2px solid #ece9ff;
                     padding:22px 40px;text-align:center;font-family:Arial,sans-serif;">
            ${footerExtra
              ? `<p style="margin:0 0 10px;font-size:13px;color:#555;text-align:center;">${footerExtra}</p>`
              : ''}
            <p style="margin:0 0 6px;font-size:12.5px;color:#6c757d;text-align:center;">
              Questions? Email us at
              <a href="mailto:${SUPPORT}"
                 style="color:${PURPLE};font-weight:700;text-decoration:none;">${SUPPORT}</a>
            </p>
            <p style="margin:0;font-size:11.5px;color:#b0b9cc;text-align:center;">
              <strong style="color:${PURPLE};">${BRAND}</strong>
              &nbsp;·&nbsp; © ${YEAR} All rights reserved
              &nbsp;·&nbsp; This is an automated message
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->
      <!--[if mso | IE]></td></tr></table><![endif]-->

    </td>
  </tr>
</table>
<!--[if mso | IE]></td></tr></table><![endif]-->

</body>
</html>`;
}

// ─── Reusable block: TICKET CARD ─────────────────────────────────────────────
function ticketCard(ticketId, dateStr, subject, status = 'OPEN', statusGrad = GRAD) {
  return `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
         style="background:linear-gradient(135deg,rgba(102,126,234,0.07) 0%,rgba(118,75,162,0.07) 100%);
                border:1.5px solid #ddd9ff;border-radius:16px;margin-bottom:20px;overflow:hidden;">
    <tr>
      <td style="padding:20px 22px;text-align:left;vertical-align:middle;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:${PURPLE};
                  text-transform:uppercase;letter-spacing:2px;text-align:left;">Support Ticket</p>
        <p class="ticket-badge"
           style="margin:0;font-size:24px;font-weight:900;color:${VIOLET};
                  font-family:'Courier New',Courier,monospace;letter-spacing:4px;text-align:left;">
          ${ticketId}
        </p>
        <p style="margin:6px 0 0;font-size:11.5px;color:#9ca3af;text-align:left;">
          Opened: ${dateStr} IST
        </p>
        ${subject ? `<p style="margin:4px 0 0;font-size:12px;color:#6c757d;text-align:left;">Subject: <strong>${subject}</strong></p>` : ''}
      </td>
      <td style="padding:20px 22px;text-align:right;vertical-align:middle;white-space:nowrap;">
        <span style="display:inline-block;background:${statusGrad};color:#fff;
                     font-size:10.5px;font-weight:800;padding:5px 14px;
                     border-radius:20px;letter-spacing:0.5px;">
          ${status}
        </span>
      </td>
    </tr>
  </table>`;
}

// ─── Reusable block: STEPS LIST ───────────────────────────────────────────────
function stepsList(steps) {
  return `
  <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;
              padding:18px 20px;margin-bottom:20px;">
    <p class="why-label" style="margin:0 0 12px;font-size:10.5px;font-weight:900;color:#15803d;
              text-transform:uppercase;letter-spacing:1px;">✅ What happens next</p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      ${steps.map((s, i) => `
      <tr>
        <td class="step-td" style="padding:4px 0;font-size:13px;color:#166534;
                                   vertical-align:top;text-align:left;
                                   font-family:Arial,sans-serif;">
          <span style="display:inline-block;width:20px;height:20px;min-width:20px;
                       background:#22c55e;border-radius:50%;color:#fff;
                       font-size:10px;font-weight:900;text-align:center;line-height:20px;
                       margin-right:8px;font-family:Arial,sans-serif;">${i + 1}</span
          >${s}
        </td>
      </tr>`).join('')}
    </table>
  </div>`;
}

// ─── Reusable block: CTA BUTTON (full-width on mobile) ───────────────────────
function ctaButton(href, label, grad = GRAD) {
  return `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
         style="margin:24px 0 0;">
    <tr>
      <td align="center">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}"
          style="height:48px;v-text-anchor:middle;width:280px;" arcsize="25%"
          fillcolor="#667eea" strokecolor="#667eea"><v:textbox inset="0px,0px,0px,0px">
          <center style="color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">${label}</center>
          </v:textbox></v:roundrect><![endif]-->
        <!--[if !mso]><!-->
        <a class="btn-a" href="${href}"
           style="display:inline-block;padding:15px 36px;background:${grad};
                  color:#ffffff;text-decoration:none;border-radius:12px;
                  font-weight:800;font-size:14px;font-family:Arial,sans-serif;
                  box-shadow:0 6px 20px rgba(102,126,234,0.32);
                  text-align:center;max-width:300px;width:auto;">
          ${label}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

// ─── Reusable block: INFO BOX ─────────────────────────────────────────────────
function infoBox(color, borderColor, items) {
  return `
  <div style="background:${color};border:1.5px solid ${borderColor};
              border-radius:12px;padding:16px 20px;margin-bottom:20px;">
    <ul style="margin:0;padding-left:18px;font-size:13px;line-height:2.1;color:#374151;">
      ${items.map(i => `<li>${i}</li>`).join('')}
    </ul>
  </div>`;
}

// ─── NEW TICKET email (to user) ───────────────────────────────────────────────
function newTicketEmail(name, ticketId, subject, message, dateStr) {
  return shell({
    headerGrad: GRAD, headerIcon: '🎫',
    headerLabel: `${BRAND} Support`,
    headerSub: 'Ticket Confirmed',
    body: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1a1f36;line-height:1.3;">
        We've got your message, ${name}! 👋
      </h2>
      <p style="margin:0 0 24px;font-size:14.5px;color:#6c757d;line-height:1.75;">
        Our support team will review your request and respond within
        <strong style="color:#2c3e50;">24–48 hours</strong>.
      </p>

      ${ticketCard(ticketId, dateStr, subject, '🟢 OPEN', GRAD)}

      <!-- Reply callout -->
      <div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-left:5px solid #667eea;
                  border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:900;color:#4338ca;
                  text-transform:uppercase;letter-spacing:1px;">💬 How to follow up</p>
        <p style="margin:0;font-size:13.5px;color:#374151;line-height:1.8;">
          <strong>Simply reply to this email</strong> to add more details or follow up with our support team.
          <br>Your replies go directly to us and are linked to ticket
          <strong style="color:#667eea;">${ticketId}</strong>.
          <br><span style="color:#6b7280;font-size:12px;">
            This thread stays open until your ticket is marked resolved.
          </span>
        </p>
      </div>

      <div style="border:1px solid #e9ecef;border-radius:14px;overflow:hidden;margin-bottom:20px;">
        <div style="background:#f8f9fc;padding:10px 18px;border-bottom:1px solid #e9ecef;">
          <p style="margin:0;font-size:10px;font-weight:800;color:#6c757d;
                    text-transform:uppercase;letter-spacing:1.5px;">Your Message</p>
        </div>
        <div style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:13px;color:#6c757d;">
            Subject: <strong style="color:#2c3e50;">${subject}</strong>
          </p>
          <p style="margin:0;font-size:13px;color:#495057;line-height:1.8;white-space:pre-line;">
            ${(message || '').substring(0, 320)}${(message || '').length > 320 ? '…' : ''}
          </p>
        </div>
      </div>

      ${stepsList([
        'A support agent reviews your request',
        'You\'ll receive a personal reply to this email within 24–48 hrs',
        `Reply directly to this email to send follow-ups (ticket: <strong>${ticketId}</strong>)`,
      ])}

      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
        Manage your account at
        <a href="${WEBSITE_URL}" style="color:${PURPLE};font-weight:700;text-decoration:none;">${BRAND}</a>
      </p>
    `,
  });
}

// ─── DUPLICATE TICKET email (to user) ────────────────────────────────────────
function duplicateEmail(name, ticket) {
  const dateStr = new Date(ticket.createdAt).toLocaleString('en-IN',
    { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  return shell({
    headerGrad: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)',
    headerIcon: '🔔', headerLabel: `${BRAND} Support`, headerSub: 'Open Ticket Found',
    body: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1a1f36;line-height:1.3;">
        You already have an open ticket, ${name}!
      </h2>
      <p style="margin:0 0 24px;font-size:14.5px;color:#6c757d;line-height:1.75;">
        We found an existing open request from your email.
        Our team is already working on it — no need to submit again.
      </p>

      ${ticketCard(ticket.ticketId, dateStr, ticket.subject, '⏳ PENDING',
        'linear-gradient(135deg,#f59e0b,#d97706)')}

      <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-left:5px solid #f59e0b;
                  border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:900;color:#92400e;">💡 What you should do</p>
        ${infoBox('#fffbeb', '#fcd34d', [
          'Wait for our team to reply — they\'re on it!',
          'Reply to your original ticket email to add more info',
          'You can open a new ticket once this one is closed',
        ])}
      </div>
    `,
  });
}

// ─── REOPENED TICKET email (to user — closed ticket + brand new one created) ──
function reopenedTicketEmail(name, newTicket, closedTicket, newDateStr, closedDateStr) {
  return shell({
    headerGrad: `linear-gradient(135deg,${PURPLE} 0%,${VIOLET} 100%)`,
    headerIcon: '🔁', headerLabel: `${BRAND} Support`, headerSub: 'New Ticket Created',
    body: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1a1f36;line-height:1.3;">
        Welcome back, ${name}! 👋
      </h2>
      <p style="margin:0 0 24px;font-size:14.5px;color:#6c757d;line-height:1.75;">
        We see your previous ticket was resolved. We've created a new ticket for your latest request.
      </p>

      <!-- Closed ticket reference -->
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;
                  padding:16px 20px;margin-bottom:14px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#15803d;
                  text-transform:uppercase;letter-spacing:2px;">✅ Previously Resolved</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:16px;font-weight:900;
                  color:#059669;letter-spacing:2px;">${closedTicket.ticketId}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">
          ${closedTicket.subject} &nbsp;·&nbsp; Closed ${closedDateStr}
        </p>
      </div>

      <!-- New ticket -->
      ${ticketCard(newTicket.ticketId, newDateStr, newTicket.subject, '🟢 OPEN', GRAD)}

      <!-- Reply callout -->
      <div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-left:5px solid #667eea;
                  border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:900;color:#4338ca;
                  text-transform:uppercase;letter-spacing:1px;">💬 How to follow up</p>
        <p style="margin:0;font-size:13.5px;color:#374151;line-height:1.8;">
          <strong>Simply reply to this email</strong> to contact our support team.
          <br>Your replies are linked to ticket <strong style="color:#667eea;">${newTicket.ticketId}</strong>.
          <br><span style="color:#6b7280;font-size:12px;">Thread stays open until this ticket is resolved.</span>
        </p>
      </div>

      ${stepsList([
        'A support agent reviews your new request',
        'You\'ll receive a reply to this email within 24–48 hrs',
        `Reply directly here to send follow-ups (ticket: <strong>${newTicket.ticketId}</strong>)`,
      ])}

      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
        Manage your account at
        <a href="${WEBSITE_URL}" style="color:${PURPLE};font-weight:700;text-decoration:none;">${BRAND}</a>
      </p>
    `,
  });
}

// ─── TICKET CLOSED email (to user) ───────────────────────────────────────────
function closedEmail(name, ticketId, subject) {
  return shell({
    headerGrad: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    headerIcon: '✅', headerLabel: `${BRAND} Support`, headerSub: 'Ticket Resolved',
    body: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1a1f36;line-height:1.3;">
        Your ticket has been resolved, ${name}!
      </h2>
      <p style="margin:0 0 24px;font-size:14.5px;color:#6c757d;line-height:1.75;">
        We hope your issue has been resolved. If you need further assistance,
        you're welcome to open a new support ticket anytime.
      </p>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
             style="background:linear-gradient(135deg,rgba(16,185,129,0.07),rgba(5,150,105,0.07));
                    border:1.5px solid #6ee7b7;border-radius:16px;margin-bottom:20px;overflow:hidden;">
        <tr>
          <td style="padding:20px 22px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#059669;
                      text-transform:uppercase;letter-spacing:2px;">Closed Ticket</p>
            <p class="ticket-badge"
               style="margin:0;font-size:24px;font-weight:900;color:#065f46;
                      font-family:'Courier New',Courier,monospace;letter-spacing:4px;">${ticketId}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6c757d;">
              Subject: <strong>${subject}</strong>
            </p>
          </td>
          <td style="padding:20px 22px;text-align:right;vertical-align:middle;white-space:nowrap;">
            <span style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);
                         color:#fff;font-size:10.5px;font-weight:800;padding:5px 14px;
                         border-radius:20px;">🔒 CLOSED</span>
          </td>
        </tr>
      </table>

      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;
                  padding:16px 20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0;font-size:13.5px;color:#166534;line-height:1.7;">
          Thank you for using <strong>${BRAND} Support</strong>. We hope to see you around! 😊
        </p>
      </div>

      ${ctaButton(WEBSITE_URL, `↗ Back to ${BRAND}`, GRAD)}
    `,
  });
}

// ─── WEBSITE REDIRECT email (when someone emails support directly) ────────────
// This is returned as HTML so the Gmail vacation responder can show it.
// You can also call sendWebsiteRedirectEmail() server-side if needed.
function websiteRedirectEmail(recipientType = 'support') {
  const isNoreply = recipientType === 'noreply';

  const headline = isNoreply
    ? 'This inbox is not monitored 🚫'
    : 'Please use our website to get support 🌐';

  const subtext = isNoreply
    ? `You've replied to <strong>${process.env.MAIL_USER || 'splitwise.noreply@gmail.com'}</strong>,
       which is an automated sending address that is <strong style="color:#ef4444;">not monitored</strong>.
       Messages sent here will not be seen by our team.`
    : `To ensure your query is tracked and responded to promptly,
       please use our official website contact form instead of emailing us directly.`;

  const infoItems = isNoreply
    ? [
        `This address only sends automated emails (OTPs, receipts, notifications)`,
        `Replies to this address are <strong>not delivered to any inbox</strong>`,
        `For help, use the website contact form to create a support ticket`,
      ]
    : [
        `Direct emails are not tracked and may be missed`,
        `Our website form creates a ticket with a reference number`,
        `You'll get an instant confirmation and response within 24–48 hours`,
      ];

  return shell({
    headerGrad: isNoreply
      ? 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)'
      : 'linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)',
    headerIcon: isNoreply ? '🚫' : '🌐',
    headerLabel: `${BRAND}`,
    headerSub: isNoreply ? 'Unmonitored Address' : 'Use Our Website',
    body: `
      <h2 style="margin:0 0 10px;font-size:20px;font-weight:900;color:#1a1f36;line-height:1.3;">
        ${headline}
      </h2>
      <p style="margin:0 0 22px;font-size:14.5px;color:#6c757d;line-height:1.75;">
        ${subtext}
      </p>

      <div style="background:${isNoreply ? '#fef2f2' : '#f5f3ff'};
                  border:1.5px solid ${isNoreply ? '#fca5a5' : '#c4b5fd'};
                  border-left:5px solid ${isNoreply ? '#ef4444' : '#8b5cf6'};
                  border-radius:12px;padding:16px 20px;margin-bottom:22px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:900;
                  color:${isNoreply ? '#991b1b' : '#5b21b6'};">
          ${isNoreply ? '⚠️ Important notice' : '💡 Why use the website?'}
        </p>
        <ul style="margin:0;padding-left:18px;font-size:13px;
                   color:${isNoreply ? '#991b1b' : '#5b21b6'};line-height:2.1;">
          ${infoItems.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>

      <div style="background:#f8f9fc;border:1px solid #e9ecef;border-radius:14px;
                  padding:20px;margin-bottom:22px;text-align:center;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#6c757d;
                  text-transform:uppercase;letter-spacing:1px;">Create a support ticket</p>
        <p style="margin:0 0 16px;font-size:13.5px;color:#495057;">
          Visit our website and use the <strong>Contact Us</strong> form — it takes under a minute.
        </p>
        ${ctaButton(`${WEBSITE_URL}#contact`, '📝 Create Support Ticket',
          isNoreply
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : 'linear-gradient(135deg,#8b5cf6,#7c3aed)')}
      </div>

      <p style="margin:0;font-size:12.5px;color:#9ca3af;text-align:center;">
        For urgent matters, you can also email
        <a href="mailto:${SUPPORT}" style="color:${PURPLE};font-weight:700;text-decoration:none;">${SUPPORT}</a>
        directly — but using the contact form is faster.
      </p>
    `,
  });
}

// ─── SUPPORT TEAM NOTIFICATION (with close button) ───────────────────────────
function supportNotifEmail(name, email, ticketId, subject, message, dateStr, closeUrl) {
  return shell({
    headerGrad: 'linear-gradient(135deg,#0f9b8e 0%,#38ef7d 100%)',
    headerIcon: '📩', headerLabel: `${BRAND}`, headerSub: 'New Support Ticket',
    body: `
      <div style="background:#fff8e1;border:1.5px solid #ffd54f;border-radius:12px;
                  padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#e65100;">
          🔔 New ticket — please respond within 24–48 hours
        </p>
      </div>

      <!-- Ticket badge row -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"
             width="100%" style="margin-bottom:20px;">
        <tr>
          <td style="vertical-align:middle;">
            <span style="display:inline-block;background:${GRAD};color:#fff;
                         font-family:'Courier New',monospace;font-weight:900;
                         font-size:16px;letter-spacing:3px;padding:10px 20px;
                         border-radius:12px;">${ticketId}</span>
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <p style="margin:0;font-size:11.5px;color:#6c757d;">Opened ${dateStr} IST</p>
          </td>
        </tr>
      </table>

      <!-- Sender info -->
      <div style="border:1px solid #e9ecef;border-radius:14px;overflow:hidden;margin-bottom:18px;">
        <div style="background:#f8f9fc;padding:10px 18px;border-bottom:1px solid #e9ecef;">
          <p style="margin:0;font-size:10px;font-weight:800;color:#6c757d;
                    text-transform:uppercase;letter-spacing:1.5px;">Sender</p>
        </div>
        <div style="padding:14px 18px;">
          <table class="info-table" role="presentation" border="0"
                 cellpadding="5" cellspacing="0" width="100%" style="font-size:13.5px;">
            <tr>
              <td style="color:#6c757d;width:75px;vertical-align:top;">Name</td>
              <td style="color:#2c3e50;font-weight:700;">${name}</td>
            </tr>
            <tr>
              <td style="color:#6c757d;vertical-align:top;">Email</td>
              <td>
                <a href="mailto:${email}"
                   style="color:${PURPLE};font-weight:700;text-decoration:none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="color:#6c757d;vertical-align:top;">Subject</td>
              <td style="color:#2c3e50;font-weight:600;">${subject}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Message body -->
      <div style="border:1px solid #e9ecef;border-radius:14px;overflow:hidden;margin-bottom:22px;">
        <div style="background:#f8f9fc;padding:10px 18px;border-bottom:1px solid #e9ecef;">
          <p style="margin:0;font-size:10px;font-weight:800;color:#6c757d;
                    text-transform:uppercase;letter-spacing:1.5px;">Message</p>
        </div>
        <div style="padding:18px;font-size:13.5px;color:#495057;
                    line-height:1.85;white-space:pre-line;">${message}</div>
      </div>

      <!-- Action buttons -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td class="btn-cell" style="padding-right:7px;width:50%;vertical-align:top;">
            <a class="btn-a"
               href="mailto:${email}?subject=Re%3A%20[${ticketId}]%20${encodeURIComponent(subject)}&body=Hi%20${encodeURIComponent(name)}%2C%0A%0A"
               style="display:block;padding:13px 10px;background:${GRAD};
                      color:#fff;text-decoration:none;border-radius:12px;
                      font-weight:800;font-size:13px;text-align:center;
                      box-shadow:0 4px 14px rgba(102,126,234,0.3);">
              📧 Reply to ${name}
            </a>
          </td>
          <td class="btn-cell" style="padding-left:7px;width:50%;vertical-align:top;">
            <a class="btn-a" href="${closeUrl}"
               style="display:block;padding:13px 10px;
                      background:linear-gradient(135deg,#ef4444,#dc2626);
                      color:#fff;text-decoration:none;border-radius:12px;
                      font-weight:800;font-size:13px;text-align:center;
                      box-shadow:0 4px 14px rgba(239,68,68,0.28);">
              🔒 Close Ticket
            </a>
          </td>
        </tr>
      </table>
    `,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Returns one of three states:
 *   { ticket, isDuplicate: true }       — user already has an OPEN ticket
 *   { ticket, isReopened: true, newTicket } — user's last ticket was CLOSED; creates a new one
 *   { ticket, isNew: true }             — brand new ticket just created
 */
async function resolveTicket({ name, email, subject, message }) {
  const lowerEmail = email.toLowerCase();

  // 1. Check for existing OPEN ticket (duplicate)
  const open = await SupportTicket.findOne({ email: lowerEmail, status: 'open' });
  if (open) return { ticket: open, isDuplicate: true };

  // 2. Check for the most recent CLOSED ticket (inform user it was resolved, create new)
  const lastClosed = await SupportTicket.findOne(
    { email: lowerEmail, status: 'closed' },
    {},
    { sort: { closedAt: -1 } }
  );

  // 3. Create a fresh ticket
  const ticketNum = await SupportTicket.nextTicketNum();
  const ticketId  = `SW-${ticketNum}`;
  const newTicket = await SupportTicket.create({
    ticketId, ticketNum, name, email: lowerEmail, subject, message, source: 'website',
  });

  if (lastClosed) {
    return { ticket: newTicket, isReopened: true, closedTicket: lastClosed };
  }
  return { ticket: newTicket, isNew: true };
}

function backendBase(req) {
  return process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
}

function fmt(date) {
  return new Date(date).toLocaleString('en-IN',
    { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}

// ─── POST /api/contact/check-email  (verify user has a registered account) ───
// Used by frontend modal to gate ticket creation to registered users only.
contactRouter.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json(createStandardResponse(false, null, 'email is required'));

    const lower = email.toLowerCase().trim();
    const user  = await User.findOne({ email: lower }, { name: 1, email: 1 });

    if (user) {
      return res.json(createStandardResponse(true, {
        exists: true,
        name: user.name,
        email: user.email,
      }));
    }
    return res.json(createStandardResponse(true, { exists: false }));
  } catch (err) {
    console.error('check-email error:', err);
    return res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ─── POST /api/contact  (website contact form) ────────────────────────────────
const contactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters'),
  email:   z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

contactRouter.post('/', async (req, res) => {
  try {
    const parse = contactSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json(createStandardResponse(false, null,
        parse.error.errors.map(e => e.message).join(', ')));

    const { name, email, subject, message } = parse.data;
    const result = await resolveTicket({ name, email, subject, message });

    // ── CASE 1: already have an open ticket ───────────────────────────────────
    if (result.isDuplicate) {
      const { ticket } = result;
      await sendEmail(email,
        `[${ticket.ticketId}] Your ticket is still open — ${BRAND} Support`,
        `Hi ${name},\n\nYou already have open ticket ${ticket.ticketId} (${ticket.subject}).\n` +
        `Our team is working on it and will reply to your original email.\n\n` +
        `Please wait for a reply or check your original confirmation email.\n\n---\n${BRAND} Support`,
        duplicateEmail(name, ticket));
      return res.json(createStandardResponse(true, {
        ticketId: ticket.ticketId, duplicate: true,
        message: `Open ticket ${ticket.ticketId} already exists. Check your email for details.`,
      }));
    }

    const { ticket } = result;
    const dateStr  = fmt(ticket.createdAt);
    const closeUrl = `${backendBase(req)}/api/contact/close/${ticket.ticketId}?key=${process.env.ADMIN_CLOSE_SECRET}`;

    // ── CASE 2: previous ticket was closed — fresh ticket created ─────────────
    if (result.isReopened) {
      const { closedTicket } = result;
      const closedDateStr = fmt(closedTicket.closedAt);

      await Promise.all([
        // User confirmation (from support, replyable)
        sendSupportEmail(email,
          `[${ticket.ticketId}] New ticket created — ${BRAND} Support`,
          `Hi ${name},\n\nYour previous ticket ${closedTicket.ticketId} was resolved on ${closedDateStr}.\n` +
          `We've created a new ticket: ${ticket.ticketId}\nSubject: ${subject}\n\n` +
          `Reply to this email to follow up with our support team.\n\n---\n${BRAND} Support`,
          reopenedTicketEmail(name, ticket, closedTicket, dateStr, closedDateStr))
          .then(async sent => {
            // Store Message-ID for future threading
            if (sent?.sentMessageId) {
              await SupportTicket.findByIdAndUpdate(ticket._id,
                { confirmationMessageId: sent.sentMessageId });
            }
          }),

        // Admin notification
        sendEmail(SUPPORT,
          `[${ticket.ticketId}] New Ticket (returning user): ${subject}`,
          `[${ticket.ticketId}] From: ${name} <${email}>\nPrev ticket: ${closedTicket.ticketId}\n\n${message}`,
          supportNotifEmail(name, email, ticket.ticketId, subject, message, dateStr, closeUrl),
          email),
      ]);

      return res.json(createStandardResponse(true, {
        ticketId: ticket.ticketId, reopened: true,
        message: `New ticket ${ticket.ticketId} created. Check your email for confirmation.`,
      }));
    }

    // ── CASE 3: brand new ticket ──────────────────────────────────────────────
    await Promise.all([
      sendSupportEmail(email,
        `[${ticket.ticketId}] We received your message — ${BRAND} Support`,
        `Hi ${name},\n\nTicket: ${ticket.ticketId}\nSubject: ${subject}\n\n` +
        `We'll respond within 24–48 hours.\n\n` +
        `Reply directly to this email to add more information or follow up with our support team.\n` +
        `Once your ticket is closed, you'll need to open a new one.\n\n---\n${BRAND} Support`,
        newTicketEmail(name, ticket.ticketId, subject, message, dateStr))
        .then(async sent => {
          if (sent?.sentMessageId) {
            await SupportTicket.findByIdAndUpdate(ticket._id,
              { confirmationMessageId: sent.sentMessageId });
          }
        }),

      sendEmail(SUPPORT,
        `[${ticket.ticketId}] New Ticket: ${subject}`,
        `[${ticket.ticketId}] From: ${name} <${email}>\n\n${message}`,
        supportNotifEmail(name, email, ticket.ticketId, subject, message, dateStr, closeUrl),
        email),
    ]);

    console.log(`✅ Ticket ${ticket.ticketId} created for ${email}`);
    return res.json(createStandardResponse(true, {
      ticketId: ticket.ticketId, duplicate: false,
      message: `Ticket ${ticket.ticketId} created. Check your email for confirmation.`,
    }));

  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json(createStandardResponse(false, null,
      'Failed to send. Please try again or email us directly.'));
  }
});

// ─── POST /api/contact/noreply-bounce  (called by Apps Script on splitwise.noreply@gmail) ──
// Sends a branded "unmonitored address" bounce reply via Resend, then the
// Apps Script moves the original email to trash.
contactRouter.post('/noreply-bounce', async (req, res) => {
  try {
    const { email, name = 'there', subject = '' } = req.body;
    if (!email)
      return res.status(400).json(createStandardResponse(false, null, 'email required'));

    const lower = email.toLowerCase().trim();
    // Skip system / loop-prevention addresses
    const SKIP = ['mailer-daemon','postmaster','noreply','no-reply','splitwise.noreply','support.splitwise'];
    if (SKIP.some(s => lower.includes(s)))
      return res.json(createStandardResponse(true, { skipped: true, reason: 'system sender' }));

    const displayName = (name || '').replace(/<.*>/, '').trim() || 'there';

    await sendEmail(lower,
      `Re: ${subject || 'Your email'}`,
      `Hi ${displayName},\n\nThis address (noreply@splitwise.space) is not monitored and cannot receive replies.\n\nFor help, please visit: ${WEBSITE_URL}\n\n---\n${BRAND} — This is an automated message. Do not reply.`,
      websiteRedirectEmail('noreply'),
    );

    console.log(`📩 Noreply bounce sent to ${lower}`);
    return res.json(createStandardResponse(true, { message: `Bounce sent to ${lower}` }));
  } catch (err) {
    console.error('noreply-bounce error:', err.message);
    return res.status(500).json(createStandardResponse(false, null, 'Failed to send bounce'));
  }
});

// ─── GET /api/contact/redirect-html  (get HTML for Gmail vacation responder) ──
// Visit ?type=support or ?type=noreply  — returns the HTML to paste into Gmail
contactRouter.get('/redirect-html', (req, res) => {
  const type = req.query.type === 'noreply' ? 'noreply' : 'support';
  res.setHeader('Content-Type', 'text/html');
  res.send(websiteRedirectEmail(type));
});

// ─── GET /api/contact/close/:ticketId  (admin closes a ticket) ───────────────
contactRouter.get('/close/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { key }      = req.query;

    if (!key || key !== process.env.ADMIN_CLOSE_SECRET)
      return res.status(401).send(
        '<h2 style="font-family:sans-serif;color:#ef4444;text-align:center;">❌ Unauthorized</h2>');

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket)
      return res.status(404).send(
        '<h2 style="font-family:sans-serif;color:#6c757d;text-align:center;">Ticket not found</h2>');

    if (ticket.status === 'closed')
      return res.send(
        `<h2 style="font-family:sans-serif;color:#6c757d;text-align:center;">Ticket ${ticketId} is already closed.</h2>`);

    ticket.status   = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = 'admin';
    await ticket.save();

    await sendEmail(ticket.email,
      `[${ticketId}] Your ticket has been closed — ${BRAND} Support`,
      `Hi ${ticket.name},\n\nYour ticket ${ticketId} has been closed.\nIf you need more help, feel free to open a new ticket.\n\n---\n${BRAND} Support`,
      closedEmail(ticket.name, ticketId, ticket.subject));

    console.log(`🔒 Ticket ${ticketId} closed by admin`);

    return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Ticket Closed — ${BRAND}</title>
<style>
  *{box-sizing:border-box;}
  body{margin:0;padding:40px 16px;background:#f0f2f5;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;}
  .card{max-width:460px;margin:0 auto;background:#fff;border-radius:20px;
         padding:44px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.1);}
  .icon{font-size:48px;margin-bottom:14px;}
  h1{margin:0 0 10px;font-size:22px;font-weight:900;color:#065f46;}
  p{font-size:14px;color:#6c757d;line-height:1.7;margin:0 0 8px;}
  .badge{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);
          color:#fff;font-family:'Courier New',monospace;font-weight:900;font-size:18px;
          letter-spacing:3px;padding:8px 20px;border-radius:12px;margin:10px 0;}
</style></head>
<body><div class="card">
  <div class="icon">🔒</div>
  <h1>Ticket Closed Successfully</h1>
  <div class="badge">${ticketId}</div>
  <p><strong>${ticket.name}</strong> (${ticket.email}) has been notified.</p>
  <p style="color:#adb5bd;font-size:12px;margin-top:16px;">
    Closed at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
  </p>
</div></body></html>`);

  } catch (err) {
    console.error('Close ticket error:', err);
    return res.status(500).send(
      '<h2 style="font-family:sans-serif;color:#ef4444;text-align:center;">Server error — please try again</h2>');
  }
});

// ─── Noreply automated email helper ──────────────────────────────────────────
function autoReplyHtml({ icon, headline, sub, bodyHtml }) {
  return shell({
    headerGrad: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    headerIcon: icon,
    headerLabel: `${BRAND} Support`,
    headerSub: sub,
    body: `
      <h2 style="margin:0 0 10px;font-size:20px;font-weight:900;color:#1a1f36;">${headline}</h2>
      ${bodyHtml}
      <p style="margin:24px 0 0;font-size:12.5px;color:#9ca3af;text-align:center;">
        This is an automated message from <strong style="color:${PURPLE};">${BRAND}</strong>.
        Please do not reply to this email.
      </p>`,
  });
}

// ─── POST /api/contact/user-message  (user sends new message, no ticketId) ───
// Lifecycle rules — never creates a ticket here; only informs user
contactRouter.post('/user-message', async (req, res) => {
  try {
    // name is optional — Gmail Apps Script may not always parse it cleanly
    const { email } = req.body;
    const name = (req.body.name || '').trim() || 'there';

    if (!email)
      return res.status(400).json(createStandardResponse(false, null, 'email is required'));

    const lower = email.toLowerCase().trim();

    // ── CASE A: Active ticket exists (OPEN or IN_PROGRESS) ────────────────────
    const active = await SupportTicket.findOne(
      { email: lower, status: { $in: ['open', 'in_progress'] } },
      {}, { sort: { createdAt: -1 } }
    );
    if (active) {
      await sendEmail(lower,
        `[${active.ticketId}] You already have an open ticket — ${BRAND} Support`,
        `Hi ${name},\n\nYou already have an open ticket: ${active.ticketId} (${active.subject}).\n` +
        `Our team is working on it. Reply to your original confirmation email to add more details.\n\n---\n${BRAND} Support`,
        autoReplyHtml({
          icon: '🔔',
          headline: `You already have an open ticket, ${name}!`,
          sub: 'Existing Ticket Found',
          bodyHtml: `
            <p style="margin:0 0 16px;font-size:14px;color:#6c757d;line-height:1.7;">
              We found an active support request from your email. Our team is already on it.
            </p>
            ${ticketCard(active.ticketId, fmt(active.createdAt), active.subject,
              '⏳ ' + active.status.toUpperCase().replace('_',' '),
              'linear-gradient(135deg,#f59e0b,#d97706)')}
            <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-left:5px solid #f59e0b;border-radius:12px;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.7;">
                💡 <strong>Reply to your original confirmation email</strong> to send us more details — it links directly to ticket <strong>${active.ticketId}</strong>.
              </p>
            </div>`,
        })
      );
      return res.json(createStandardResponse(true, {
        action: 'existing_ticket', ticketId: active.ticketId,
        message: `Active ticket ${active.ticketId} exists. Notification sent.`,
      }));
    }

    // ── CASE B: Only a closed ticket exists ───────────────────────────────────
    const lastClosed = await SupportTicket.findOne(
      { email: lower, status: 'closed' }, {}, { sort: { closedAt: -1 } }
    );
    if (lastClosed) {
      await sendEmail(lower,
        `Your previous ticket is closed — ${BRAND} Support`,
        `Hi ${name},\n\nYour previous ticket ${lastClosed.ticketId} has been closed.\n` +
        `Please create a new ticket from our website:\n${WEBSITE_URL}\n\n---\n${BRAND} Support`,
        autoReplyHtml({
          icon: '🔒',
          headline: `Your previous ticket is closed, ${name}`,
          sub: 'Ticket Closed',
          bodyHtml: `
            <p style="margin:0 0 16px;font-size:14px;color:#6c757d;line-height:1.7;">
              Your previous ticket <strong>${lastClosed.ticketId}</strong> has been resolved and closed.
              Please create a new ticket if you need further help.
            </p>
            <div style="background:#f0fdf4;border:1.5px solid #86efac;border-left:5px solid #10b981;border-radius:12px;padding:14px 18px;margin-bottom:16px;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:1px;">✅ Resolved</p>
              <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:900;color:#065f46;letter-spacing:3px;">${lastClosed.ticketId}</p>
            </div>
            <p style="margin:0;font-size:13.5px;color:#374151;">
              To get help with a new issue, visit:<br>
              <a href="${WEBSITE_URL}" style="color:${PURPLE};font-weight:700;">${WEBSITE_URL}</a>
            </p>`,
        })
      );
      return res.json(createStandardResponse(true, {
        action: 'previous_closed', ticketId: lastClosed.ticketId,
        message: 'Previous ticket closed. Redirect email sent.',
      }));
    }

    // ── CASE C: No ticket at all ──────────────────────────────────────────────
    await sendEmail(lower,
      `Create a ticket to get help — ${BRAND} Support`,
      `Hi ${name},\n\nNo active ticket found. Please create one at:\n${WEBSITE_URL}\n\n---\n${BRAND} Support`,
      autoReplyHtml({
        icon: '🎫',
        headline: `No active ticket found, ${name}`,
        sub: 'Get Support',
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:14px;color:#6c757d;line-height:1.7;">
            We couldn't find an active support ticket for your email. 
            Please create a ticket from our website — it only takes a minute.
          </p>
          <div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-left:5px solid ${PURPLE};border-radius:12px;padding:14px 18px;">
            <p style="margin:0;font-size:13.5px;color:#374151;line-height:1.7;">
              📝 <strong>Create a support ticket:</strong><br>
              <a href="${WEBSITE_URL}" style="color:${PURPLE};font-weight:700;">${WEBSITE_URL}</a>
            </p>
          </div>`,
      })
    );
    return res.json(createStandardResponse(true, {
      action: 'no_ticket',
      message: 'No ticket found. Redirect email sent.',
    }));

  } catch (err) {
    console.error('user-message error:', err);
    return res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

// ─── POST /api/contact/user-reply/:ticketId  (user replies to an existing ticket) ──
contactRouter.post('/user-reply/:ticketId', async (req, res) => {
  try {
    const { ticketId }             = req.params;
    const { name, email, message } = req.body;
    if (!email || !message)
      return res.status(400).json(createStandardResponse(false, null, 'email and message required'));

    const ticket = await SupportTicket.findOne({ ticketId });

    // Not found
    if (!ticket)
      return res.status(404).json(createStandardResponse(false, null, `Ticket ${ticketId} not found`));

    // ── CLOSED — reject and inform via noreply ────────────────────────────────
    if (ticket.status === 'closed') {
      await sendEmail(email.toLowerCase().trim(),
        `[${ticketId}] This ticket is closed — ${BRAND} Support`,
        `Hi ${name || ticket.name},\n\nTicket ${ticketId} is closed and cannot accept replies.\n` +
        `Please create a new ticket at:\n${WEBSITE_URL}\n\n---\n${BRAND} Support`,
        autoReplyHtml({
          icon: '🔒',
          headline: `Ticket ${ticketId} is closed`,
          sub: 'Cannot Reply',
          bodyHtml: `
            <p style="margin:0 0 16px;font-size:14px;color:#6c757d;line-height:1.7;">
              This ticket has been resolved and closed. We can no longer accept replies on this thread.
            </p>
            <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-left:5px solid #ef4444;border-radius:12px;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.7;">
                To get help with a new issue, please <strong>create a new ticket</strong>:<br>
                <a href="${WEBSITE_URL}" style="color:#ef4444;font-weight:700;">${WEBSITE_URL}</a>
              </p>
            </div>`,
        })
      );
      return res.status(400).json(createStandardResponse(false, null,
        `Ticket ${ticketId} is closed. Please create a new ticket from the website.`,
        { action: 'ticket_closed' }
      ));
    }

    // ── OPEN / IN_PROGRESS — append message ───────────────────────────────────
    ticket.replies.push({ from: 'auto', agent: name || ticket.name, text: message });
    ticket.activityLog.push({
      action: 'replied', agent: name || ticket.name,
      detail: `User reply received from ${email}`,
    });
    await ticket.save();

    // Auto-ack to user (noreply)
    await sendEmail(email.toLowerCase().trim(),
      `[${ticketId}] We received your reply — ${BRAND} Support`,
      `Hi ${name || ticket.name},\n\nYour reply on ticket ${ticketId} has been received.\n` +
      `Our support team will respond shortly.\n\n---\n${BRAND} Support`,
      autoReplyHtml({
        icon: '✅',
        headline: 'Reply received!',
        sub: `Ticket ${ticketId}`,
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:14px;color:#6c757d;line-height:1.7;">
            Hi <strong>${name || ticket.name}</strong>, we've received your reply on ticket
            <strong>${ticketId}</strong>. Our team will get back to you shortly.
          </p>
          <div style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-left:5px solid ${PURPLE};border-radius:12px;padding:14px 18px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#4338ca;text-transform:uppercase;letter-spacing:1px;">📨 Your Reply</p>
            <p style="margin:0;font-size:13.5px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message.substring(0, 320)}${message.length > 320 ? '…' : ''}</p>
          </div>`,
      })
    );

    // Notify support team (non-fatal)
    sendEmail(SUPPORT,
      `[${ticketId}] User reply — ${ticket.subject}`,
      `Ticket ${ticketId} — reply from ${name || ticket.name} <${email}>\n\n${message}`
    ).catch(() => {});

    return res.json(createStandardResponse(true, {
      action: 'reply_appended', ticketId,
      message: 'Reply added. Auto-acknowledgment sent to user.',
    }));

  } catch (err) {
    console.error('user-reply error:', err);
    return res.status(500).json(createStandardResponse(false, null, 'Server error'));
  }
});

