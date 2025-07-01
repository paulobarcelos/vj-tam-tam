# Accessibility Considerations

## Keyboard Navigation

- `ESC` key: If the browser is in fullscreen mode, pressing `ESC` will exit fullscreen mode (browser behavior). It does **not** directly trigger the application's Idle State.
- Tab navigation: All interactive UI elements within the drawer (buttons, sliders, inputs, text pills with delete icons) must be focusable and operable via keyboard when the drawer is visible.
- Enter/Space keys: Activate focused buttons, toggle checkboxes/radio buttons.
- Arrow keys: Navigate within control groups like radio buttons or adjust sliders where appropriate.

## Visual Accessibility

- High contrast maintained throughout (black/white/limited accents).
- Clear visual hierarchy despite minimal styling.
- Sufficient touch targets on smaller screens.

## Interaction Feedback

- Immediate visual feedback for all user actions.
- Clear state indication for toggles and modes.
- Consistent interaction patterns across components.
