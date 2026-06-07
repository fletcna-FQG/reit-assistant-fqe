const LIST_SPLIT = /[,;\n]+/;

export function parseRecipientList(input: string): string[] {
  return dedupeRecipients(
    input
      .split(LIST_SPLIT)
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function dedupeRecipients(recipients: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const recipient of recipients) {
    const trimmed = recipient.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function resolveShareRecipients(recipient?: string, recipients?: string[]): string[] {
  if (recipients?.length) {
    return dedupeRecipients(recipients);
  }
  if (recipient?.trim()) {
    return parseRecipientList(recipient);
  }
  return [];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailRecipients(recipients: string[]): string | null {
  const invalid = recipients.filter((value) => !EMAIL_PATTERN.test(value));
  if (!invalid.length) return null;
  return `Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}`;
}

export function validateSmsRecipients(recipients: string[]): string | null {
  const invalid = recipients.filter((value) => value.replace(/\D/g, '').length < 10);
  if (!invalid.length) return null;
  return `Invalid phone number${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`;
}
