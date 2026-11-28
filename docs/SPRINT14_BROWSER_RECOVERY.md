# Sprint 14 browser recovery — 1.6.0-s14-recovery

## Proven defect and regression
The QA bridge used websocket-client `create_connection(..., timeout=5)` and a catch-all reader exit. Five seconds of idle traffic could terminate `recv()` while the simulated browser socket remained OPEN. `tests/browser_s14_transport_regression.py` reproduced the defect against a real SQLite backend: HTTP GET authorized for the guest returned NIGHT_COLLECT revision 2, while guest UI showed no phase, revision -1, connection online. See idle-before.log (exit 1). After setting the post-handshake read timeout to None, propagating remote close, serializing polling and draining pending bridge operations before context close, the same test passed (revision 2 on both clients), then both clients advanced to DAY_DISCUSS. No gameplay assertion or timeout was relaxed. The 6.5s idle interval in the new test exercises the old timeout deliberately; it is not a delay used for synchronization.

## Historical cases
S05: old log records a wait_for_function timeout after role assignment; exact line not recorded by its historical catch block. A pre-fix isolated rerun passed. S09: guest waits for NIGHT_COLLECT (line 34); S12: pages wait for NIGHT_COLLECT and ingame (line 20); S13: same assertion (line 27). All symptoms are consistent with the reproduced bridge defect but historical logs do not prove every individual root cause. S10: recovered old exit 0 and reran successfully. Prior TargetClosedError was logged during teardown; no such errors in the final runs. Parallel five-suite attempt interrupted by environment, not counted. No historical server revision/HTTP or WS telemetry beyond recorded logs is invented.

## Fix scope
Only QA Python transport and context teardown, package script/version, reporting. No change to frontend application, server, Engine, official rules, or persistent archive format. Native macOS HTTP/WS mode remains supported by existing harness; the acceptance here uses Linux bridge mode. Browser logs and individual exit codes are in reports/s14-recovery. Actual inherited manifest is 14 Sprint 12 suites plus Sprint 13, then Sprint 14 gameplay and new idle transport regression (17 total). No PostgreSQL server confirmed.

## Character work
No new role adapters in this recovery revision. R/F/S/A/B/C remain the prior gameplay scope; role completion and additional role expansion remain outstanding. Stable development baseline is not production acceptance.
