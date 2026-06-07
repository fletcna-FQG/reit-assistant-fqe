# Brevo SMS setup — REIT Assistant (Share → SMS)

Share → SMS uses the **Brevo transactional SMS API** with sender ID **`FQEstates`**.  
This is separate from Supabase Auth email (SMTP). See also [BREVO_SMTP_SETUP.md](./BREVO_SMTP_SETUP.md).

## 1. Live opt-in pages (implemented in app)

These routes match the Brevo compliance mockups and can be used for verification screenshots:

| Route | Purpose |
|-------|---------|
| `/sms-updates` | Website opt-in form (phone + consent → `POST /api/sms/subscribe`) |
| `/join-sms` | QR code + keyword **JOIN** instructions |
| `/privacy` | Privacy policy (linked from consent) |
| `/terms` | Terms of service |
| `/sms-policy` | SMS program policy |

**Local web:** `npm run web` → `http://localhost:8081/sms-updates` and `/join-sms`

**Production:** deploy the Expo web app to Northflank — see [DEPLOY_WEB_NORTHFLANK.md](./DEPLOY_WEB_NORTHFLANK.md)  
Live URLs: `https://www.fletcherquillestates.com/sms-updates` and `/join-sms`

Static mockup HTML (optional): [`docs/BREVO_SMS_OPTIN_MOCKUP.html`](./BREVO_SMS_OPTIN_MOCKUP.html)

Run migration `20260608120000_sms_opt_ins.sql` in Supabase before using the subscription form in production.

## 2. Compliance mockups (upload to Brevo)

Open in a browser and capture **two screenshots** for sender verification:

**File:** [`docs/BREVO_SMS_OPTIN_MOCKUP.html`](./BREVO_SMS_OPTIN_MOCKUP.html)

| Brevo field | Screenshot |
|-------------|------------|
| **Website opt-in** | Full frame under “Screenshot 1 — Website opt-in” |
| **Keyword or QR code opt-in** | Full frame under “Screenshot 2 — Keyword or QR code opt-in” |

**Capture tips**

1. Click **Hide setup notes** in the mockup before screenshotting (hides the gray instruction banner).
2. Browser zoom **100%**; capture only the white “browser window” frame.
3. macOS: `Cmd + Shift + 4` → drag around each frame.

**Before upload**, edit the `CONFIG` block at the top of the HTML if Brevo assigned you a specific SMS number or keyword (defaults match this project).

## 2. Brevo dashboard checklist

1. **SMS credits** — Brevo → Account → SMS credits (purchase if empty).
2. **Register SMS sender** — Campaigns → SMS → Senders → add **`FQEstates`** (max 11 alphanumeric characters).
3. **Upload opt-in proof** — Use the two screenshots from the mockup HTML.
4. **Authorized IPs** — [Brevo Security](https://app.brevo.com/security/authorised_ips)  
   - Add Northflank egress IP **or** disable IP blocking.  
   - Same requirement as Share → Email (`BREVO_API_KEY`).
5. **API key** — Use the same REST key as share email (`BREVO_API_KEY`).

## 3. Environment variables

### Local (`reit-assistant-backend/.env`)

```env
BREVO_API_KEY=your-rest-api-key
BREVO_SENDER_EMAIL=reports@fletcherquillestates.com
BREVO_SENDER_NAME=FQ Estates
BREVO_SMS_SENDER=FQEstates
SMS_PROVIDER=brevo
```

**Important:** `BREVO_SENDER_NAME` is the **email display name only**. Never use an email address as the SMS sender — Brevo returns `Invalid sender name`.

### Northflank (production)

| Variable | Value |
|----------|--------|
| `BREVO_API_KEY` | REST API key |
| `BREVO_SENDER_EMAIL` | `reports@fletcherquillestates.com` |
| `BREVO_SENDER_NAME` | `FQ Estates` |
| `BREVO_SMS_SENDER` | `FQEstates` |
| `SMS_PROVIDER` | `brevo` |

Redeploy after changing env vars. On boot you should see:

```text
[smsFactory] Brevo SMS enabled (sender: FQEstates)
```

## 4. What the app sends

When a user taps **Share → Send SMS**, the backend:

1. Generates a PDF report (Puppeteer) and uploads to Supabase Storage.
2. Sends a **transactional** SMS via Brevo with the signed report link.

Message shape:

```text
FQ Estates Analysis: {property} — {recommendation} ({score}/100). View report: {url}
```

Recipients must have opted in per your Brevo-approved process (mockup documents that flow).

## 5. Smoke test

```bash
# Health
curl https://p01--reit-assistant-v2--99vpsnwm46h4.code.run/health

# Share SMS (replace TOKEN, PROPERTY_ID, phone)
curl -X POST https://p01--reit-assistant-v2--99vpsnwm46h4.code.run/api/reit/share \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"PROPERTY_UUID","type":"sms","recipient":"+15551234567"}'
```

**Success:** HTTP `200`, `"success": true`, `"sentCount": 1`  
**Sender misconfigured:** HTTP `502`, `"message"` contains Brevo error (e.g. invalid sender)  
**IP blocked:** `"message"` mentions unrecognized IP → whitelist Northflank in Brevo

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502` — Invalid sender name | Set `BREVO_SMS_SENDER=FQEstates`; register sender in Brevo |
| `502` — unrecognized IP | Whitelist Northflank egress IP in Brevo Security |
| `502` — insufficient credits | Purchase SMS credits in Brevo |
| Client timeout (15s+) | Frontend uses 120s timeout for share; PDF gen can take 30–60s on cold start |
| Email works, SMS fails | SMS sender and credits are separate from email verification |

## 7. Copy for Brevo verification forms

**Website opt-in description:**

> Users subscribe on fletcherquillestates.com/sms-updates by entering their mobile number and checking a consent box. They agree to receive transactional SMS from Fletcher Quill Estates Inc. (sender FQEstates) with REIT analysis report links and related notifications. Messages include STOP to unsubscribe and HELP for support.

**Keyword / QR description:**

> Users may scan a QR code on fletcherquillestates.com/join-sms or text JOIN to our SMS number to opt in. Auto-reply confirms subscription and links to Terms and Privacy. Sender ID: FQEstates.
