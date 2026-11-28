#!/usr/bin/env bash
set -u
R=reports/v1.8.0-development
export WV_E2E_DIRECT=0 WV_BROWSER_MANIFEST="$R/BROWSER_MANIFEST.json"
export WV_SCREENSHOT_DIR="$R/screenshots"
mapfile -t NEW < <(python -c 'import json; print("\n".join(json.load(open("reports/v1.8.0-development/browser-plan.json"))["new"]))')
mapfile -t OLD < <(python -c 'import json; print("\n".join(json.load(open("reports/v1.8.0-development/browser-plan.json"))["old"]))')
mapfile -t EXTRA < <(python -c 'import json; print("\n".join(json.load(open("reports/v1.8.0-development/browser-plan.json"))["extra"]))')
node scripts/s15-bb-official-browser-matrix.mjs "$R/browser-new" "${NEW[@]}" > "$R/browser-new.log" 2>&1
echo $? > "$R/browser-new.exit"
node scripts/s15-bb-official-browser-matrix.mjs "$R/browser-regression" "${OLD[@]}" "${EXTRA[@]}" > "$R/browser-regression.log" 2>&1
echo $? > "$R/browser-regression.exit"
