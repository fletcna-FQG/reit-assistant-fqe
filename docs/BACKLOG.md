# REIT Assistant — Backlog

Future work not in the current sprint. Add items here with context and trade-offs.

---

## Share report storage

**Status:** Signed URLs implemented (2026-06-07)  
**Current behavior:** PDFs/DOCX/PPTX upload to private Supabase bucket `export`. Share → Email and Copy Link use **signed URLs** (30-day expiry). Fixes `404 Bucket not found` when bucket is private.

### Optional: public `export` bucket

**Priority:** Low  
**Request:** Evaluate making the `export` bucket **public** so report links use permanent public URLs (no `?token=` expiry).

| Approach | Pros | Cons |
|----------|------|------|
| **Private + signed URLs** (current) | Better fit for “Confidential Analysis”; unguessable paths + time-limited access | Links expire after 30 days; old email links stop working |
| **Public bucket** | Simple permanent links; no expiry | Anyone with the URL can access; weaker confidentiality |

**If pursued:** set `storage.buckets.public = true` for `export`, revert `documentGenerator.ts` to `getPublicUrl()`, and confirm RLS/policies. Re-test Share → Email and Copy Link.

**Related follow-ups (optional):**

- Configurable signed-URL TTL via env (e.g. 7 / 30 / 90 days)
- Regenerate / refresh link from property or deal detail after expiry
- Add Share modal to `reit-assistant-mobile`
