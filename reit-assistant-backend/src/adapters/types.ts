export type SmsSendResult = {
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
};

export type EmailSendResult = {
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
};

export interface SmsAdapter {
  sendSms(to: string, message: string): Promise<SmsSendResult>;
}
