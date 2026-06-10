# Redesign-Ready Foundation - 2026-06-10

This note records the foundation work done after the current-state audit and code-quality review. The intent is to make VJ Tam Tam easier to redesign without losing confidence in the existing app behavior.

## Product Decisions Preserved

- The current running app remains canonical. Older story files are useful history, but differences from the stories should not automatically be treated as defects.
- Fullscreen should stay minimal. The app now exposes a one-way presentation fullscreen action that calls `document.documentElement.requestFullscreen({ navigationUI: "hide" })`, which was validated as the deeper Chrome fullscreen path that hides vertical tabs. It deliberately does not attempt to mirror every browser-native fullscreen state transition.
- GitHub Pages remains the durable deployment path for the vanilla static app. The old Vercel/Next.js direction is still research unless migration is deliberately re-opened.

## Foundation Changes

- Test spine: added a canonical DOM fixture in `tests/helpers/appFixture.js` and an app smoke test that initializes the real drawer/stage controls, adds text, opens projection mode, toggles the test card, and verifies presentation fullscreen options.
- Test discipline: Vitest now installs a full in-memory `localStorage` and suppresses expected console chatter globally. Playback tests also reset timers and singleton state so async media cycling cannot leak logs after test cleanup.
- CSS boundary: `app/assets/css/style.css` now imports feature CSS files under `app/assets/css/features/`, preserving deployed static CSS behavior while making future UI work less risky.
- UI boundaries: extracted `IdleController`, `TextPoolView`, `deriveMediaAccessState()`, `createDefaultState()`, and `requestPresentationFullscreen()` from larger modules. `UIManager` keeps compatibility wrapper methods while no longer owning all of those implementation details directly.
- Playback robustness: image transition scheduling now falls back to an explicit default duration if segment settings are unavailable, avoiding accidental `NaN` timers.

## Current Verification

- `npm test` passes: 28 test files, 630 tests.
- `npm run lint` passes.

## Architecture Path

The next redesign pass should build on these boundaries instead of starting inside the old monoliths. Good next slices are: extract a `MediaPoolView` for media cards, restore buttons, notices, and clear-all behavior; separate advanced segment controls from `UIManager`; introduce a small logger/debug-mode facade before pruning normal-use console output; wrap Maptastic behind a projection adapter so homography replacement can be evaluated without rewriting projection UI; and keep extending the canonical smoke test when changing user-facing workflows.

The UI redesign itself should start after these boundaries are stable enough that styling and layout changes can be verified through the smoke test plus targeted view tests. Image-generation mockups can be useful for direction, but the implementation should still be grounded in the real tool surface: stage, drawer, media pool, text pool, projection controls, and performance/presentation mode.
