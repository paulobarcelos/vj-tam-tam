# Current State Audit - 2026-06-10

This note records what is true of the repository after a fresh review of `main`, the deployed branch, the docs, and the unfinished migration branch.

## Executive Summary

`main` is a functional vanilla JavaScript static app served from `app/`. It has media import, random playback, text overlays, advanced controls, projection mapping corner calibration, aspect ratio controls, color correction, test card overlay, and local persistence. The current durable deployment path in this branch is GitHub Pages through `npm run publish`, not Vercel.

The repo also contains older BMad planning docs and story files. Most early stories match the app, but several later or deferred stories are stale, aspirational, or superseded by decisions made during implementation. Treat the current app as the canonical product state; do not backtrack to old stories unless there is a deliberate product reason. There is a separate `nextjs-migration` branch with Vercel-oriented tooling and `.ai/` planning artifacts, but that branch is not the current usable product.

## Product Calibration

Follow-up review with Paulo on 2026-06-10 clarified that the implemented app has generally transcended the older story scaffold. The documentation drift below should mostly be read as "old docs need pruning or reframing", not "the current app is wrong".

- The app now has a minimal presentation fullscreen action that calls `document.documentElement.requestFullscreen({ navigationUI: "hide" })`. Earlier work found it hard to keep a custom UI control synchronized across browser-native fullscreen paths, so this action is deliberately one-way and does not restore a fully state-synchronized fullscreen UI.
- The current aggregate persistence model under `vj-tam-tam-state` is acceptable unless the code review finds a stronger maintainability reason to split it.
- Heavy console logging likely came from earlier agent-driven/browser-difficult testing workflows. Prefer improving tests and adding an explicit debug/logging layer before deleting useful observability wholesale.
- Maptastic is acceptable while it works. A later homography-focused replacement may be worthwhile, but that is a larger technical direction rather than an immediate blocker.

## Current Product Shape

- Runtime: static `app/index.html`, `app/assets/css/style.css`, and ES modules under `app/src/`.
- Local server: `npm run dev` serves `app/` at `http://localhost:3000`.
- Main orchestration: `app/src/main.js`.
- UI coordination: `app/src/uiManager.js`; this is the largest and least separated module.
- Playback: `app/src/playbackEngine.js`.
- Text overlays: `app/src/textDisplayManager.js`.
- Persistence: `app/src/stateManager.js`, `app/src/facades/storageFacade.js`, and `app/src/facades/fileSystemAccessFacade.js`.
- Projection tools: `app/src/projectionManager.js` plus `app/lib/maptastic.js`.
- Color and calibration helpers: `app/src/colorCorrectionManager.js` and `app/src/testCardManager.js`.

## Deployment Reality

`main` is configured for GitHub Pages. The app is published by pushing the contents of `app/` to the `gh-pages` branch:

```bash
npm run publish
```

No durable Vercel configuration is present on `main`: there is no `vercel.json` and no `.vercel/` project link. Vercel appears to belong to the unfinished `nextjs-migration` direction rather than the current app.

## Test And Tooling Status

After this audit, the test environment has a complete in-memory `localStorage` setup for Vitest. This fixes failures where individual tests left `globalThis.localStorage` in an incomplete state for later suites.

Current verification:

- `npm test` passes: 28 test files, 630 tests.
- `npm run lint` passes.
- `npm audit --omit=dev` reports 0 vulnerabilities.

An independent maintainability review is captured in [Code Quality Review - 2026-06-10](./code-quality-review-2026-06-10.md). Its main conclusion is that the app works, but the next serious work should be boundary repair: `uiManager.js`, `stateManager.js`, `projectionManager.js`, `style.css`, and story-era tests are carrying too much responsibility.

## Documentation Drift

- README and PRD still describe a broader dedicated Fullscreen API button/control. Story `docs/stories/3.6.story.md` says that feature was deliberately removed from MVP. Current decision: keep only the minimal presentation fullscreen action using `requestFullscreen({ navigationUI: "hide" })`; do not restore a fully synchronized fullscreen state machine unless a new UI pass revalidates it.
- PRD and story `docs/stories/6.6.story.md` describe scale, translation, rotation, and flip controls in projection setup mode. The current app has corner warping and aspect ratio controls, but not those transform controls. Current decision: treat the app as canonical; do not implement old transform controls unless a new UI pass revalidates them.
- Story `docs/stories/6.5.story.md` is still marked approved/incomplete, while the app already includes custom corner handles and Maptastic layout persistence.
- Story `docs/stories/6.10.story.md` describes per-setting `localStorage` keys such as `vjtamtam.projectionMode.active`; the current implementation stores the app state as one aggregate object under `vj-tam-tam-state`, with file handles handled separately through IndexedDB.
- Story `docs/stories/3.3.story.md` is marked deferred for text pool work, but later Epic 4 work implemented text input, text pool display, text frequency, and overlay rendering.
- `.ai/TODO-revert.md` references older UI test instability. The current test suite passes after the shared `localStorage` setup fix, though `uiManager.js` still has limited broad unit coverage compared with its size.

## Implementation Notes

- The current architecture is understandable, but `uiManager.js` and `style.css` are both large enough that UI polish work will be easier after extracting smaller UI modules or at least separating panel responsibilities.
- The app logs heavily to the console during normal use. This is useful while stabilizing and was likely part of earlier agent/browser verification, but it is noisy for a party/live-performance tool. A reasonable next step is an explicit debug logger or debug mode, not blind deletion.
- `app/lib/maptastic.js` is an old global-style browser library. It works in the current static setup, but it should be treated carefully if the app is migrated into another build system. A future replacement could isolate the homography math directly, but that should be handled as a focused projection-mapping project.
- The initial screen now offsets the welcome text on desktop so it centers in the visible stage area beside the drawer rather than sitting underneath the drawer edge.
- `StateManager.restoreFromPersistence()` falls back to defaults on corrupt stored state, but it does not currently clear the corrupt aggregate key.

## Migration Recommendation

Keep `main` as the reference implementation until the product shape is intentionally moved. For the eventual move into the Bum Bum Tam Tam / Gostosa project, the safest path is:

1. Preserve this repo and branch history as the source of truth during migration.
2. Copy or subtree the `app/` runtime first, because it is the working product.
3. Bring over only the docs that still describe current behavior, plus this audit.
4. Treat the `nextjs-migration` branch as research unless the migration goal explicitly becomes "rewrite as Next.js".
5. Fix the obvious UI polish issues before doing a large framework migration, especially drawer/stage layout, projection controls, and the dense advanced panel.
