#!/bin/bash
cd /tmp/wv36
WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs >reports/v1.7.36/backend-full.log 2>&1
printf '%s\n' "$?" >reports/v1.7.36/backend-full.exit
export WV_E2E_DIRECT=0 WV_BROWSER_MANIFEST=reports/v1.7.36/BROWSER_MANIFEST.json
node scripts/s15-bb-official-browser-matrix.mjs reports/v1.7.36/browser-mirror browser_s26_mirror_normal_e2e.py >reports/v1.7.36/browser-mirror-run.log 2>&1
printf '%s\n' "$?" >reports/v1.7.36/browser-mirror.exit
node scripts/s15-bb-official-browser-matrix.mjs reports/v1.7.36/browser-regression $(cat /tmp/wv36-browser-suites.txt) >reports/v1.7.36/browser-regression-run.log 2>&1
printf '%s\n' "$?" >reports/v1.7.36/browser-regression.exit
