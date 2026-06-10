# Code Quality Review - 2026-06-10

This review was run as an independent sub-agent pass using the thermo-nuclear code quality review rubric. It inspected `main` fresh, made no file edits, and focused on maintainability rather than feature correctness.

Verification during review:

- `npm test` passes: 23 files, 613 tests.
- `npm run lint` passes.

## Findings

### P1: `uiManager.js` is a 1,986-line application god object

Evidence: DOM ownership starts in `app/src/uiManager.js` near the constructor and initialization paths. The same file owns permission restoration and global capture listeners, media access-state classification/rendering, segment settings, text-pool rendering, projection startup, and idle behavior.

Why this matters: every feature change becomes a `UIManager` change, and real product policy is hidden inside DOM code.

Refactor path: keep `uiManager` as a composition root only. Extract `mediaPoolView`, `fileAccessController`, `segmentControlsController`, `textPoolView`, and `idleController`. The first useful extraction is a pure `deriveMediaAccessState(item)` helper so permission/temporary/metadata state stops being re-inferred inside rendering.

### P1: State, persistence, and file-handle side effects are collapsed into one mutable singleton

Evidence: `app/src/stateManager.js` stores media, text, projection, color, test-card, UI, and FileSystem API flags in one blob. Restoration is a long sequential branch chain. Whole-state persistence is centralized, while media updates also fire async handle storage. `app/src/facades/fileSystemFacade.js` dynamically imports state to update global flags.

Why this matters: the boundary is backwards. Facades should not update global state, and state should not directly own IndexedDB handle persistence.

Refactor path: introduce `createDefaultState()`, slice-level pure update functions, and a `persistenceRepository` or `mediaAccessService`. Let a coordinator handle effects and then commit state patches atomically.

### P1: Projection mapping lacks a clean geometry and library boundary

Evidence: `app/src/projectionManager.js` directly requires DOM controls during initialization, while enter/exit mode orchestrates state, DOM, Maptastic, controls, and events. Geometry, handle dragging, saved layout, and library layout conversion are interleaved. Maptastic is loaded as a global script from `app/index.html` and lives as an old browser blob in `app/lib/maptastic.js`.

Why this matters: projection mapping is the core advanced feature, but its geometry, UI, persistence, and third-party adapter concerns are hard to reason about or replace.

Refactor path: extract pure `projectionGeometry.js` with normalized corners and stage-rect conversion, plus `maptasticAdapter.js` as the only code touching the global Maptastic library. Keep `projectionManager` as orchestration.

### P2: `style.css` is a 1,816-line feature chronology file

Evidence: `app/assets/css/style.css` mixes base controls, media pool, toasts, projection, color correction, test card, advanced controls, and text pool styles. There are legacy comments and `!important` overrides in later sections.

Why this matters: the cascade encourages patches instead of component ownership, which will make the upcoming UI redesign more fragile.

Refactor path: split into `base.css`, `layout.css`, `media-pool.css`, `controls.css`, `projection.css`, `text-overlay.css`, `text-pool.css`, and `notifications.css`, with `style.css` as an import index.

### P2: Tests preserve story-era coupling and allow broken subpaths to pass

Evidence: `vitest.config.js` includes every test anywhere, so `tests/stories/*` is active. Story tests build partial DOM fixtures and manually drive projection mode. The suite passes while logging projection errors from those paths. Projection tests mock the global Maptastic boundary.

Why this matters: the suite validates old story labels and internals more than stable product contracts. It can pass while still showing noisy runtime errors.

Refactor path: create one canonical DOM fixture from `app/index.html`, fail tests on unexpected `console.error`, move story tests to legacy characterization or prune them, and add a small browser smoke test for projection with the real library.

### P3: Generic utilities look like dead abstraction padding

Evidence: `arrayUtils`, `objectUtils`, and `validationUtils` are only imported by their own tests. Runtime imports use `mediaUtils` and one `formatDuration` call from `stringUtils`.

Why this matters: unused generic helpers add API surface without helping the app.

Refactor path: delete unused generic utilities and their tests, keeping only domain-specific helpers.

## Recommended Sequence

1. Add a canonical app DOM fixture and make unexpected console errors fail tests.
2. Extract state defaults, restoration, and persistence into pure helpers plus a persistence service.
3. Split `uiManager.js` by feature ownership, starting with media access state and text-pool rendering.
4. Extract projection geometry and a Maptastic adapter before changing projection behavior.
5. Split CSS by feature and delete unused utility/test padding.
6. Prune or quarantine old docs/stories after the code boundaries are cleaner.
