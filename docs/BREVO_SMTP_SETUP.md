# Brevo SMTP setup for REIT Assistant

Supabase Auth sends **signup confirmation**, **password reset**, and **invite** emails.  
Share report emails use the **Brevo REST API** separately (`src/services/emailAdapter.ts`).

## Two Brevo credentials (do not mix them)

| Credential | Where to get it | Used for |
|------------|-----------------|----------|
| **REST API key** (`BREVO_API_KEY`) | Brevo → SMTP & API → **API Keys** | Share analysis report emails |
| **SMTP key** (`BREVO_SMTP_KEY`) | Brevo → SMTP & API → **SMTP** → Generate | Supabase Auth emails |

The REST API key does **not** work for SMTP login.

## 1. Brevo prerequisites

1. **Verify sender/domain** — Brevo → Senders & IPs → add `reports@fletcherquillestates.com` (or your domain).
2. **Create SMTP key** — Brevo → Settings → SMTP & API → SMTP tab → Create SMTP key.
3. **Note SMTP login** — Username is your **Brevo account email** (`BREVO_SMTP_USER`).
4. **Authorized IPs** — If IP restriction is on, add your dev machine and production server IPs at [Brevo Security](https://app.brevo.com/security/authorised_ips).
5. **DKIM/SPF** — Configure DNS for `fletcherquillestates.com` in Brevo (improves deliverability).

## 2. Backend `.env`

Add to `reit-assistant-backend/.env`:

```env
# Supabase (for configure script)
SUPABASE_ACCESS_TOKEN=your-personal-access-token
SUPABASE_PROJECT_REF=yzepjzjkbjbmfveihllf

# Brevo SMTP → Supabase Auth
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-login@email.com
BREVO_SMTP_KEY=your-smtp-key-here
BREVO_SMTP_SENDER_EMAIL=reports@fletcherquillestates.com
BREVO_SMTP_SENDER_NAME=FQ Estates

# After SMTP is live
AUTH_AUTO_CONFIRM_EMAIL=false
AUTH_RESET_REDIRECT_URL=http://localhost:8081/login
```

Keep `BREVO_API_KEY` + `BREVO_SENDER_EMAIL` for share reports (REST API).

## 3. Apply SMTP to Supabase (automated)

```bash
cd reit-assistant-backend
bash scripts/configure-brevo-smtp.sh
```

This PATCHes your Supabase project auth config with Brevo SMTP settings.

## 3b. Manual setup (Supabase Dashboard)

**Authentication → SMTP Settings**

| Field | Value |
|-------|--------|
| Enable custom SMTP | On |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Your Brevo login email |
| Password | SMTP key (not API key) |
| Sender email | `reports@fletcherquillestates.com` |
| Sender name | `FQ Estates` |

## 4. Branded email templates

Copy HTML from `reit-assistant-backend/supabase/email-templates/` into Supabase:

**Authentication → Email Templates**

| Template | File |
|----------|------|
| Confirm signup | `confirmation.html` |
| Reset password | `recovery.html` |
| Invite user | `invite.html` |

Suggested subjects:

- Confirm signup: `Confirm your REIT Assistant account`
- Reset password: `Reset your REIT Assistant password`
- Invite: `You're invited to REIT Assistant`

## 5. Rate limits

After enabling custom SMTP, Supabase defaults to **30 auth emails/hour**.  
Raise in **Authentication → Rate Limits** when ready for production.

## 6. Test

1. Restart backend: `npm run dev`
2. **Password reset** — Login screen → Forgot password? → enter email → check inbox (uses SMTP + `recovery.html`).
3. **Share report** — Property → Share → Email (uses REST API + `emailAdapter.ts`).

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Auth email not received | Confirm custom SMTP enabled in Supabase; check Brevo SMTP key (not API key) |
| Share email not received | Check `BREVO_API_KEY`; whitelist IP for REST API |
| 401 from Brevo | Add IP to authorized list or rotate keys |
| Only team emails work | Default Supabase SMTP — custom SMTP not applied yet |
| Reset link broken | Set `AUTH_RESET_REDIRECT_URL` to your app login URL; add redirect URL in Supabase → Auth → URL Configuration |

## Architecture

```
Signup / Reset / Invite  →  Supabase Auth  →  Brevo SMTP  →  User inbox
Share analysis report    →  Backend API    →  Brevo REST  →  User inbox
```
