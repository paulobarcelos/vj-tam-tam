# VJ Tam Tam - UI/UX Specification

## 1. Design Principles

### Visual Aesthetic
- **Style**: Brutalist minimalism - clean, functional, purposeful
- **Typography**: Arial Bold, consistent sizing across interface
- **Colors**: Extremely limited palette - primarily black, white, with minimal accent colors
- **Philosophy**: "Quiet" interface that stays out of the way of the visual performance

### Interaction Philosophy
- **Idle-First**: UI only appears on user interaction (mouse/keyboard activity)
- **Immediate Feedback**: Actions happen instantly without confirmation dialogs
- **Progressive Disclosure**: Advanced features hidden by default, revealed through clear hierarchies
- **Minimalist Notifications**: Non-intrusive toast messages for essential feedback only
- **Comprehensive Persistence**: All relevant UI states, interaction parameters (including advanced controls, projection settings, corner calibration data, drawer states, active tabs), and user configurations are saved to `localStorage` to ensure a consistent experience across sessions.

## 2. Visual Design System

### Typography
- **Primary Font**: Arial Bold
- **Hierarchy**: Single font size for consistency, differentiation through layout and spacing
- **Color**: White text on dark backgrounds, black text on light elements

### Color Palette
- **Background**: Pure black (`#000000`)
- **UI Overlay**: Black semi-transparent
- **Text**: Pure white (`#FFFFFF`) on dark, pure black (`#000000`) on light
- **Accent**: To be determined (minimal usage)

### Logo
- **Placement**: Top of left drawer panel
- **Visibility**: Only when UI is active (not idle)
- **Style**: Can be more expressive than the rest of the interface
- **Purpose**: Brand identity while maintaining overall minimalism

## 3. Layout Structure

### Stage (Main Display Area)
- **Size**: Full browser window (`100vw × 100vh`)
- **Content**: Media playback or welcome message
- **Interaction**: Always a drag-and-drop target for media files. Visual indication (e.g., border glow, overlay) when files are dragged over the window.
- **Background**: Black when no media is playing

### Left Drawer Panel
- **Nature**: Always an overlay on top of the stage.
- **Position**: Anchored to the left side of the stage.
- **Background**: Translucent (e.g., semi-transparent black), allowing the stage content behind it to be partially visible.
- **Visibility**: Hidden by default (Idle State), appears on user interaction (Active State).
- **Animation**: Quick fade-in or instant appearance (no elaborate animations).
- **Sizing**: See Section 7: Responsive Behavior.

## 4. Interaction States

### Idle State
- **UI Visibility**: All UI elements (Left Drawer Panel, Maptastic handles, test card) are hidden.
- **Stage**: Shows media playback or welcome message only.
- **Trigger to Exit**: Any mouse movement or keyboard input (excluding `ESC` key if browser is in fullscreen, as `ESC` will exit fullscreen).
- **Persistence**: The fact that the UI is idle is not persisted; on reload, UI typically starts active if controls were previously visible or becomes active on first interaction.

### Active State
- **UI Visibility**: Left drawer panel (and other contextually relevant controls like Maptastic handles if in Projection Setup Mode) visible.
- **Duration**: Remains visible during continued interaction.
- **Return to Idle**: After a defined period of inactivity.

### Advanced Controls (UI Toggle)
- **Nature**: UI visibility toggle for a section within the Left Drawer Panel.
- **Behavior**: Shows/hides additional controls within the drawer.
- **Persistence**: Visibility state of the Advanced Controls section is saved in `localStorage`.

### Projection Mode (Functional Mode)
- **Nature**: Changes stage behavior and rendering for projection setup.
- **Activation**: Toggle button within Advanced Controls.
- **Effects**: Stage adopts fixed aspect ratio (user-defined), Maptastic transformation controls become available.
- **Persistence**: Active state of Projection Mode and all its settings (aspect ratio, warp points, transforms) are saved in `localStorage`.

### Corner Calibration Mode (Nested Interaction Mode)
- **Nature**: Special interaction state within Projection Mode for adjusting Maptastic corner handles.
- **Activation**: "Calibrate Corners" button within Projection Mode controls.
- **UI Changes**: Drawer panel may temporarily hide or become less prominent to maximize stage visibility for calibration. Corner handles become active and draggable. An "End Calibration" button appears.
- **Exit**: "End Calibration" button returns to Projection Mode view within the Advanced Controls.
- **Persistence**: Corner calibration points (Maptastic settings) are saved to `localStorage` as part of Projection Mode settings.

## 5. Component Specifications

### 5.1 Welcome State
**When**: Media pool is empty.
**Content**: "Welcome to VJ Tam Tam, please drag and drop your photos and videos here, or click to browse, to start your performance."
**Styling**:
- White text on black background
- Centered on stage
- Arial Bold font
- Clear, prominent display
**Interaction**: The area (or a specific part of it) is clickable to open a system file picker.

### 5.2 Left Drawer Panel Structure

#### Header
- **VJ Tam Tam Logo** (top position)
- **Fullscreen Toggle Button**: Icon-based button (e.g., fullscreen_enter / fullscreen_exit icons) with a dynamic tooltip ("Enter Fullscreen" / "Exit Fullscreen"). Toggles the application's browser fullscreen mode. The button's visual state (icon and tooltip) must synchronize with the browser's actual fullscreen status (e.g., if the user exits fullscreen using the browser's `ESC` key, the button should update to "Enter Fullscreen").

#### Media Pool Section
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

#### Text Pool Section
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

#### Advanced Controls Section
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

#### Footer
- **About/Credits** text.
- Small, unobtrusive.
- References to "Bum Bum Tam Tam" origin.

### 5.3 Corner Calibration Interface
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

### 5.4 Toast Notifications
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

## 6. User Flows

### 6.1 First-Time User Flow
1.  **Initial Load**: Black screen with welcome message (see 5.1).
2.  **Add Media**: User drags media files to the stage OR clicks the designated area/button within the welcome message/empty media pool to browse and select files.
3.  **Immediate Playback**: Media begins playing automatically.
4.  **UI Discovery**: User moves mouse, Left Drawer Panel appears.
5.  **Content Management**: User adds more media, explores text overlays.

### 6.2 Media Management Flow
1.  **Add Media**: Drag-drop to stage or media pool area in drawer, or click browse button in media pool area.
2.  **Visual Feedback**: Immediate square thumbnail generation and grid update in drawer.
3.  **Management**: Hover to delete individual items, or use "Clear all" for media pool.
4.  **Playback Integration**: New media immediately available for random selection.

### 6.3 Text Overlay Flow
1.  **Add Text**: Type in input field in drawer, press Enter or click Add button.
2.  **Visual Confirmation**: Text appears as pill in text pool in drawer.
3.  **Configure Frequency**: Adjust slider for display frequency.
4.  **Live Integration**: Text overlays begin appearing over media on stage.

### 6.4 Advanced Features Flow
1.  **Reveal Controls**: Toggle Advanced Controls visibility in drawer.
2.  **Basic Adjustments**: Adjust media segment duration, colors, video skip settings, toggle test card.
3.  **Projection Setup**: Enable Projection Mode.
4.  **Aspect Configuration**: Set projection area (using presets, custom inputs, or "Match Current Screen" button) and basic transforms (scale, translate, rotate, flip).
5.  **Corner Calibration**: Enter calibration mode, adjust Maptastic corner handles, exit calibration.
6.  **Fine-tuning**: Return to projection controls for additional adjustments if needed.

## 7. Responsive Behavior

The Left Drawer Panel is always an **overlay** on top of the stage with a **translucent background**.

-   **Large Screens (e.g., Desktop):**
    * The drawer has a defined width (e.g., 400px - *final value to be determined*).
    * It appears over the left side of the stage. The stage content behind it is partially visible through the translucency.
-   **Smaller Screens (e.g., Tablet Portrait, Mobile):**
    * The drawer expands to the full viewport width.
    * It remains a translucent overlay covering the stage.
-   All controls within the drawer reflow and adapt to the available width, ensuring usability. Scrollbars appear for sections if content overflows.

## 8. Accessibility Considerations

### Keyboard Navigation
-   `ESC` key: If the browser is in fullscreen mode, pressing `ESC` will exit fullscreen mode (browser behavior). It does **not** directly trigger the application's Idle State.
-   Tab navigation: All interactive UI elements within the drawer (buttons, sliders, inputs, text pills with delete icons) must be focusable and operable via keyboard when the drawer is visible.
-   Enter/Space keys: Activate focused buttons, toggle checkboxes/radio buttons.
-   Arrow keys: Navigate within control groups like radio buttons or adjust sliders where appropriate.

### Visual Accessibility
-   High contrast maintained throughout (black/white/limited accents).
-   Clear visual hierarchy despite minimal styling.
-   Sufficient touch targets on smaller screens.

### Interaction Feedback
-   Immediate visual feedback for all user actions.
-   Clear state indication for toggles and modes.
-   Consistent interaction patterns across components.

## 9. Technical Implementation Notes

### State Management
-   All UI visibility states (drawer, advanced panel), mode states (Projection Mode, Calibration active), control values (sliders, inputs, text pool, media pool references if possible via API), and Maptastic settings are saved to `localStorage` for persistence.

### Performance Considerations
-   Smooth thumbnail generation for media grid.
-   Efficient scroll handling for large media/text collections.
-   Minimal DOM manipulation during idle/active transitions.

### Integration Points
-   Maptastic library integration for corner calibration.
-   FileSystemAccessAPI for file persistence (if used for media pool).
-   CSS transforms and filters for projection adjustments and color correction.
-   Browser Fullscreen API for the fullscreen toggle button.

---

This specification provides the UI/UX framework for VJ Tam Tam, aiming for a brutalist minimalist aesthetic while providing all necessary functionality for both casual and advanced users.