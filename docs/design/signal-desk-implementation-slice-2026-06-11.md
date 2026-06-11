# Signal Desk Implementation Slice - 2026-06-11

This note records the first implemented UI redesign slice after the generated direction pass in [UI Redesign Directions - 2026-06-11](./ui-redesign-directions-2026-06-11.md).

## Scope

Implemented the **Signal Desk** base direction for the existing single-page app without changing playback, import, text, projection, or persistence behavior.

Changed surfaces:

- App-wide visual tokens in `app/assets/css/features/base.css`.
- Drawer shell, header, media controls, idle transition, and section headers.
- Media pool cards, empty states, notices, and permission styling.
- Text pool input, chips, empty state, and frequency slider.
- Advanced timing, color, and projection controls.
- Projection setup button, aspect controls, calibration panel, and corner handles.
- Toast styling so runtime feedback no longer uses the old brutalist visual language.

## Decisions

- The stage remains visually and behaviorally primary. The welcome message stays centered relative to the full viewport, not offset to dodge the drawer.
- The page now starts with `<body class="ui-idle">` so the drawer is hidden on first paint, before JavaScript finishes initializing. `IdleController` still owns activity detection after boot.
- Normal performance controls use graphite glass, subtle separators, 6px radii, cyan interaction states, green ready states, amber warnings, and red destructive actions.
- Projection setup intentionally shifts warmer with restrained orange edit-state styling and stronger corner handles, borrowing from the Blackbox Calibration direction only while calibration mode is active.
- The old story-era brutalist CSS tests were updated to assert the current Signal Desk contract instead of preserving stale comments and hardcoded `border-radius: 0` expectations.
- The presentation fullscreen action remains the minimal one-way `requestFullscreen({ navigationUI: "hide" })` path. This slice does not reintroduce a state-synchronized fullscreen UI.

## Verification

- `npm run lint`
- `npm test`
- Browser screenshots at `1440x900` and `390x844` confirmed:
  - drawer hidden on first load,
  - welcome centered on desktop and mobile,
  - drawer appears on pointer activity,
  - mobile drawer fills the viewport width,
  - projection setup controls and handles render in the redesigned style.

## Follow-Up

- Revisit the drawer information architecture after the first hands-on test session. Media/Text/Timing/Projection can stay in one scrollable drawer for now, but tabs or section shortcuts may become useful once real media/text pools are loaded.
- Make projection setup more complete as a distinct mode: guide visibility controls, reset/save affordances, and a clearer relationship between aspect ratio, test card, and corner handles.
- Continue untangling `uiManager.js` and the CSS feature files only where the next UI slice needs it. This slice proves the existing structure can support a meaningful visual pass without a framework migration.
