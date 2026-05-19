import { colors } from '@/constants/theme';

export type PasswordStrength = {
  score: number;
  percent: number;
  label: string;
  color: string;
};

/** 02_Component_Library.md — 0–49% red, 50–74% amber, 75–100% emerald */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, percent: 0, label: '', color: colors.mediumGray };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const percent = Math.round((score / 5) * 100);

  if (percent < 50) {
    return { score, percent, label: 'Weak', color: colors.alertRed };
  }
  if (percent < 75) {
    return { score, percent, label: 'Fair', color: colors.warningAmber };
  }
  return { score, percent, label: 'Strong', color: colors.emerald };
}
