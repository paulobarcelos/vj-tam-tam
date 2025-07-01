# Component Specifications

## Welcome State

**When**: Media pool is empty.
**Content**: "Welcome to VJ Tam Tam, please drag and drop your photos and videos here, or click to browse, to start your performance."
**Styling**:

- White text on black background
- Centered on stage
- Arial Bold font
- Clear, prominent display
  **Interaction**: The area (or a specific part of it) is clickable to open a system file picker.

## Left Drawer Panel Structure

### Header

- **VJ Tam Tam Logo** (top position)
- **Fullscreen Toggle Button**: Icon-based button (e.g., fullscreen_enter / fullscreen_exit icons) with a dynamic tooltip ("Enter Fullscreen" / "Exit Fullscreen"). Toggles the application's browser fullscreen mode. The button's visual state (icon and tooltip) must synchronize with the browser's actual fullscreen status (e.g., if the user exits fullscreen using the browser's `ESC` key, the button should update to "Enter Fullscreen").

### Media Pool Section

**Empty State**:

- Message: "Drop photos & videos here or click to browse." (This message is within the drawer; the main stage shows the 5.1 Welcome State message).
- Visual indication of drag-and-drop capability for this specific area.
- Area is clickable to open file picker.

**Populated State**:

- Grid layout (column-based, responsive).
- Square thumbnails (using CSS `object-fit: cover` or similar to fill square, cropping image as needed) with play icons for videos.
- Scrollable when content exceeds available space.
- File picker button (top-right of this section).
- "Clear all" button (bottom-right of this section, small text link).

**Drag States**:

- Stage: Provides a general visual indication (e.g., border change or overlay) when files are dragged anywhere over the application window.
- Media Pool Area (within Drawer): Provides an enhanced highlight when files are hovered directly over this specific drop zone.

**Individual Media Items**:

- Square thumbnail.
- Video indicator (play icon overlay).
- Hover state reveals "×" delete button.
- Grid reflows when items removed.

### Text Pool Section

**Input Area**:

- Text input field with placeholder: "Add a message..."
- Add button adjacent to input.
- Enter key triggers add action.

**Text Display**:

- Pills/tags layout.
- Multi-line wrapping.
- Scrollable.
- Hover state reveals "×" delete button on each pill.
- "Clear all" button (bottom-right, small text link).

**Frequency Control**:

- Slider with 8 discrete steps.
- Labels: Minimum step labeled "Never", Maximum step labeled "Always". Intermediate steps are visually distinct but unlabeled.
- Position: Below text pool display.

### Advanced Controls Section

**Toggle Control**:

- Button/link to show/hide advanced controls. Clear visual indication of current state (e.g., "Advanced Settings [Show/Hide]").

**Basic Advanced Controls** (when revealed):

- **Media Segment Duration Controls:**
  - Minimum Segment Duration: Slider/input control, range 1 second to 30 seconds. Default initial value: 5 seconds.
  - Maximum Segment Duration: Slider/input control, range 1 second to 30 seconds. Default initial value: 5 seconds.
  - (The application will enforce that min duration cannot exceed max duration, and vice-versa, as per PRD AC E2.S3.5).
- Test card overlay toggle button.
- Color correction sliders (brightness, contrast, saturation).
- Video segment controls (skip start/end sliders).
- Projection Mode toggle button.

**Projection Mode Controls** (when Projection Mode active):

- **Define Projection Area controls:**
  - Aspect ratio presets (16:9, 4:3, 1:1).
  - Custom aspect ratio inputs (width and height units). When these controls are first activated, or if no custom aspect ratio is loaded from `localStorage`, they default to reflect the current **screen's** aspect ratio.
  - "Match Current Screen" Button: When clicked, updates the custom aspect ratio input fields to the current **screen's** aspect ratio.
- **Global transform controls:**
  - Scale slider/input.
  - Translation controls (X, Y).
  - Rotation control.
  - Flip controls (horizontal, vertical).
- "Calibrate Corners" button (activates Corner Calibration Mode).

### Footer

- **About/Credits** text.
- Small, unobtrusive.
- References to "Bum Bum Tam Tam" origin.

## Corner Calibration Interface

**When Active**: Corner Calibration Mode enabled.
**Stage Elements**:

- Four corner handles (via Maptastic integration) are visible and draggable.
- Visual indication of handle positions.

**UI Elements**:

- Left Drawer Panel may hide or become less prominent to maximize stage visibility.
- "End Calibration" button clearly visible (e.g., top-right corner of screen or within a minimal control bar).
- Handles respect idle state (hidden when idle, visible when active and UI is active).

**Exit Behavior**:

- Returns to Projection Mode with Advanced Controls visible in the drawer.
- Corner handles deactivate (but their positions are saved).
- Drawer reappears with previous state if it was hidden.

## Toast Notifications

**Position**: Bottom-center of the screen.
**Variants**:

- Info (general information)
- Warning (non-critical issues)
- Error (error conditions)

**Styling**:

- Consistent with overall minimalist design.
- Brief display duration.
- Non-intrusive positioning.

**Use Cases**:

- Unsupported file format notifications.
- Projection setup warnings (e.g., video offsets ignored).
- Other non-critical system feedback.
