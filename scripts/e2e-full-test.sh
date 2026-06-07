#!/usr/bin/env bash
# Full E2E API test — auth, properties, rules, analyze, share, deals, tasks, portfolio, documents
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:3000}"
TEST_EMAIL="${TEST_EMAIL:-webtest2@fletcherquillestates.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test123!}"

PASS=0
FAIL=0
WARN=0

green() { printf '\033[0;32m✓ %s\033[0m\n' "$1"; PASS=$((PASS + 1)); }
red() { printf '\033[0;31m✗ %s\033[0m\n' "$1"; FAIL=$((FAIL + 1)); }
warn() { printf '\033[0;33m⚠ %s\033[0m\n' "$1"; WARN=$((WARN + 1)); }

assert_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "$name (HTTP $actual)"
  else
    red "$name — expected HTTP $expected, got $actual"
    head -c 600 /tmp/e2e-body.json 2>/dev/null || true
    echo
  fi
}

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local auth="${4:-}"
  local args=(-s -w '%{http_code}' -o /tmp/e2e-body.json -X "$method" "${API_URL}${path}" -H 'Content-Type: application/json')
  [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")
  [[ -n "$data" ]] && args+=(-d "$data")
  http_code=$(curl "${args[@]}")
}

echo "=============================================="
echo " REIT Assistant — Full E2E API Test"
echo " $(date -u '+%Y-%m-%d %H:%M UTC')"
echo " API: $API_URL"
echo "=============================================="
echo

# --- Health ---
request GET /health
assert_status "Health check" "200" "$http_code"

# --- Auth ---
request POST /api/auth/login "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrong\"}"
assert_status "Login rejects bad password" "401" "$http_code"

request POST /api/auth/login "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
assert_status "Login" "200" "$http_code"
TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['token'])")
green "JWT acquired"

request GET /api/user/me "" "$TOKEN"
assert_status "Profile" "200" "$http_code"

# --- Rules (OOB) ---
request GET /api/rules "" "$TOKEN"
assert_status "GET /api/rules" "200" "$http_code"
RULE_COUNT=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); r=d if isinstance(d,list) else d.get('rules',[]); print(len(r))")
SYSTEM=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); r=d if isinstance(d,list) else d.get('rules',[]); print(sum(1 for x in r if x.get('isSystem')))")
[[ "$RULE_COUNT" -ge 5 ]] && green "Out-of-box rules: $RULE_COUNT" || red "Rules count: $RULE_COUNT"
[[ "$SYSTEM" -ge 5 ]] && green "System rules flagged: $SYSTEM" || red "System rules: $SYSTEM"

# --- Property create (spreadsheet sample subset) ---
PROP='{"address":"E2E Full Test","city":"Seattle","state":"WA","zip":"98101","gross_rental_income":120000,"other_income":0,"vacancy_percent":5,"property_taxes":10000,"insurance":2000,"utilities":0,"repairs_maintenance":0,"property_management":0,"other_operating_expenses":5000,"cap_rate":6.5}'
request POST /api/properties "$PROP" "$TOKEN"
assert_status "Create property" "201" "$http_code"
PROP_ID=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['property']['id'])")
NOI=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['property']['noi'])")
VALUE=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['property']['indicated_value'])")
green "Property $PROP_ID — NOI=$NOI, Value=$VALUE"

request GET /api/properties "" "$TOKEN"
assert_status "List properties" "200" "$http_code"

# --- Rules Engine (analyze) ---
ANALYZE="{\"property_id\":\"$PROP_ID\",\"address\":\"E2E Full Test, Seattle, WA 98101\",\"propertyType\":\"Multifamily\",\"yearBuilt\":2005,\"sqft\":12000,\"units\":24,\"purchasePrice\":$VALUE,\"estimatedValue\":$VALUE,\"noi\":$NOI,\"occupancy\":92,\"loanAmount\":800000,\"interestRate\":5.75,\"loanTerm\":30}"
request POST /api/analyze "$ANALYZE" "$TOKEN"
assert_status "POST /api/analyze (Rules Engine)" "200" "$http_code"
SCORE=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('score',''))")
REC=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('recommendation',''))")
ANALYSIS_ID=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('id',''))")
if [[ -n "$SCORE" && -n "$REC" ]]; then
  green "Rules Engine result: $REC (score $SCORE)"
else
  red "Rules Engine missing score/recommendation"
fi

request GET "/api/analysis/$ANALYSIS_ID" "" "$TOKEN"
assert_status "GET /api/analysis/:id" "200" "$http_code"

# Re-run Rules Engine
request POST /api/analyze "$ANALYZE" "$TOKEN"
assert_status "POST /api/analyze (re-run)" "200" "$http_code"
green "Rules Engine re-run succeeded"

# --- Share & document export ---
request POST /api/reit/generate "{\"propertyId\":\"$PROP_ID\",\"format\":\"pdf\"}" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "POST /api/reit/generate (pdf)" "200" "$http_code"
  GEN_URL=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json')).get('url',''))")
  [[ -n "$GEN_URL" ]] && green "Generated report URL returned" || red "Generate missing url"
else
  warn "POST /api/reit/generate HTTP $http_code (Supabase export bucket or Puppeteer may be unavailable)"
fi

request POST /api/reit/share "{\"propertyId\":\"$PROP_ID\",\"type\":\"link\"}" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "POST /api/reit/share (link)" "200" "$http_code"
  SHARE_OK=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print('yes' if d.get('success') and d.get('url') else 'no')")
  [[ "$SHARE_OK" == "yes" ]] && green "Share link returned URL" || red "Share link missing success/url"
else
  warn "POST /api/reit/share (link) HTTP $http_code (document generation may have failed)"
fi

request POST /api/reit/share "{\"propertyId\":\"$PROP_ID\",\"type\":\"email\",\"recipient\":\"e2e@example.com\"}" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "POST /api/reit/share (email)" "200" "$http_code"
  EMAIL_OK=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print('yes' if d.get('success') else 'no')")
  [[ "$EMAIL_OK" == "yes" ]] && green "Share email accepted" || red "Share email missing success flag"
else
  warn "POST /api/reit/share (email) HTTP $http_code"
fi

request POST /api/reit/share "{\"propertyId\":\"$PROP_ID\",\"type\":\"email\",\"recipients\":[\"e2e@example.com\",\"e2e2@example.com\"]}" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "POST /api/reit/share (multi email)" "200" "$http_code"
  MULTI_EMAIL=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('sentCount', 0))")
  [[ "$MULTI_EMAIL" -ge 2 ]] && green "Share multi-email sentCount=$MULTI_EMAIL" || red "Share multi-email sentCount=$MULTI_EMAIL"
else
  warn "POST /api/reit/share (multi email) HTTP $http_code"
fi

request POST /api/reit/share "{\"propertyId\":\"$PROP_ID\",\"type\":\"sms\",\"recipient\":\"+15551234567\"}" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "POST /api/reit/share (sms)" "200" "$http_code"
  SMS_OK=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print('yes' if d.get('success') else 'no')")
  [[ "$SMS_OK" == "yes" ]] && green "Share SMS accepted" || red "Share SMS missing success flag"
elif [[ "$http_code" == "502" ]]; then
  warn "POST /api/reit/share (sms) HTTP 502 (SMS provider delivery failed — report may still have been generated)"
else
  warn "POST /api/reit/share (sms) HTTP $http_code"
fi

request POST /api/reit/share "{\"propertyId\":\"$PROP_ID\",\"type\":\"sms\",\"recipients\":[\"+15551234567\",\"+15559876543\"]}" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "POST /api/reit/share (multi sms)" "200" "$http_code"
  MULTI_SMS=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('sentCount', 0))")
  [[ "$MULTI_SMS" -ge 2 ]] && green "Share multi-sms sentCount=$MULTI_SMS" || red "Share multi-sms sentCount=$MULTI_SMS"
else
  warn "POST /api/reit/share (multi sms) HTTP $http_code"
fi

request POST /api/reit/share "{\"propertyId\":\"$PROP_ID\",\"type\":\"sms\"}" "$TOKEN"
assert_status "POST /api/reit/share rejects sms without recipient" "400" "$http_code"

# --- Deal (auto-deal flow) ---
DEAL_PAYLOAD="{\"property_id\":\"$PROP_ID\",\"status\":\"pipeline\",\"property_type\":\"Multifamily\",\"entry_mode\":\"manual\"}"
request POST /api/deals "$DEAL_PAYLOAD" "$TOKEN"
assert_status "POST /api/deals" "201" "$http_code"
DEAL_ID=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('id',''))")
PROP_ON_DEAL=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('propertyId',''))")
[[ "$PROP_ON_DEAL" == "$PROP_ID" ]] && green "Deal has propertyId" || warn "Deal propertyId: $PROP_ON_DEAL"

request GET /api/deals "" "$TOKEN"
assert_status "GET /api/deals (Tasks page)" "200" "$http_code"
DEAL_LIST_COUNT=$(python3 -c "import json; print(len(json.load(open('/tmp/e2e-body.json'))))")
green "Deals in list: $DEAL_LIST_COUNT"

request GET "/api/deals/$DEAL_ID" "" "$TOKEN"
assert_status "GET /api/deals/:id" "200" "$http_code"
DEAL_REC=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('recommendation','') or 'pending')")
DEAL_SCORE=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('score','') or 'none')")
if [[ "$DEAL_REC" != "pending" && "$DEAL_REC" != "" ]]; then
  green "Deal linked to Rules Engine: $DEAL_REC (score $DEAL_SCORE)"
else
  warn "Deal Rule Engine still pending (analysis may not be in DB — check GET deal after analyze)"
fi

request PATCH "/api/deals/$DEAL_ID" '{"status":"review"}' "$TOKEN"
assert_status "PATCH deal status → review" "200" "$http_code"

# --- Documents (Assessor import) ---
request POST "/api/deals/$DEAL_ID/documents" '{"name":"County Assessor Export.pdf","type":"pdf","size":"1.2 MB"}' "$TOKEN"
assert_status "POST /api/deals/:id/documents (Assessor)" "201" "$http_code"
DOC_COUNT=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(len(d.get('documents',[])))")
[[ "$DOC_COUNT" -ge 1 ]] && green "Deal documents: $DOC_COUNT" || red "No documents on deal after import"

# --- Tasks ---
request POST /api/tasks "{\"deal_id\":\"$DEAL_ID\",\"title\":\"E2E task\",\"status\":\"pending\",\"priority\":\"medium\"}" "$TOKEN"
if [[ "$http_code" == "201" ]]; then
  assert_status "POST /api/tasks" "201" "$http_code"
  TASK_ID=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('id',''))")
  request PATCH "/api/tasks/$TASK_ID" '{"status":"in_progress"}' "$TOKEN"
  assert_status "PATCH task status" "200" "$http_code"
else
  red "POST /api/tasks — HTTP $http_code (Supabase tasks table may need migration)"
  TASK_ID=""
fi

request GET /api/tasks "" "$TOKEN"
assert_status "GET /api/tasks" "200" "$http_code"

# --- Portfolio ---
request GET /api/portfolio/kpis "" "$TOKEN"
assert_status "GET /api/portfolio/kpis" "200" "$http_code"

request GET /api/portfolio/activity "" "$TOKEN"
assert_status "GET /api/portfolio/activity" "200" "$http_code"

request GET /api/portfolio/cap-rate-chart "" "$TOKEN"
if [[ "$http_code" == "200" ]]; then
  assert_status "GET /api/portfolio/cap-rate-chart" "200" "$http_code"
else
  warn "Cap rate chart HTTP $http_code (portfolio_kpi_source view may be missing in Supabase)"
fi

# --- Cleanup ---
request DELETE "/api/deals/$DEAL_ID" "" "$TOKEN"
assert_status "DELETE deal" "200" "$http_code"
request DELETE "/api/properties/$PROP_ID" "" "$TOKEN"
assert_status "DELETE property" "200" "$http_code"

echo
echo "=============================================="
echo " Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "=============================================="
[[ "$FAIL" -gt 0 ]] && exit 1
exit 0
