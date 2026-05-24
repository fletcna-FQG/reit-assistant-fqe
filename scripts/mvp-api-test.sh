#!/usr/bin/env bash
# REIT Assistant — Beta manual-entry API tests
# Validates auth, property CRUD, and spreadsheet sample calculations (server-side).
#
# Usage: ./scripts/mvp-api-test.sh
# Requires: backend on http://127.0.0.1:3000 (NOT localhost)

set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:3000}"
TEST_EMAIL="${TEST_EMAIL:-webtest2@fletcherquillestates.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test123!}"

PASS=0
FAIL=0
CREATED_PROPERTY_ID=""

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
    if [[ -f /tmp/reit-test-body.json ]]; then
      echo "  Response: $(cat /tmp/reit-test-body.json)"
    fi
  fi
}

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local auth="${4:-}"

  local args=(-s -w '%{http_code}' -o /tmp/reit-test-body.json -X "$method" "${API_URL}${path}" -H 'Content-Type: application/json')
  if [[ -n "$auth" ]]; then
    args+=(-H "Authorization: Bearer $auth")
  fi
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi

  status=$(curl "${args[@]}")
}

assert_near() {
  local name="$1"
  local actual="$2"
  local expected="$3"
  local tolerance="${4:-1}"

  python3 - "$name" "$actual" "$expected" "$tolerance" <<'PY'
import sys
name, actual, expected, tol = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
if abs(actual - expected) <= tol:
    print(f"\033[0;32m✓ {name}: {actual:,.2f} ≈ {expected:,.2f}\033[0m")
    sys.exit(0)
print(f"\033[0;31m✗ {name}: got {actual:,.2f}, expected ~{expected:,.2f} (±{tol})\033[0m")
sys.exit(1)
PY
  if [[ $? -eq 0 ]]; then PASS=$((PASS + 1)); else FAIL=$((FAIL + 1)); fi
}

echo "=============================================="
echo " REIT Assistant Beta — Manual Entry API Tests"
echo " API: $API_URL (use 127.0.0.1, not localhost)"
echo " User: $TEST_EMAIL"
echo " Strategy: manual input → server calculates EGI/NOI/Value"
echo "=============================================="
echo

request GET /health
assert_status "Health check" "200" "$status"

request POST /api/auth/login "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrong-password\"}"
assert_status "Login rejects bad password" "401" "$status"

request POST /api/auth/login "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
assert_status "Login with test user" "200" "$status"

TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/reit-test-body.json'))['token'])" 2>/dev/null || true)
if [[ -z "${TOKEN:-}" ]]; then
  red "Could not parse auth token — stopping"
  exit 1
fi
green "JWT token acquired"

request GET /api/user/me
assert_status "Profile rejects missing token" "401" "$status"

request GET /api/user/me "" "$TOKEN"
assert_status "Get authenticated profile" "200" "$status"

# Property search (Beta: manual entry after search until ATTOM UI)
request POST /api/properties/search '{"address":"123 Main St","city":"Seattle","state":"WA","zip":"98101"}' "$TOKEN"
assert_status "Execute property search" "200" "$status"

# Validation: vacancy > 100
request POST /api/properties '{"address":"1 A","city":"S","state":"WA","zip":"98101","gross_rental_income":100,"other_income":0,"vacancy_percent":101,"property_taxes":0,"insurance":0,"utilities":0,"repairs_maintenance":0,"property_management":0,"other_operating_expenses":0,"cap_rate":6}' "$TOKEN"
assert_status "Reject vacancy > 100" "400" "$status"

# Validation: cap rate <= 0
request POST /api/properties '{"address":"1 A","city":"S","state":"WA","zip":"98101","gross_rental_income":100,"other_income":0,"vacancy_percent":5,"property_taxes":0,"insurance":0,"utilities":0,"repairs_maintenance":0,"property_management":0,"other_operating_expenses":0,"cap_rate":0}' "$TOKEN"
assert_status "Reject cap rate <= 0" "400" "$status"

# CRE_Valuation_NOI_CapRate spreadsheet sample
SPREADSHEET_PAYLOAD='{
  "address": "123 Main St",
  "city": "Seattle",
  "state": "WA",
  "zip": "98101",
  "gross_rental_income": 177204,
  "other_income": 4500,
  "vacancy_percent": 5,
  "property_taxes": 12879,
  "insurance": 0,
  "utilities": 0,
  "repairs_maintenance": 0,
  "property_management": 0,
  "other_operating_expenses": 34664,
  "cap_rate": 6.23
}'

request POST /api/properties "$SPREADSHEET_PAYLOAD" "$TOKEN"
assert_status "Create property (spreadsheet sample)" "201" "$status"

NOI=$(python3 -c "import json; print(json.load(open('/tmp/reit-test-body.json'))['property']['noi'])" 2>/dev/null || echo "0")
VALUE=$(python3 -c "import json; print(json.load(open('/tmp/reit-test-body.json'))['property']['indicated_value'])" 2>/dev/null || echo "0")
EGI=$(python3 -c "import json; print(json.load(open('/tmp/reit-test-body.json'))['property']['egi'])" 2>/dev/null || echo "0")
EXP=$(python3 -c "import json; print(json.load(open('/tmp/reit-test-body.json'))['property']['total_operating_expenses'])" 2>/dev/null || echo "0")
CREATED_PROPERTY_ID=$(python3 -c "import json; print(json.load(open('/tmp/reit-test-body.json'))['property']['id'])" 2>/dev/null || true)

assert_near "EGI (server-side)" "$EGI" "172618.8" "0.5"
assert_near "Total operating expenses" "$EXP" "47543" "0.5"
assert_near "NOI (server-side)" "$NOI" "125075.8" "1"
assert_near "Indicated value (server-side)" "$VALUE" "2007637.24" "5"

request GET /api/properties "" "$TOKEN"
assert_status "List properties for tenant" "200" "$status"

if [[ -n "${CREATED_PROPERTY_ID:-}" ]]; then
  request DELETE "/api/properties/$CREATED_PROPERTY_ID" "" "$TOKEN"
  assert_status "Delete spreadsheet test property (cleanup)" "200" "$status"
fi

echo
echo "=============================================="
echo " Results: $PASS passed, $FAIL failed"
echo "=============================================="

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
