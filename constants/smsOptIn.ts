/** Public SMS marketing / compliance pages — keep in sync with docs/BREVO_SMS_OPTIN_MOCKUP.html CONFIG */
export const SMS_OPT_IN = {
  company: 'Fletcher Quill Estates',
  legalName: 'Fletcher Quill Estates Inc.',
  domain: 'fletcherquillestates.com',
  senderId: 'FQEstates',
  keyword: 'JOIN',
  /** Replace when Brevo assigns your SMS short/long code */
  smsNumber: '22398',
  paths: {
    optIn: '/sms-updates',
    join: '/join-sms',
    privacy: '/privacy',
    terms: '/terms',
    smsPolicy: '/sms-policy',
  },
} as const;

export function getPublicAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return `https://www.${SMS_OPT_IN.domain}`;
}

export function getSmsOptInPageUrl(): string {
  return `${getPublicAppOrigin()}${SMS_OPT_IN.paths.optIn}`;
}

export function getJoinSmsPageUrl(): string {
  return `${getPublicAppOrigin()}${SMS_OPT_IN.paths.join}`;
}
