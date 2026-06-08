import type { EmailSendResult } from '../adapters/types';
import { readBrevoApiError, resolveBrevoEmailSenderName } from '../utils/brevoErrors';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const NAVY = '#003366';
const EMERALD = '#00A859';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtmlContent(propertyName: string, pdfUrl: string): string {
  const safeName = escapeHtml(propertyName);
  const safeUrl = escapeHtml(pdfUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FQ Estates REIT Analysis Report</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 28px 16px;text-align:center;">
              <h1 style="margin:0;font-size:24px;line-height:1.3;color:${NAVY};font-weight:700;">
                The REIT Analysis Report is Ready for Evaluation
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;color:#2c3e50;font-size:16px;line-height:1.6;text-align:center;">
              Dear REIT Evaluator, Your detailed analysis for <strong style="color:${NAVY};">${safeName}</strong> is complete. Please review the attached report or click below.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 32px;">
              <a href="${safeUrl}" style="display:inline-block;background-color:${NAVY};color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 28px;border-radius:6px;">
                View Report
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background-color:#f5f5f5;border-top:1px solid #e0e0e0;text-align:center;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${EMERALD};font-weight:600;">
                Fletcher Quill Estates Inc. - Confidential Analysis.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextContent(propertyName: string, pdfUrl: string): string {
  return (
    `The REIT Analysis Report is Ready for Evaluation\n\n` +
    `Dear REIT Evaluator, Your detailed analysis for ${propertyName} is complete. Please review the attached report or click below.\n\n` +
    `View Report: ${pdfUrl}\n\n` +
    `Fletcher Quill Estates Inc. - Confidential Analysis.`
  );
}

/**
 * Send a branded REIT analysis report email via Brevo.
 * Reads BREVO_API_KEY and BREVO_SENDER_EMAIL from process.env.
 */
export async function sendEmail(
  to: string,
  subject: string,
  pdfUrl: string,
  propertyName: string,
): Promise<EmailSendResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

  if (!apiKey || apiKey === 'your-brevo-api-key-here') {
    const error = 'BREVO_API_KEY is missing or invalid on the server.';
    console.error(`[Brevo] ${error}`);
    return { status: 'failed', error };
  }

  if (!senderEmail) {
    const error = 'BREVO_SENDER_EMAIL is required (verified sender in Brevo).';
    console.error(`[Brevo] ${error}`);
    return { status: 'failed', error };
  }

  const emailSubject =
    subject.trim() || `FQ Estates: REIT Analysis Report for ${propertyName}`;
  const senderName = resolveBrevoEmailSenderName();

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to.trim() }],
        subject: emailSubject,
        htmlContent: buildHtmlContent(propertyName, pdfUrl),
        textContent: buildTextContent(propertyName, pdfUrl),
      }),
    });

    if (!response.ok) {
      const error = await readBrevoApiError(response, 'email');
      console.error('[Brevo] Send failed:', error, { to, senderEmail, status: response.status });
      return { status: 'failed', error };
    }

    const data = (await response.json()) as { messageId?: string };
    console.log('[Brevo] Email sent', { to, messageId: data.messageId, senderEmail });
    return { status: 'sent', messageId: data.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Brevo] Send failed: ${message}`);
    return { status: 'failed', error: message };
  }
}
