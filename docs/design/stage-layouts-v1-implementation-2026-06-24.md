# Stage Layouts v1 Implementation - 2026-06-24

This note records the first multi-slot stage implementation and the follow-up dynamic grid controls.

## Implemented

- Added a persisted stage layout setting with `columns: 1` and `rows: 1` as the default single-slot layout.
- Added a compact Single reset plus row/column stepper controls to the bottom live strip.
- Updated playback rendering so the stage can render a synchronized set of media slots instead of only one full-stage media element.
- Added dynamic grid rendering: each row/column combination creates equal stage slots, each showing its own randomly selected image or video from the same media pool.
- Kept `sample` mode transitions synchronized: the first slot drives the segment transition, and all slots change together.
- Added `loop` playback mode for long scene segments: videos start at skip start, loop inside the skip-bounded range, and the shared segment clock advances the whole layout.
- Added a persisted video mute toggle that defaults on.
- Kept legacy single-slot behavior as the default path.
- Kept legacy saved `single` and `two-columns` modes migrating into the new row/column shape.

## Deferred

- Independent per-slot clocks.
- Per-slot locking, pinning, or manual media assignment.
- Layout-specific projection calibration.

## Verification Contract

The unit tests cover persisted layout state, legacy mode migration, distinct media selection for multiple slots, grid slot rendering, and synchronized image transition leadership. The smoke test verifies the bottom live strip controls update real stage layout state.
