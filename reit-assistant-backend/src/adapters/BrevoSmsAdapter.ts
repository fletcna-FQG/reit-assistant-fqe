import type { SmsAdapter, SmsSendResult } from './types';

const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

function normalizePhoneNumber(to: string): string {
  const trimmed = to.trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

export class BrevoSmsAdapter implements SmsAdapter {
  private readonly apiKey: string;
  private readonly sender: string;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (!apiKey || apiKey === 'your-brevo-api-key-here') {
      throw new Error('BREVO_API_KEY is required for SMS via Brevo');
    }

    this.apiKey = apiKey;
    this.sender =
      process.env.BREVO_SMS_SENDER?.trim() ||
      process.env.BREVO_SENDER_NAME?.trim()?.replace(/"/g, '') ||
      'FQEstates';
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const recipient = normalizePhoneNumber(to);

    try {
      const response = await fetch(BREVO_SMS_URL, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'transactional',
          unicodeEnabled: true,
          sender: this.sender,
          recipient,
          content: message,
        }),
      });

      if (response.status === 401) {
        const error = await response.text();
        if (error.includes('unrecognised IP') || error.includes('unrecognized IP')) {
          console.error('[Brevo SMS] IP address not authorized — add Northflank egress IP in Brevo');
        } else {
          console.error('[Brevo SMS] Invalid API Key');
        }
        console.error('[Brevo SMS] Send failed:', error);
        return { status: 'failed' };
      }

      if (!response.ok) {
        const error = await response.text();
        console.error('[Brevo SMS] Send failed:', error);
        return { status: 'failed' };
      }

      const data = (await response.json()) as { reference?: string; messageId?: number };
      const messageId = data.reference ?? (data.messageId != null ? String(data.messageId) : undefined);
      console.log('[Brevo SMS] Sent', { to: recipient, messageId });
      return { status: 'sent', messageId };
    } catch (error) {
      console.error(
        `[Brevo SMS] Send failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { status: 'failed' };
    }
  }
}
