/**
 * SplitWise Support — Gmail Vacation Responder Script
 * =====================================================
 * Paste this into Google Apps Script (script.google.com) and set a trigger
 * to run "checkAndReply" every 5–10 minutes on the support Gmail account.
 *
 * What it does:
 *   1. Finds unread emails in INBOX that haven't been replied to.
 *   2. Sends a professional HTML auto-reply: "Create a Ticket on Our Website".
 *   3. Marks the thread as read so it doesn't reply again.
 *
 * Setup:
 *   1. Open https://script.google.com → New Project
 *   2. Paste this script
 *   3. Edit WEBSITE_URL below
 *   4. Click "Run" once to grant permissions
 *   5. Add a Time-driven trigger: checkAndReply → every 5 minutes
 */

// ─── Configuration ────────────────────────────────────────────────────────────
const BRAND       = 'SplitWise';
const WEBSITE_URL = 'https://yourdomain.com/frontend.html'; // ← change this
const PURPLE      = '#667eea';
const VIOLET      = '#764ba2';
const SUPPORT_EMAIL = Session.getActiveUser().getEmail();

// Label name used to track threads we've already auto-replied to
const REPLIED_LABEL_NAME = 'AutoReplied';

// ─── Main function (set this as the trigger) ──────────────────────────────────
function checkAndReply() {
  const label  = getOrCreateLabel(REPLIED_LABEL_NAME);
  // Search: unread, in inbox, NOT already auto-replied
  const threads = GmailApp.search(`is:unread in:inbox -label:${REPLIED_LABEL_NAME}`, 0, 20);

  for (const thread of threads) {
    const messages = thread.getMessages();
    const firstMsg  = messages[0];
    const fromFull  = firstMsg.getFrom(); // e.g. "John Doe <john@example.com>"
    const fromEmail = extractEmail(fromFull);
    const fromName  = extractName(fromFull);

    // Skip if sender is us (avoid reply loops)
    if (fromEmail.toLowerCase() === SUPPORT_EMAIL.toLowerCase()) continue;
    if (fromEmail.toLowerCase().includes('noreply') ||
        fromEmail.toLowerCase().includes('no-reply') ||
        fromEmail.toLowerCase().includes('mailer-daemon')) continue;

    // Send the auto-reply
    const subject = `Re: ${firstMsg.getSubject()}`;
    GmailApp.sendEmail(fromEmail, subject, buildPlainText(fromName), {
      htmlBody: buildHtml(fromName),
      name: `${BRAND} Support`,
    });

    // Mark thread as read and label it so we don't reply again
    thread.markRead();
    thread.addLabel(label);

    Logger.log(`Auto-replied to: ${fromEmail}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function extractEmail(from) {
  const match = from.match(/<(.+?)>/);
  return match ? match[1].trim() : from.trim();
}

function extractName(from) {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return extractEmail(from).split('@')[0];
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────
function buildPlainText(name) {
  return `Hi ${name},

Thank you for reaching out to ${BRAND} Support!

To ensure your issue is tracked and resolved quickly, we ask that you create a support ticket on our website:

  ${WEBSITE_URL}

Creating a ticket gives you:
  • A unique ticket reference number (e.g. SW-101)
  • Email updates when our team responds
  • Faster resolution — our team monitors tickets 24/7

We respond to all tickets within 24–48 hours.

---
${BRAND} Support Team
This is an automated response. Please create a ticket at the link above.`;
}

// ─── HTML email ───────────────────────────────────────────────────────────────
function buildHtml(name) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND} Support</title>
</head>
<body style="margin:0;padding:0;background:#edf0f7;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">

<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
       style="background:#edf0f7;min-height:100vh;">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <!-- Card -->
      <table role="presentation" cellpadding="0" cellspacing="0"
             style="max-width:580px;width:100%;background:#ffffff;border-radius:22px;
                    overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,0.18);">

        <!-- ═══════════════ HEADER ═══════════════ -->
        <tr>
          <td style="background:linear-gradient(135deg,${PURPLE} 0%,${VIOLET} 100%);
                     padding:32px 24px 26px;text-align:center;">

            <!-- Logo badge -->
            <table role="presentation" cellpadding="0" cellspacing="0"
                   style="margin:0 auto 18px;border-collapse:separate;">
              <tr>
                <td style="background:rgba(255,255,255,0.15);
                           border:2px solid rgba(255,255,255,0.30);
                           border-radius:18px;
                           padding:12px 24px;
                           text-align:center;">
                  <div style="font-size:32px;line-height:1;margin-bottom:6px;">💬</div>
                  <div style="font-size:14px;font-weight:800;color:#ffffff;
                              letter-spacing:1px;white-space:nowrap;">${BRAND} Support</div>
                </td>
              </tr>
            </table>

            <h1 style="margin:0 0 6px;color:#ffffff;font-size:20px;font-weight:900;
                        line-height:1.3;">Thanks for reaching out!</h1>
            <p style="margin:0;color:rgba(255,255,255,0.75);font-size:11px;
                       text-transform:uppercase;letter-spacing:2px;">Create a Ticket on Our Website</p>
          </td>
        </tr>

        <!-- ═══════════════ BODY ═══════════════ -->
        <tr>
          <td style="padding:30px 28px;">

            <p style="margin:0 0 18px;font-size:15px;color:#1f2937;line-height:1.6;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="margin:0 0 22px;font-size:14px;color:#374151;line-height:1.75;">
              Thank you for contacting <strong>${BRAND} Support</strong>!
              To make sure your issue is tracked and resolved as fast as possible,
              we ask you to create a <strong>support ticket</strong> on our website.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0"
                   style="margin:0 auto 26px;width:100%;">
              <tr>
                <td align="center">
                  <a href="${WEBSITE_URL}"
                     style="display:inline-block;
                            background:linear-gradient(135deg,${PURPLE} 0%,${VIOLET} 100%);
                            color:#ffffff;font-size:15px;font-weight:800;
                            padding:14px 36px;border-radius:12px;
                            text-decoration:none;letter-spacing:0.3px;
                            box-shadow:0 6px 20px rgba(102,126,234,0.35);">
                    🎫 &nbsp; Create a Support Ticket
                  </a>
                </td>
              </tr>
            </table>

            <!-- Benefits -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                   style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-left:5px solid ${PURPLE};
                          border-radius:14px;margin-bottom:22px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:900;color:#4338ca;
                             text-transform:uppercase;letter-spacing:1.5px;">Why create a ticket?</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#374151;line-height:1.6;">
                        ✅ &nbsp; Get a unique reference number (e.g. <strong>SW-101</strong>)
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#374151;line-height:1.6;">
                        📧 &nbsp; Receive email updates every time we reply
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#374151;line-height:1.6;">
                        ⚡ &nbsp; Faster resolution — our team monitors tickets 24/7
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#374151;line-height:1.6;">
                        🔒 &nbsp; All conversations are securely tracked
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Response time -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                   style="background:#fefce8;border:1.5px solid #fde68a;
                          border-left:5px solid #f59e0b;border-radius:12px;margin-bottom:6px;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.7;">
                  ⏱ We respond to all tickets within <strong>24–48 hours</strong>.
                </td>
              </tr>
            </table>

            <!-- Footer note -->
            <p style="margin:22px 0 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;">
              This is an automated response from
              <strong style="color:${PURPLE};">${BRAND} Support</strong>.<br>
              Please do not reply to this email — use the button above to create your ticket.
            </p>

          </td>
        </tr>

        <!-- ═══════════════ FOOTER ═══════════════ -->
        <tr>
          <td style="padding:14px 24px;background:#f8f9fc;border-top:1px solid #e5e7eb;
                     text-align:center;font-size:11px;color:#9ca3af;">
            &copy; ${new Date().getFullYear()} ${BRAND} &nbsp;&middot;&nbsp; All rights reserved
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>

</body>
</html>`;
}
