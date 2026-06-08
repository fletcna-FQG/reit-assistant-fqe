/** Parse Brevo REST API error bodies for share email/SMS delivery. */
export async function readBrevoApiError(
  response: Response,
  channel: 'email' | 'sms',
): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; code?: string };
    if (data.message?.includes('unrecognised IP') || data.message?.includes('unrecognized IP')) {
      return 'Brevo blocked this server IP — whitelist Northflank egress in Brevo → Security → Authorized IPs (or disable IP blocking).';
    }
    if (response.status === 401 && data.code === 'unauthorized') {
      return 'Brevo rejected the API key — verify BREVO_API_KEY on Northflank.';
    }
    return data.message ?? `Brevo ${channel} error (${response.status})`;
  } catch {
    return `Brevo ${channel} error (${response.status})`;
  }
}

export function resolveBrevoEmailSenderName(): string {
  const fromEnv = process.env.BREVO_SENDER_NAME?.trim()?.replace(/"/g, '');
  if (fromEnv && !fromEnv.includes('@')) {
    return fromEnv;
  }
  return 'FQ Estates';
}
