# Technical Implementation Notes

## State Management

- All UI visibility states (drawer, advanced panel), mode states (Projection Mode, Calibration active), control values (sliders, inputs, text pool, media pool references if possible via API), and Maptastic settings are saved to `localStorage` for persistence.

## Performance Considerations

- Smooth thumbnail generation for media grid.
- Efficient scroll handling for large media/text collections.
- Minimal DOM manipulation during idle/active transitions.

## Integration Points

- Maptastic library integration for corner calibration.
- FileSystemAccessAPI for file persistence (if used for media pool).
- CSS transforms and filters for projection adjustments and color correction.
- Browser Fullscreen API for the fullscreen toggle button.

---

This specification provides the UI/UX framework for VJ Tam Tam, aiming for a brutalist minimalist aesthetic while providing all necessary functionality for both casual and advanced users.
