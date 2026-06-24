# Stage Layouts v1 Implementation - 2026-06-24

This note records the first multi-slot stage implementation.

## Implemented

- Added a persisted stage layout setting with `single` as the default mode and `two-columns` as the first multi-slot mode.
- Added a compact Single / 2 Col segmented control to the bottom live strip.
- Updated playback rendering so the stage can render a synchronized set of media slots instead of only one full-stage media element.
- Added the first two-column layout: two equal full-height stage slots, each showing its own randomly selected image or video from the same media pool.
- Kept v1 transitions synchronized: the first slot drives the segment transition, and all slots change together.
- Kept legacy single-slot behavior as the default path.

## Deferred

- Independent per-slot clocks.
- Two-row and four-grid layout modes.
- Per-slot locking, pinning, or manual media assignment.
- Layout-specific projection calibration.

## Verification Contract

The unit tests cover persisted layout state, distinct media selection for multiple slots, two-column slot rendering, and synchronized image transition leadership. The smoke test verifies the bottom live strip control updates real stage layout state.
