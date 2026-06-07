import { sendEmail as sendEmailViaBrevo } from '../services/emailAdapter';

/** @deprecated Import sendEmail from ../services/emailAdapter instead */
export class EmailAdapter {
  static sendEmail = sendEmailViaBrevo;
}
