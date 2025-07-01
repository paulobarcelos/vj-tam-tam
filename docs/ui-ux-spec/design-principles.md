# Design Principles

## Visual Aesthetic

- **Style**: Brutalist minimalism - clean, functional, purposeful
- **Typography**: Arial Bold, consistent sizing across interface
- **Colors**: Extremely limited palette - primarily black, white, with minimal accent colors
- **Philosophy**: "Quiet" interface that stays out of the way of the visual performance

## Interaction Philosophy

- **Idle-First**: UI only appears on user interaction (mouse/keyboard activity)
- **Immediate Feedback**: Actions happen instantly without confirmation dialogs
- **Progressive Disclosure**: Advanced features hidden by default, revealed through clear hierarchies
- **Minimalist Notifications**: Non-intrusive toast messages for essential feedback only
- **Comprehensive Persistence**: All relevant UI states, interaction parameters (including advanced controls, projection settings, corner calibration data, drawer states, active tabs), and user configurations are saved to `localStorage` to ensure a consistent experience across sessions.
