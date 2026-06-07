#!/usr/bin/env bash
# Extended E2E API tests — deals, tasks, portfolio, rules, analyze
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:3000}"
TEST_EMAIL="${TEST_EMAIL:-webtest2@fletcherquillestates.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test123!}"

PASS=0
FAIL=0

green() { printf '\033[0;32m✓ %s\033[0m\n' "$1"; PASS=$((PASS + 1)); }
red() { printf '\033[0;31m✗ %s\033[0m\n' "$1"; FAIL=$((FAIL + 1)); }

assert_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "$name (HTTP $actual)"
  else
    red "$name — expected HTTP $expected, got $actual"
    head -c 800 /tmp/e2e-body.json 2>/dev/null || true
    echo
  fi
}

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local auth="${4:-}"

  local args=(-s -w '%{http_code}' -o /tmp/e2e-body.json -X "$method" "${API_URL}${path}" -H 'Content-Type: application/json')
  if [[ -n "$auth" ]]; then
    args+=(-H "Authorization: Bearer $auth")
  fi
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi

  http_code=$(curl "${args[@]}")
}

echo "=============================================="
echo " REIT Assistant — Extended E2E API Tests"
echo " API: $API_URL"
echo "=============================================="
echo

request POST /api/auth/login "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
assert_status "Auth login" "200" "$http_code"
TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['token'])")

request GET /api/rules "" "$TOKEN"
assert_status "GET /api/rules" "200" "$http_code"
RULE_COUNT=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); rules=d if isinstance(d,list) else d.get('rules',[]); print(len(rules))")
SYSTEM=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); rules=d if isinstance(d,list) else d.get('rules',[]); print(sum(1 for x in rules if x.get('isSystem')))")
if [[ "$RULE_COUNT" -ge 5 ]]; then green "Rules count: $RULE_COUNT"; else red "Rules count: $RULE_COUNT (expected >= 5)"; fi
if [[ "$SYSTEM" -ge 5 ]]; then green "System rules: $SYSTEM"; else red "System rules: $SYSTEM (expected 5)"; fi

PROP='{"address":"E2E Test Property","city":"Seattle","state":"WA","zip":"98101","gross_rental_income":120000,"other_income":0,"vacancy_percent":5,"property_taxes":10000,"insurance":2000,"utilities":0,"repairs_maintenance":0,"property_management":0,"other_operating_expenses":5000,"cap_rate":6.5}'

request POST /api/properties "$PROP" "$TOKEN"
assert_status "Create property for E2E" "201" "$http_code"
PROP_ID=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['property']['id'])")
NOI=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['property']['noi'])")
VALUE=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json'))['property']['indicated_value'])")
green "Property ID: $PROP_ID (NOI=$NOI, Value=$VALUE)"

ANALYZE="{\"property_id\":\"$PROP_ID\",\"address\":\"E2E Test Property\",\"propertyType\":\"Multifamily\",\"yearBuilt\":2005,\"sqft\":12000,\"units\":24,\"purchasePrice\":$VALUE,\"estimatedValue\":$VALUE,\"noi\":$NOI,\"occupancy\":92,\"loanAmount\":800000,\"interestRate\":5.75,\"loanTerm\":30}"
request POST /api/analyze "$ANALYZE" "$TOKEN"
assert_status "POST /api/analyze (Rules Engine)" "200" "$http_code"
SCORE=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('score','?'))")
REC=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('recommendation','?'))")
green "Analysis score: $SCORE, recommendation: $REC"
ANALYSIS_ID=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('id',''))")
if [[ -n "$ANALYSIS_ID" && "$ANALYSIS_ID" != "None" ]]; then
  request GET "/api/analysis/$ANALYSIS_ID" "" "$TOKEN"
  assert_status "GET /api/analysis/:id" "200" "$http_code"
else
  red "No analysis ID returned (in-memory only — migration may be pending)"
fi

DEAL="{\"property_id\":\"$PROP_ID\",\"status\":\"pipeline\",\"property_type\":\"Multifamily\",\"entry_mode\":\"manual\"}"
request POST /api/deals "$DEAL" "$TOKEN"
assert_status "POST /api/deals" "201" "$http_code"
DEAL_ID=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('id',''))")

request GET /api/deals "" "$TOKEN"
assert_status "GET /api/deals" "200" "$http_code"
DEAL_FOUND=$(python3 -c "import json; deals=json.load(open('/tmp/e2e-body.json')); print('yes' if any(d.get('id')=='$DEAL_ID' for d in deals) else 'no')")
if [[ "$DEAL_FOUND" == "yes" ]]; then green "Deal visible in list"; else red "Deal not found in GET /api/deals"; fi

if [[ -n "$DEAL_ID" ]]; then
  request PATCH "/api/deals/$DEAL_ID" '{"status":"review"}' "$TOKEN"
  assert_status "PATCH deal status → review" "200" "$http_code"
  NEW_STATUS=$(python3 -c "import json; print(json.load(open('/tmp/e2e-body.json')).get('status',''))")
  if [[ "$NEW_STATUS" == "review" ]]; then green "Deal status updated to review"; else red "Deal status is '$NEW_STATUS' (expected review)"; fi
fi

TASK="{\"deal_id\":\"$DEAL_ID\",\"title\":\"E2E Test Task\",\"description\":\"Kanban test\",\"status\":\"pending\",\"priority\":\"medium\"}"
request POST /api/tasks "$TASK" "$TOKEN"
assert_status "POST /api/tasks" "201" "$http_code"
TASK_ID=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(d.get('id',''))")

request GET /api/tasks "" "$TOKEN"
assert_status "GET /api/tasks" "200" "$http_code"
TASK_COUNT=$(python3 -c "import json; tasks=json.load(open('/tmp/e2e-body.json')); print(len(tasks))")
green "Tasks in list: $TASK_COUNT"

if [[ -n "$TASK_ID" ]]; then
  request PATCH "/api/tasks/$TASK_ID" '{"status":"in_progress"}' "$TOKEN"
  assert_status "PATCH task → in_progress" "200" "$http_code"
fi

request GET /api/portfolio/kpis "" "$TOKEN"
assert_status "GET /api/portfolio/kpis" "200" "$http_code"
KPI_KEYS=$(python3 -c "import json; d=json.load(open('/tmp/e2e-body.json')); print(','.join(sorted(d.keys())))")
green "Portfolio KPI keys: $KPI_KEYS"

request GET /api/portfolio/activity "" "$TOKEN"
assert_status "GET /api/portfolio/activity" "200" "$http_code"

request GET /api/portfolio/cap-rate-chart "" "$TOKEN"
assert_status "GET /api/portfolio/cap-rate-chart" "200" "$http_code"

if [[ -n "$DEAL_ID" ]]; then
  request DELETE "/api/deals/$DEAL_ID" "" "$TOKEN"
  assert_status "DELETE deal cleanup" "200" "$http_code"
fi
request DELETE "/api/properties/$PROP_ID" "" "$TOKEN"
assert_status "DELETE property cleanup" "200" "$http_code"

echo
echo "=============================================="
echo " Extended Results: $PASS passed, $FAIL failed"
echo "=============================================="

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
