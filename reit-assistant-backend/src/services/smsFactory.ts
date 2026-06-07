import { ActionAcceleratedAdapter } from '../adapters/ActionAcceleratedAdapter';
import { BrevoSmsAdapter } from '../adapters/BrevoSmsAdapter';
import { GoHighLevelAdapter } from '../adapters/GoHighLevelAdapter';
import type { SmsAdapter } from '../adapters/types';

function createSmsAdapter(): SmsAdapter {
  const provider = (process.env.SMS_PROVIDER ?? 'brevo').toLowerCase();

  if (provider === 'action_accelerated') {
    return new ActionAcceleratedAdapter();
  }

  if (provider === 'ghl') {
    const apiKey = process.env.GHL_API_KEY?.trim();
    const locationId = process.env.GHL_LOCATION_ID?.trim();

    if (!apiKey || !locationId) {
      console.warn('[smsFactory] GHL_API_KEY or GHL_LOCATION_ID missing — SMS via GHL unavailable');
      return {
        async sendSms() {
          return { status: 'failed' };
        },
      };
    }

    return new GoHighLevelAdapter({ apiKey, locationId });
  }

  try {
    return new BrevoSmsAdapter();
  } catch (error) {
    console.warn(
      `[smsFactory] ${error instanceof Error ? error.message : String(error)} — SMS via Brevo unavailable`,
    );
    return {
      async sendSms() {
        return { status: 'failed' };
      },
    };
  }
}

const adapter = createSmsAdapter();

export const smsFactory = {
  sendSms(to: string, message: string) {
    return adapter.sendSms(to, message);
  },
};
