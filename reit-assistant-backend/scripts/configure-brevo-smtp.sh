#!/usr/bin/env bash
# Push Brevo SMTP settings to Supabase Auth (hosted project).
# Requires: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, and Brevo SMTP vars in .env
#
# Usage (from reit-assistant-backend/):
#   bash scripts/configure-brevo-smtp.sh
#
# Get a personal access token: https://supabase.com/dashboard/account/tokens
# Project ref is the subdomain of SUPABASE_URL (e.g. yzepjzjkbjbmfveihllf).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ -f "$ENV_FILE" ]]; then
  eval "$(python3 - <<PY
from pathlib import Path
import shlex

for line in Path(r"$ENV_FILE").read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, value = line.partition("=")
    key = key.strip()
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    print(f"export {key}={shlex.quote(value)}")
PY
)"
fi

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)}"
: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF — subdomain from SUPABASE_URL}"
: "${BREVO_SMTP_USER:?Set BREVO_SMTP_USER — your Brevo login email}"
: "${BREVO_SMTP_KEY:?Set BREVO_SMTP_KEY — SMTP key from Brevo → SMTP & API → SMTP (NOT the REST API key)}"
: "${BREVO_SMTP_SENDER_EMAIL:?Set BREVO_SMTP_SENDER_EMAIL — verified sender, e.g. reports@fletcherquillestates.com}"

BREVO_SMTP_HOST="${BREVO_SMTP_HOST:-smtp-relay.brevo.com}"
BREVO_SMTP_PORT="${BREVO_SMTP_PORT:-587}"
BREVO_SMTP_SENDER_NAME="${BREVO_SMTP_SENDER_NAME:-FQ Estates}"
AUTH_AUTO_CONFIRM="${AUTH_AUTO_CONFIRM:-false}"

echo "Configuring Supabase Auth SMTP for project: $SUPABASE_PROJECT_REF"
echo "  Host:     $BREVO_SMTP_HOST:$BREVO_SMTP_PORT"
echo "  Sender:   $BREVO_SMTP_SENDER_NAME <$BREVO_SMTP_SENDER_EMAIL>"
echo "  SMTP user: $BREVO_SMTP_USER"
echo ""

PAYLOAD=$(python3 - <<PY
import json, os
print(json.dumps({
  "external_email_enabled": True,
  "mailer_secure_email_change_enabled": True,
  "mailer_autoconfirm": os.environ.get("AUTH_AUTO_CONFIRM", "false").lower() in ("1", "true", "yes"),
  "smtp_host": os.environ.get("BREVO_SMTP_HOST", "smtp-relay.brevo.com"),
  "smtp_port": int(os.environ.get("BREVO_SMTP_PORT", "587")),
  "smtp_user": os.environ["BREVO_SMTP_USER"],
  "smtp_pass": os.environ["BREVO_SMTP_KEY"],
  "smtp_admin_email": os.environ["BREVO_SMTP_SENDER_EMAIL"],
  "smtp_sender_name": os.environ.get("BREVO_SMTP_SENDER_NAME", "FQ Estates"),
}))
PY
)

HTTP=$(curl -s -w '%{http_code}' -o /tmp/supabase-smtp-response.json \
  -X PATCH "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

if [[ "$HTTP" == "200" ]]; then
  echo "✓ Supabase Auth SMTP configured successfully."
  echo ""
  echo "Next steps:"
  echo "  1. In Supabase Dashboard → Authentication → Email Templates, paste HTML from supabase/email-templates/"
  echo "  2. Set AUTH_AUTO_CONFIRM_EMAIL=false in backend .env if you want signup confirmation emails"
  echo "  3. Raise rate limits: Dashboard → Authentication → Rate Limits (default 30/hr after SMTP)"
  echo "  4. Whitelist server IPs in Brevo if IP restriction is enabled"
else
  echo "✗ Supabase API returned HTTP $HTTP"
  cat /tmp/supabase-smtp-response.json
  echo
  exit 1
fi
