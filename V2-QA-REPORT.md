# V2 QA report

Resumed local audit of the existing V1 repository and recovered V2 delivery. No deployment performed.

## Fresh automated evidence

The actual V1 source passed TypeScript, lint, 89 routine tests, and production build before V2 was applied. The recovered source first passed its original 151 tests. Final verification after the review fixes has **152 routine passes**, a separate successful exhaustive **2,598,960-hand** census, strict TypeScript (including E2E/QA fixtures), lint, and a successful production build. The V1 evaluator remains byte-identical, and all 89 original tests remain present and pass.

The deterministic stress run completed **5,000 hands / 26,313 transitions across 710 sessions**, including **1,535 eliminations and 360 sole-survivor outcomes**. Assertions ran after every transition. No card, chip, actor, contribution-log, historical-payout, lifecycle, or deadlock assertion failed.

NPC verification covers all profile/difficulty combinations, legality, repeatability, explicit allowlist/freeze boundaries, and independence from inaccessible cards. Component tests cover StrictMode restoration, timer cancellation, and double submission. Storage tests preserve the old Learn key and reject malformed/corrupt saves.

## Fresh browser blocker

Vite started successfully on localhost and returned HTTP 200. The old localhost EPERM failure did not recur.

The 16-case standalone Playwright attempt used installed Google Chrome. Every case was blocked before any page assertions: Chrome aborted with SIGABRT; launch logs included `sandbox_extension_issue_file_to_process failed`. A focused retry with the installed Playwright headless shell failed before page execution at:

```text
FATAL:base/apple/mach_port_rendezvous_mac.cc:159
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer:
Permission denied (1100)
```

No browser permissions were bypassed. No current browser interaction, screenshot or E2E pass is claimed. Following review, the current suite collects **17 cases**, including a separate deterministic river settlement/next-hand/refresh case. It still requires execution in an environment that permits browser subprocesses. Fresh visual inspection at 320/390/768/1280/1600px remains pending.

## Final source-review fixes

- Standalone pot settlement now rejects duplicate physical cards across players/board, invalid dealer positions, and missing live hole cards; regression added.
- The ordinary-dealing E2E smoke test permits a legitimate blind win before the human acts. Settlement/Next hand uses a separate engine-generated river fixture, avoiding the assumption that a human survives an arbitrary random first hand.
- Strict TypeScript now includes the E2E and development QA fixture directories.

## Historical browser observations from the recovered delivery

These observations are retained as historical reports, not fresh verification of this workspace:

- Ordinary four-player Play through board/runout, showdown, award and next hand; refresh restored the exact active hand.
- Deterministic final all-in victory and early human elimination, with no NPC-only continuation.
- Mobile actions with five NPC seats; V1 hand completion and recognition grading.
- Actual iframe widths 320/390/768/1280/1600 reportedly had no horizontal overflow. Screenshots were reviewed at 320/390/768/1280; the 1600 full-page capture timed out.
- That delivery's standalone 16-case run was blocked by missing browsers and invalid official download archives. It was not a passing E2E run.

## Acceptance and limits

The implementation and automated domain verification are delivered; full definition-of-done acceptance remains open for browser execution and fresh visual QA. This review was performed by the implementing agent, not an external reviewer certification. No Firefox/WebKit, physical mobile device, formal screen-reader audit, or multi-tab race testing was completed. The moving-button policy and digital simplifications are explicit in GAME-RULES.md. Saves are readable by their owner. NPC policy strength is approximate and uncalibrated.
