# Responsive Behavior

The Left Drawer Panel is always an **overlay** on top of the stage with a **translucent background**.

- **Large Screens (e.g., Desktop):**
  - The drawer has a defined width (e.g., 400px - _final value to be determined_).
  - It appears over the left side of the stage. The stage content behind it is partially visible through the translucency.
- **Smaller Screens (e.g., Tablet Portrait, Mobile):**
  - The drawer expands to the full viewport width.
  - It remains a translucent overlay covering the stage.
- All controls within the drawer reflow and adapt to the available width, ensuring usability. Scrollbars appear for sections if content overflows.
