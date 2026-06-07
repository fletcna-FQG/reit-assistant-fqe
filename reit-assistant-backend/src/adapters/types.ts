export type SmsSendResult = {
  status: 'sent' | 'failed';
  messageId?: string;
};

export type EmailSendResult = {
  status: 'sent' | 'failed';
  messageId?: string;
};

export interface SmsAdapter {
  sendSms(to: string, message: string): Promise<SmsSendResult>;
}
