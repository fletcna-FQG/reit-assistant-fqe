import { ActionAcceleratedAdapter } from '../adapters/ActionAcceleratedAdapter';
import { GoHighLevelAdapter } from '../adapters/GoHighLevelAdapter';
import type { SmsAdapter } from '../adapters/types';

function createSmsAdapter(): SmsAdapter {
  const provider = (process.env.SMS_PROVIDER ?? 'ghl').toLowerCase();

  if (provider === 'action_accelerated') {
    return new ActionAcceleratedAdapter();
  }

  const apiKey = process.env.GHL_API_KEY?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();

  if (!apiKey || !locationId) {
    console.warn('[smsFactory] GHL_API_KEY or GHL_LOCATION_ID missing — using stub GHL adapter');
    return {
      async sendSms(to, message) {
        console.log('Sending SMS via GHL (stub)...', { to, messageLength: message.length });
        return { status: 'sent', messageId: 'mock-ghl-id' };
      },
    };
  }

  return new GoHighLevelAdapter({ apiKey, locationId });
}

const adapter = createSmsAdapter();

export const smsFactory = {
  sendSms(to: string, message: string) {
    return adapter.sendSms(to, message);
  },
};
