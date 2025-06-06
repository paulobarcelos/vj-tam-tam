# UI Design Principles

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