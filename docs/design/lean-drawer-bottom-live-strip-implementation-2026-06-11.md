# Lean Drawer + Bottom Live Strip Implementation - 2026-06-11

This note records the implementation of controlled experiment **B** from [UI Controlled Experiments - 2026-06-11](./ui-controlled-experiments-2026-06-11.md).

## Implemented

- Moved the live-use segment duration controls out of Advanced Settings and into a bottom strip.
- Moved text frequency into the bottom strip so text behavior is visible while performing.
- Moved the presentation fullscreen action into the bottom strip and kept it as a one-way request for `requestFullscreen({ navigationUI: "hide" })`.
- Added a real readiness cell based on current state: usable media count, total media count, text pool size, and permission-restoration status.
- Kept the stage welcome message centered in the viewport; the drawer and strip overlay it only while the UI is awake.
- Made the strip obey the same idle behavior as the drawer.
- Kept every live control available on narrower screens by making the strip horizontally scrollable instead of hiding cells.
- Raised active toast notifications above the strip so import/text feedback remains visible.

## Intentionally Not Implemented

- No BPM, CPU, transport, progress clock, current deck, or fake playback telemetry was added.
- No invented calibration metaphor was added to the normal performance UI.
- Projection setup remains in Advanced Settings for now; the dedicated calibration direction is still a later, separate pass.

## Verification Contract

The smoke test now asserts that the bottom strip boots with the app, contains the relocated live controls, updates from real media/text/segment/frequency state, and still requests deep presentation fullscreen. The styling test asserts the strip's idle behavior and guards against fake telemetry terms in the CSS.
