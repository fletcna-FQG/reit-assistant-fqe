/** Display label for Rule Engine score — no parentheses for standard (non-negative) scores. */
export function formatRuleEngineScoreLabel(recommendation?: string, score?: number): string {
  if (recommendation && score != null) {
    if (score < 0) {
      return `Rule Engine: ${recommendation} (${score})`;
    }
    return `Rule Engine: ${recommendation} ${Math.round(score)}`;
  }
  if (recommendation) return `Rule Engine: ${recommendation}`;
  return 'Rule Engine: Pending';
}
