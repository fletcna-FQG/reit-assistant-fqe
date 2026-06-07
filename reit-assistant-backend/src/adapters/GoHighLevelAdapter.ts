import type { SmsAdapter, SmsSendResult } from './types';

type GhlConfig = {
  apiKey: string;
  locationId: string;
};

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-04-15';

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return value.trim();
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return value.trim().startsWith('+') ? value.trim() : `+${digits}`;
}

export class GoHighLevelAdapter implements SmsAdapter {
  constructor(private readonly config: GhlConfig) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      Version: GHL_VERSION,
    };
  }

  private async findContactId(phone: string): Promise<string | null> {
    const url = new URL(`${GHL_BASE_URL}/contacts/`);
    url.searchParams.set('locationId', this.config.locationId);
    url.searchParams.set('query', phone);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Contact search failed:', error);
      return null;
    }

    const data = (await response.json()) as { contacts?: Array<{ id?: string }> };
    return data.contacts?.[0]?.id ?? null;
  }

  private async createContact(phone: string): Promise<string | null> {
    const response = await fetch(`${GHL_BASE_URL}/contacts/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        locationId: this.config.locationId,
        phone,
        source: 'REIT Assistant',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Contact create failed:', error);
      return null;
    }

    const data = (await response.json()) as { contact?: { id?: string }; id?: string };
    return data.contact?.id ?? data.id ?? null;
  }

  private async resolveContactId(phone: string): Promise<string | null> {
    const existing = await this.findContactId(phone);
    if (existing) {
      return existing;
    }
    return this.createContact(phone);
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const phone = normalizePhone(to);
    const contactId = await this.resolveContactId(phone);

    if (!contactId) {
      console.error('[GHL] SMS failed: could not resolve contact for', phone);
      return { status: 'failed' };
    }

    const response = await fetch(`${GHL_BASE_URL}/conversations/v1/messages`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        type: 1,
        contactId,
        locationId: this.config.locationId,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] SMS failed:', error);
      return { status: 'failed' };
    }

    const data = (await response.json()) as { id?: string; messageId?: string };
    return { status: 'sent', messageId: data.id || data.messageId };
  }
}
