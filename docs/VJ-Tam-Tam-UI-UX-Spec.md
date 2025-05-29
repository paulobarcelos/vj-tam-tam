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
- **Interaction**: Always a drag-and-drop target for media files
- **Background**: Black when no media is playing

### Left Drawer Panel
- **Position**: Overlay on left side of stage
- **Width**: Fixed responsive (transitions to full-width on small screens)
- **Background**: Black semi-transparent
- **Visibility**: Hidden by default, appears on user interaction
- **Animation**: Quick fade-in or instant appearance (no elaborate animations)

## 4. Interaction States

### Idle State
- **UI Visibility**: All UI elements hidden
- **Stage**: Shows media playback or welcome message only
- **Trigger to Exit**: Any mouse movement or keyboard input

### Active State  
- **UI Visibility**: Left drawer panel visible
- **Duration**: Remains visible during continued interaction
- **Return to Idle**: After period of inactivity

### Advanced Controls (UI Toggle)
- **Nature**: UI visibility toggle, not a functional mode
- **Behavior**: Shows/hides additional controls within the same drawer
- **Persistence**: State saved in localStorage

### Projection Mode (Functional Mode)
- **Nature**: Changes stage behavior and rendering
- **Activation**: Toggle within Advanced Controls
- **Effects**: Fixed aspect ratio, transform applications
- **Persistence**: State saved in localStorage

### Corner Calibration Mode (Nested Interaction Mode)
- **Nature**: Special interaction state within Projection Mode
- **Activation**: "Calibrate Corners" button
- **UI Changes**: Drawer disappears, corner handles active, exit button appears
- **Exit**: "End Calibration" button returns to Projection Mode

## 5. Component Specifications

### 5.1 Welcome State
**When**: Media pool is empty
**Content**: "Welcome to VJ Tam Tam, please drag and drop some photos and videos to get started with your performance"
**Styling**: 
- White text on black background
- Centered on stage
- Arial Bold font
- Clear, prominent display

### 5.2 Left Drawer Panel Structure

#### Header
- **VJ Tam Tam Logo** (top position)

#### Media Pool Section
**Empty State**:
- Message: "Drop photos & videos here or click to browse"
- Visual indication of drag-and-drop capability
- Click to open file picker

**Populated State**:
- Grid layout (column-based, not fixed pixel sizes)
- Square thumbnails with play icons for videos
- Scrollable when content exceeds available space
- File picker button (top-right)
- "Clear all" button (bottom-right, small text link)

**Drag States**:
- Visual feedback when files dragged over window
- Enhanced highlight when hovering over media pool area
- Stage remains drop target, drawer panel is not (except media pool area)

**Individual Media Items**:
- Thumbnail with aspect ratio preserved
- Video indicator (play icon overlay)
- Hover state reveals "×" delete button
- Grid reflows when items removed

#### Text Pool Section
**Input Area**:
- Text input field with placeholder: "Add a message..."
- Add button adjacent to input
- Enter key triggers add action

**Text Display**:
- Pills/tags layout (similar to taxonomy systems)
- Multi-line wrapping when line is full
- Scrollable when content exceeds available space
- Hover state reveals "×" delete button on each pill
- "Clear all" button (bottom-right, small text link)

**Frequency Control**:
- Slider with 8 discrete steps
- Labels: Never → Rare → Occasional → Sometimes → Regular → Often → Frequent → Always
- Position: Below text pool display

#### Advanced Controls Section
**Toggle Control**: 
- Button/link to show/hide advanced controls
- Clear visual indication of current state

**Basic Advanced Controls** (when revealed):
- Test card overlay toggle
- Color correction sliders (brightness, contrast, saturation)
- Video segment controls (skip start/end sliders)
- Projection Mode toggle button

**Projection Mode Controls** (when Projection Mode active):
- Define Projection Area controls:
  - Aspect ratio presets (16:9, 4:3, 1:1)
  - Custom aspect ratio inputs
- Global transform controls:
  - Scale slider/input
  - Translation controls (X, Y)
  - Rotation control
  - Flip controls (horizontal, vertical)
- "Calibrate Corners" button

#### Footer
- **About/Credits** text
- Small, unobtrusive
- References to "Bum Bum Tam Tam" origin

### 5.3 Corner Calibration Interface
**When Active**: Corner Calibration Mode enabled
**Stage Elements**:
- Four corner handles (via Maptastic integration)
- Interactive dragging capability
- Visual indication of handle positions

**UI Elements**:
- All drawer content hidden
- "End Calibration" button (top-right corner of screen)
- Handles respect idle state (hidden when idle, visible when active)

**Exit Behavior**:
- Returns to Projection Mode with Advanced Controls visible
- Corner handles deactivate
- Drawer reappears with previous state

### 5.4 Toast Notifications
**Position**: Bottom-left corner of screen
**Variants**: 
- Info (general information)
- Warning (non-critical issues)
- Error (error conditions)

**Styling**: 
- Consistent with overall minimalist design
- Brief display duration
- Non-intrusive positioning

**Use Cases**:
- Unsupported file format notifications
- Projection setup warnings
- Other non-critical system feedback

## 6. User Flows

### 6.1 First-Time User Flow
1. **Initial Load**: Black screen with welcome message
2. **File Drop**: User drags media files to stage
3. **Immediate Playback**: Media begins playing automatically
4. **UI Discovery**: User moves mouse, discovers left drawer
5. **Content Management**: User adds more media, explores text overlays

### 6.2 Media Management Flow
1. **Add Media**: Drag-drop to stage or media pool, or click to browse
2. **Visual Feedback**: Immediate thumbnail generation and grid update
3. **Management**: Hover to delete individual items, or clear all
4. **Playback Integration**: New media immediately available for random selection

### 6.3 Text Overlay Flow
1. **Add Text**: Type in input field, press Enter or click Add
2. **Visual Confirmation**: Text appears as pill in pool
3. **Configure Frequency**: Adjust slider for display frequency
4. **Live Integration**: Text overlays begin appearing over media

### 6.4 Advanced Features Flow
1. **Reveal Controls**: Toggle Advanced Controls visibility
2. **Basic Adjustments**: Adjust colors, video settings, test card
3. **Projection Setup**: Enable Projection Mode
4. **Aspect Configuration**: Set projection area and basic transforms
5. **Corner Calibration**: Enter calibration mode, adjust corners, exit
6. **Fine-tuning**: Return to projection controls for additional adjustments

## 7. Responsive Behavior

### Large Screens (Desktop)
- Left drawer maintains fixed width
- Stage area remains fully visible alongside drawer
- Corner handles accessible when drawer hidden

### Medium Screens (Tablet Landscape)
- Drawer width adjusts proportionally
- Stage area may be partially covered by drawer
- Full functionality maintained

### Small Screens (Mobile/Tablet Portrait)
- Drawer becomes full-width overlay
- Stage completely hidden when drawer active
- Essential functions prioritized in limited space

## 8. Accessibility Considerations

### Keyboard Navigation
- ESC key: Return to normal mode from any advanced state
- Tab navigation through UI controls when visible
- Enter key: Submit text input, activate focused buttons

### Visual Accessibility
- High contrast maintained throughout (black/white)
- Clear visual hierarchy despite minimal styling
- Sufficient touch targets on smaller screens

### Interaction Feedback
- Immediate visual feedback for all user actions
- Clear state indication for toggles and modes
- Consistent interaction patterns across components

## 9. Technical Implementation Notes

### State Management
- UI visibility states stored in localStorage
- Mode states (Projection Mode, etc.) persist across sessions
- Media and text pools maintain persistence where possible

### Performance Considerations
- Smooth thumbnail generation for media grid
- Efficient scroll handling for large media collections
- Minimal DOM manipulation during idle transitions

### Integration Points
- Maptastic library integration for corner calibration
- FileSystemAccessAPI for file persistence
- CSS transforms for projection adjustments

---

This specification provides the complete UI/UX framework for VJ Tam Tam, maintaining the brutalist minimalist aesthetic while providing all necessary functionality for both casual and advanced users. 