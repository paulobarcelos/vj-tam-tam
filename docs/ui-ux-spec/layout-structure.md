# Layout Structure

## Stage (Main Display Area)

- **Size**: Full browser window (`100vw × 100vh`)
- **Content**: Media playback or welcome message
- **Interaction**: Always a drag-and-drop target for media files. Visual indication (e.g., border glow, overlay) when files are dragged over the window.
- **Background**: Black when no media is playing

## Left Drawer Panel

- **Nature**: Always an overlay on top of the stage.
- **Position**: Anchored to the left side of the stage.
- **Background**: Translucent (e.g., semi-transparent black), allowing the stage content behind it to be partially visible.
- **Visibility**: Hidden by default (Idle State), appears on user interaction (Active State).
- **Animation**: Quick fade-in or instant appearance (no elaborate animations).
- **Sizing**: See Section 7: Responsive Behavior.
