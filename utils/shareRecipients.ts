const LIST_SPLIT = /[,;\n]+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseShareRecipients(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of input.split(LIST_SPLIT)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function validateShareEmails(recipients: string[]): string | null {
  const invalid = recipients.filter((value) => !EMAIL_PATTERN.test(value));
  if (!invalid.length) return null;
  return `Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}`;
}

export function validateSharePhones(recipients: string[]): string | null {
  const invalid = recipients.filter((value) => value.replace(/\D/g, '').length < 10);
  if (!invalid.length) return null;
  return `Invalid phone number${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`;
}
