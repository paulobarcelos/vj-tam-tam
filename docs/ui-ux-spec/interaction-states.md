# Interaction States

## Idle State

- **UI Visibility**: All UI elements (Left Drawer Panel, Maptastic handles, test card) are hidden.
- **Stage**: Shows media playback or welcome message only.
- **Trigger to Exit**: Any mouse movement or keyboard input (excluding `ESC` key if browser is in fullscreen, as `ESC` will exit fullscreen).
- **Persistence**: The fact that the UI is idle is not persisted; on reload, UI typically starts active if controls were previously visible or becomes active on first interaction.

## Active State

- **UI Visibility**: Left drawer panel (and other contextually relevant controls like Maptastic handles if in Projection Setup Mode) visible.
- **Duration**: Remains visible during continued interaction.
- **Return to Idle**: After a defined period of inactivity.

## Advanced Controls (UI Toggle)

- **Nature**: UI visibility toggle for a section within the Left Drawer Panel.
- **Behavior**: Shows/hides additional controls within the drawer.
- **Persistence**: Visibility state of the Advanced Controls section is saved in `localStorage`.

## Projection Mode (Functional Mode)

- **Nature**: Changes stage behavior and rendering for projection setup.
- **Activation**: Toggle button within Advanced Controls.
- **Effects**: Stage adopts fixed aspect ratio (user-defined), Maptastic transformation controls become available.
- **Persistence**: Active state of Projection Mode and all its settings (aspect ratio, warp points, transforms) are saved in `localStorage`.

## Corner Calibration Mode (Nested Interaction Mode)

- **Nature**: Special interaction state within Projection Mode for adjusting Maptastic corner handles.
- **Activation**: "Calibrate Corners" button within Projection Mode controls.
- **UI Changes**: Drawer panel may temporarily hide or become less prominent to maximize stage visibility for calibration. Corner handles become active and draggable. An "End Calibration" button appears.
- **Exit**: "End Calibration" button returns to Projection Mode view within the Advanced Controls.
- **Persistence**: Corner calibration points (Maptastic settings) are saved to `localStorage` as part of Projection Mode settings.
