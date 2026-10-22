# PokerLab V2 status

**Implemented locally; browser acceptance remains outstanding.** No deployment, cloud resources, accounts or financial integration.

The actual V1 repository independently passed TypeScript, lint, 89 routine tests and build in the resumed audit. The saved V2 source was recovered without replacing V1 first, audited, verified, and then applied to this existing application. Its evaluator is byte-identical to V1. The original V1 ZIP is preserved separately.

Play includes fresh secure dealing, fixed blinds, legal no-limit action, full/short/cumulative raises, pots/refunds/ties/odd chips, conserved chips, NPCs with restricted observations, elimination, last-player-standing outcomes, active persistence and bounded public history. The final review added cross-participant card validation at standalone pot resolution and removed random-session survival assumptions from the settlement E2E scenario.

| Fresh verification | Observed result |
| --- | --- |
| Strict TypeScript (including E2E and QA fixtures), lint, production build | Passed |
| Routine tests | 152 passed; optional census skipped in normal run |
| Separate exhaustive census | Passed: 2,598,960 five-card hands |
| Stress | 5,000 hands / 26,313 transitions / 710 sessions / 1,535 eliminations / 360 sole-survivor outcomes; no invariant failure |
| Local Vite HTTP readiness | HTTP 200 at 127.0.0.1:5173 |
| Playwright | Current suite collects 17 cases. Previous 16-case run blocked before page execution by Chrome launch abort; focused cached-headless retry also blocked by macOS bootstrap permission denial |
| Fresh desktop/mobile screenshot and interaction review | Blocked by browser launch; no current pass claimed |

Historical managed-browser observations from the recovered delivery are retained in V2-QA-REPORT.md. They are not fresh acceptance results for this workspace. Full definition-of-done acceptance requires a successful E2E run and fresh desktop/mobile visual inspection.

Documented simplifications include moving live button, simultaneous showdown tabling and synchronous forced runouts. NPCs are heuristic, not solvers. Saves are unencrypted/browser-local with latest 100 completed records, no multi-tab coordination/export/import/sync. Use one Play tab at a time. Elapsed time includes time away. No sound/multiplayer/variants/refill/rebuy/rewards.

Next: run browser acceptance in an environment that allows Chromium subprocesses, review the five viewport sizes, then add cross-browser/device coverage and richer learning explanations.
