import type { SmsAdapter, SmsSendResult } from './types';

const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/send';
const DEFAULT_SMS_SENDER = 'FQEstates';

/** Brevo SMS senders: max 11 alphanumeric or 15 numeric — no emails or special chars. */
export function sanitizeSmsSender(raw: string): string {
  const trimmed = raw.trim().replace(/"/g, '');
  if (!trimmed || trimmed.includes('@')) {
    return DEFAULT_SMS_SENDER;
  }

  const numeric = trimmed.replace(/\D/g, '');
  if (/^\d+$/.test(trimmed) && numeric.length >= 3) {
    return numeric.slice(0, 15);
  }

  const alphanumeric = trimmed.replace(/[^a-zA-Z0-9]/g, '');
  if (alphanumeric.length >= 3) {
    return alphanumeric.slice(0, 11);
  }

  return DEFAULT_SMS_SENDER;
}

export function resolveSmsSender(): string {
  const explicit = process.env.BREVO_SMS_SENDER?.trim();
  if (explicit) {
    return sanitizeSmsSender(explicit);
  }

  const fromName = process.env.BREVO_SENDER_NAME?.trim()?.replace(/"/g, '');
  if (fromName && !fromName.includes('@')) {
    return sanitizeSmsSender(fromName);
  }

  return DEFAULT_SMS_SENDER;
}

/** Brevo expects digits with country code, no leading +. */
export function normalizePhoneNumber(to: string): string {
  const digits = to.trim().replace(/\D/g, '');
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return digits;
}

async function readBrevoError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; code?: string };
    if (data.message?.includes('unrecognised IP') || data.message?.includes('unrecognized IP')) {
      return 'Brevo blocked this server IP — whitelist Northflank egress in Brevo → Security → Authorized IPs.';
    }
    return data.message ?? `Brevo SMS error (${response.status})`;
  } catch {
    return `Brevo SMS error (${response.status})`;
  }
}

export class BrevoSmsAdapter implements SmsAdapter {
  private readonly apiKey: string;
  readonly sender: string;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (!apiKey || apiKey === 'your-brevo-api-key-here') {
      throw new Error('BREVO_API_KEY is required for SMS via Brevo');
    }

    this.apiKey = apiKey;
    this.sender = resolveSmsSender();
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const recipient = normalizePhoneNumber(to);
    if (recipient.replace(/\D/g, '').length < 10) {
      return { status: 'failed', error: `Invalid phone number: ${to}` };
    }

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

      if (!response.ok) {
        const error = await readBrevoError(response);
        if (response.status === 401) {
          console.error('[Brevo SMS] Unauthorized — check API key and authorized IPs');
        }
        console.error('[Brevo SMS] Send failed:', error, { to: recipient, sender: this.sender });
        return { status: 'failed', error };
      }

      const data = (await response.json()) as { reference?: string; messageId?: number };
      const messageId = data.reference ?? (data.messageId != null ? String(data.messageId) : undefined);
      console.log('[Brevo SMS] Sent', { to: recipient, messageId, sender: this.sender });
      return { status: 'sent', messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Brevo SMS] Send failed: ${message}`);
      return { status: 'failed', error: message };
    }
  }
}
