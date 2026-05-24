#!/usr/bin/env bash
# REIT Assistant — Beta manual-entry UI checklist (Mobile M1–M9; optional root Expo B1–B22)
#
# Beta pass = M1–M8 (mobile manual entry MVP). B-steps are optional UI exploration.
# See docs/BETA_MANUAL_ENTRY.md and docs/MVP_TEST_SCRIPT.md

set -euo pipefail

MODE="print"
SAVE_PATH=""
TESTER="${TESTER:-}"
TEST_DATE="${TEST_DATE:-$(date +%Y-%m-%d)}"

usage() {
  cat <<'EOF'
Usage: mvp-manual-checklist.sh [OPTIONS]

Options:
  --print          Print checklist run sheet (default)
  --interactive    Prompt for Pass / Fail / Skip on each step
  --save FILE      With --interactive, append summary to FILE
  --tester NAME    Record tester name on sign-off
  --date DATE      Override test date (default: today)
  -h, --help       Show this help

Prerequisites:
  - Backend running: cd reit-assistant-backend && npm run dev
  - API tests passed:  ./scripts/mvp-api-test.sh
  - Mobile app:        cd reit-assistant-mobile && npm start
  - Beta app:          npm start (repo root)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --print) MODE="print" ;;
    --interactive) MODE="interactive" ;;
    --save) SAVE_PATH="$2"; shift ;;
    --tester) TESTER="$2"; shift ;;
    --date) TEST_DATE="$2"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

# id|section|step|expected|data_source
CHECKLIST=(
  "M1|Mobile — Auth (live)|Open app|Login screen; email prefilled in dev|Live"
  "M2|Mobile — Auth (live)|Tap Sign In|Dashboard with KPIs and activity feed|Live"
  "M3|Mobile — Auth (live)|Confirm bottom nav|5 tabs: Home, Deals, Analyze, Tasks, Profile|Live"
  "M4|Mobile — Property Analyzer|Tap Analyze tab or emerald FAB|3-step Property Analyzer opens|Live"
  "M5|Mobile — Property Analyzer|Step 1: Execute Search|Banner confirms manual entry until ATTOM|Live"
  "M6|Mobile — Property Analyzer|Steps 2–3: Save spreadsheet sample|Alert: NOI ~125,076; Value ~2,007,637|Live"
  "M7|Mobile — Property Analyzer|Return to Dashboard|Dashboard visible after save|Live"
  "M8|Mobile — Auth (live)|Profile → Log out|Returns to Login screen|Live"
  "B1|Beta — Auth (live)|Open app → /login|Fletcher Test email prefilled in dev|Live"
  "B2|Beta — Auth (live)|Sign In|Redirect to Dashboard|Live"
  "B3|Beta — Auth (live)|Profile tab|Shows Fletcher Test + email|Live"
  "B4|Beta — Auth (live)|Log Out|Returns to login|Live"
  "B5|Beta — Dashboard (mock)|Dashboard tab|4 KPI cards visible|Mock"
  "B6|Beta — Dashboard (mock)|Scroll activity feed|Recent items listed|Mock"
  "B7|Beta — Dashboard (mock)|View cap rate chart|Bar chart renders|Mock"
  "B8|Beta — Dashboard (mock)|Tap FAB or Analyze tab|Analyzer wizard opens|UI"
  "B9|Beta — Analyzer (client)|Step 1: basic info|Continue enabled after valid input|Client"
  "B10|Beta — Analyzer (client)|Step 2: financials|Continue enabled after valid input|Client"
  "B11|Beta — Analyzer (client)|Step 3: Submit|Loading then results screen|Client"
  "B12|Beta — Analyzer (client)|Results: score + recommendation|BUY/NEGOTIATE/HOLD/PASS shown|Client"
  "B13|Beta — Analyzer (client)|Results: rules/risks/opportunities|Sections populated|Client"
  "B14|Beta — Deals (mock)|Deals tab|List of deals visible|Mock"
  "B15|Beta — Deals (mock)|Tap a deal|Detail with tabs (Overview, Financials, etc.)|Mock"
  "B16|Beta — Tasks (mock)|Tasks tab|Kanban columns visible|Mock"
  "B17|Beta — Tasks (mock)|Long-press task card|Status cycles across columns|Mock"
  "B18|Beta — Tasks (mock)|+ Add Task|Modal opens; new task appears|Mock"
  "B19|Beta — Rules (mock)|Profile → Investment Rules|Rules list visible|Mock"
  "B20|Beta — Rules (mock)|Add rule + toggle + test|UI responds without crash|Mock"
  "B21|Beta — Settings (local)|Dark mode toggle|Theme changes|Local"
  "B22|Beta — Settings (local)|Left-handed mode toggle|FAB/nav layout adjusts|Local"
)

# Parallel arrays for interactive results (bash 3 compatible)
RESULT_IDS=()
RESULT_VALUES=()
RESULT_NOTES=()

get_result() {
  local id="$1"
  local i
  for i in "${!RESULT_IDS[@]}"; do
    if [[ "${RESULT_IDS[$i]}" == "$id" ]]; then
      echo "${RESULT_VALUES[$i]}"
      return 0
    fi
  done
  echo ""
}

get_note() {
  local id="$1"
  local i
  for i in "${!RESULT_IDS[@]}"; do
    if [[ "${RESULT_IDS[$i]}" == "$id" ]]; then
      echo "${RESULT_NOTES[$i]:-}"
      return 0
    fi
  done
  echo ""
}

set_result() {
  local id="$1" val="$2" note="${3:-}"
  local i
  for i in "${!RESULT_IDS[@]}"; do
    if [[ "${RESULT_IDS[$i]}" == "$id" ]]; then
      RESULT_VALUES[$i]="$val"
      RESULT_NOTES[$i]="$note"
      return 0
    fi
  done
  RESULT_IDS+=("$id")
  RESULT_VALUES+=("$val")
  RESULT_NOTES+=("$note")
}

print_header() {
  cat <<EOF
================================================================================
 REIT Assistant — Manual UI Test Run Sheet
 Date: ${TEST_DATE}    Tester: ${TESTER:-________________}
 Test user: webtest2@fletcherquillestates.com / Test123!
================================================================================

 BEFORE YOU START
 [ ] Backend running (reit-assistant-backend: npm run dev)
 [ ] API smoke tests passed (./scripts/mvp-api-test.sh)
 [ ] Mobile app started (reit-assistant-mobile: npm start)
 [ ] Beta app started (repo root: npm start)

 MVP COVERAGE KEY
   Live   = real backend + Supabase
   Mock   = UI with sample data (no live API yet)
   Client = rules engine runs on device
   Local  = device settings only

 PASS CRITERIA (Beta manual entry)
   Mobile required: M1–M8 — auth + manual property + server NOI/Value
   Mobile optional:  M9 (register)
   Root Expo B1–B22: optional mock UI exploration (not Beta pass/fail)

 OUT OF SCOPE
   ATTOM/external data, PropertyDetails/EditProperty screens, OAuth

EOF
}

print_table() {
  local current_section=""
  printf '%-4s %-28s %-32s %-36s %-6s %-6s\n' 'ID' 'Section' 'Step' 'Expected' 'Source' 'Result'
  printf '%s\n' "$(printf '%.0s-' {1..120})"

  for row in "${CHECKLIST[@]}"; do
    IFS='|' read -r id section step expected source <<< "$row"
    if [[ "$section" != "$current_section" ]]; then
      current_section="$section"
      echo ""
      echo "  --- $section ---"
    fi
    local result
    result="$(get_result "$id")"
    if [[ "$MODE" == "print" || -z "$result" ]]; then
      result="☐ Pass  ☐ Fail"
    else
      result="$result"
    fi
    printf '%-4s %-28s %-32s %-36s %-6s %s\n' "$id" "$section" "$step" "$expected" "$source" "$result"
  done
  echo ""
}

print_signoff() {
  local mobile_pass="${1:-}"
  local beta_pass="${2:-}"
  local notes="${3:-}"

  cat <<EOF
================================================================================
 SIGN-OFF
================================================================================
 Tester:     ${TESTER:-________________}
 Date:       ${TEST_DATE}
 Mobile M1–M8:  ${mobile_pass:-☐ Pass   ☐ Fail}
 Beta B1–B22:   ${beta_pass:-☐ Pass   ☐ Fail}
 Notes:      ${notes:-____________________________________________________________}

 Out of scope (do not mark fail if missing):
   OAuth, forgot-password, live portfolio API, ATTOM, offline sync

 Reference: docs/MVP_TEST_SCRIPT.md
================================================================================
EOF
}

run_interactive() {
  print_header
  echo ""
  echo "Interactive mode — enter P (pass), F (fail), or S (skip) for each step."
  echo ""

  local pass=0 fail=0 skip=0
  local mobile_fail=0 beta_fail=0
  local current_section=""

  for row in "${CHECKLIST[@]}"; do
    IFS='|' read -r id section step expected source <<< "$row"
    if [[ "$section" != "$current_section" ]]; then
      current_section="$section"
      echo ""
      echo "=== $section ==="
    fi

    echo ""
    echo "[$id] $step"
    echo "     Expected: $expected"
    echo "     Source:   $source"

    local answer=""
    while [[ ! "$answer" =~ ^[PpFfSs]$ ]]; do
      read -r -p "     Result [P/F/S]: " answer
      if [[ ! "$answer" =~ ^[PpFfSs]$ ]]; then
        echo "     Enter P (pass), F (fail), or S (skip)."
      fi
    done

    case "$(echo "$answer" | tr '[:lower:]' '[:upper:]')" in
      P)
        set_result "$id" "PASS" ""
        pass=$((pass + 1))
        echo "     → PASS"
        ;;
      F)
        fail=$((fail + 1))
        if [[ "$id" =~ ^M[1-8]$ ]]; then mobile_fail=$((mobile_fail + 1)); fi
        if [[ "$id" =~ ^B ]]; then beta_fail=$((beta_fail + 1)); fi
        echo "     → FAIL"
        read -r -p "     Notes (optional): " note
        set_result "$id" "FAIL" "$note"
        ;;
      S)
        set_result "$id" "SKIP" ""
        skip=$((skip + 1))
        echo "     → SKIP"
        ;;
    esac
  done

  echo ""
  echo "================================================================================"
  echo " SUMMARY: $pass passed, $fail failed, $skip skipped (of ${#CHECKLIST[@]} steps)"
  echo "================================================================================"

  local mobile_status="PASS"
  local beta_status="PASS"
  [[ "$mobile_fail" -gt 0 ]] && mobile_status="FAIL"
  [[ "$beta_fail" -gt 0 ]] && beta_status="FAIL"

  print_signoff "$mobile_status" "$beta_status" ""

  if [[ -n "$SAVE_PATH" ]]; then
    {
      echo "REIT Assistant Manual Test Results"
      echo "Date: $TEST_DATE  Tester: ${TESTER:-unknown}"
      echo "Passed: $pass  Failed: $fail  Skipped: $skip"
      echo ""
      for row in "${CHECKLIST[@]}"; do
        IFS='|' read -r id section step expected source <<< "$row"
        echo "$id | $(get_result "$id") | $step"
        note="$(get_note "$id")"
        if [[ -n "$note" ]]; then
          echo "    note: $note"
        fi
      done
      echo ""
      echo "Mobile M1-M8: $mobile_status"
      echo "Beta B1-B22: $beta_status"
    } >> "$SAVE_PATH"
    echo ""
    echo "Results saved to: $SAVE_PATH"
  fi

  echo ""
  print_table

  if [[ "$fail" -gt 0 ]]; then
    exit 1
  fi
}

case "$MODE" in
  print)
    print_header
    print_table
    print_signoff
    ;;
  interactive)
    run_interactive
    ;;
esac
