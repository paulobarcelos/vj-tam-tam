# UI Responsive Behavior & Accessibility

## 7. Responsive Behavior

The Left Drawer Panel is always an **overlay** on top of the stage with a **translucent background**.

- **Large Screens (e.g., Desktop):**
  - The drawer has a defined width (e.g., 400px - _final value to be determined_).
  - It appears over the left side of the stage. The stage content behind it is partially visible through the translucency.
- **Smaller Screens (e.g., Tablet Portrait, Mobile):**
  - The drawer expands to the full viewport width.
  - It remains a translucent overlay covering the stage.
- All controls within the drawer reflow and adapt to the available width, ensuring usability. Scrollbars appear for sections if content overflows.

## 8. Accessibility Considerations

### Keyboard Navigation

- `ESC` key: If the browser is in fullscreen mode, pressing `ESC` will exit fullscreen mode (browser behavior). It does **not** directly trigger the application's Idle State.
- Tab navigation: All interactive UI elements within the drawer (buttons, sliders, inputs, text pills with delete icons) must be focusable and operable via keyboard when the drawer is visible.
- Enter/Space keys: Activate focused buttons, toggle checkboxes/radio buttons.
- Arrow keys: Navigate within control groups like radio buttons or adjust sliders where appropriate.

### Visual Accessibility

- High contrast maintained throughout (black/white/limited accents).
- Clear visual hierarchy despite minimal styling.
- Sufficient touch targets on smaller screens.

### Interaction Feedback

- Immediate visual feedback for all user actions.
- Clear state indication for toggles and modes.
- Consistent interaction patterns across components. 