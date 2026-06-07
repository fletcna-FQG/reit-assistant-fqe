import type { SmsAdapter, SmsSendResult } from './types';

export class ActionAcceleratedAdapter implements SmsAdapter {
  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    console.log('Sending SMS via AA...', { to, messageLength: message.length });
    return { status: 'sent', messageId: 'mock-aa-id' };
  }
}
