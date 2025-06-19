### Epic 6: Advanced Display & Projection Tools

_Goal: Implement the advanced UI panel and integrate the projection mapping, color correction, and other advanced display controls, ensuring they are accessible via a UI toggle and function correctly, with persistence (via localStorage)._

1.  **Story:** As the Application, the panel containing advanced controls (including projection and color tools) should be hidden by default so that the main interface remains simple for most users.
    - **AC 1.1:** Given the application loads and there is no saved state for the advanced panel's visibility in `localStorage`, then the HTML element containing the advanced controls UI panel is not visible to the user.
    - **AC 1.2:** Given the application loads and there is no saved state for Projection Setup Mode in `localStorage`, then the application is not in Projection Setup Mode.
    - **AC 1.3:** The default hidden/inactive state is achieved using standard CSS display properties or similar methods that prevent interaction when not active.
2.  **Story:** As a User, I want a clear control in the basic UI to toggle the visibility of the panel containing advanced settings so that I can access these options when needed.
    - **AC 2.1:** Given the basic UI is visible (when not idle), there is a clearly identifiable control (e.g., a button labeled "Advanced" or an icon) that, when activated, toggles the visibility state of the advanced controls panel.
    - **AC 2.2:** When the advanced panel state is hidden and the user activates the toggle control, the advanced panel becomes visible.
    - **AC 2.3:** When the advanced panel state is visible and the user activates the toggle control, the advanced panel becomes hidden.
    - **AC 2.4:** Toggling the advanced panel visibility does not interrupt media playback.
    - **AC 2.5:** The current visibility state of the advanced panel is automatically saved to `localStorage` whenever it changes.
3.  **Story:** As a User, when the advanced settings panel is visible, I want to be able to enter/exit a specific "Projection Setup Mode" which activates the interactive projection mapping tools and potentially visual aids.
    - **AC 3.1:** Given the advanced controls panel is visible, there is a clearly identifiable control (e.g., a button labeled "Projection Setup" or "Edit Projection") that, when activated, toggles entry into/exit from "Projection Setup Mode".
    - **AC 3.2:** When the user enters "Projection Setup Mode", the interactive Maptastic handles for corner warping become visible and active on the display stage.
    - **AC 3.3:** When the user exits "Projection Setup Mode", the interactive Maptastic handles become hidden and inactive.
    - **AC 3.4:** Entering/exiting "Projection Setup Mode" does not interrupt media playback.
    - **AC 3.5:** The active/inactive state of "Projection Setup Mode" is automatically saved to `localStorage` whenever it changes.
    - **AC 3.7:** **All interactive controls and visual aids associated with Projection Setup Mode (specifically the Maptastic handles) respect the idle UI hiding mechanism defined in the core UI specs.** When the UI is idle, these handles are hidden; they reappear on user interaction.
4.  **Story:** As a User in Projection Setup Mode, I want to define the size and aspect ratio of the display stage to match my projection surface so that I can calibrate the projection area accurately.
    - **AC 4.1:** Given the user enters "Projection Setup Mode", the display stage's size transitions from being fully responsive to the window size (`width: 100vw`, `height: 100vh`) to having a fixed, user-definable size and aspect ratio.
    - **AC 4.2:** The advanced UI provides controls (e.g., dropdowns, input fields) to select common aspect ratio presets (16:9, 4:3, 1:1). These controls are only visible/active when in Projection Setup Mode.
    - **AC 4.2a (Match Screen Button Presence):** Given the user is in 'Projection Setup Mode' and the custom aspect ratio input controls are visible, a button (e.g., labeled 'Match Current Screen') is available.
    - **AC 4.2b (Match Screen Button Functionality):** When the user clicks the 'Match Current Screen' button, the custom aspect ratio input fields are updated with values reflecting the current **screen's** aspect ratio, and the display stage updates accordingly to this new custom aspect ratio (as per existing AC 4.4).
    - **AC 4.3:** The advanced UI provides input fields for the user to define a custom aspect ratio (e.g., entering 'x' and 'y' values for x:y). These controls are only visible/active when in Projection Setup Mode.
    - **AC 4.3a (Custom AR Default to Screen):** Given the custom aspect ratio input fields are activated (e.g., when 'Projection Setup Mode' is first entered with no saved custom aspect ratio, or when the user selects a 'custom' option), these input fields are pre-populated with values reflecting the current **screen's** aspect ratio.
    - **AC 4.4:** When an aspect ratio is selected (preset or custom) _while in Projection Setup Mode_, the display stage's dimensions are updated to match this ratio, maintaining maximum size within the window bounds while preserving the ratio.
    - **AC 4.5:** When the user exits "Projection Setup Mode", the display stage's size returns to being fully responsive to the window size.
    - **AC 4.6:** Changing the stage size/aspect ratio (while in Projection Setup Mode) gracefully handles currently applied Maptastic transformations and CSS filters, ensuring the visuals remain correctly positioned and styled relative to the _new_ stage dimensions.
5.  **Story:** As a User in Projection Setup Mode, I want interactive controls to adjust the perspective of the displayed visuals by dragging the corners so that I can correct distortion for projection mapping.
    - **AC 5.1:** Given the user is in "Projection Setup Mode", and Maptastic handles are visible and active (as per 3), the user can click and drag each of the four corner handles (top-left, top-right, bottom-right, bottom-left) of the display stage.
    - **AC 5.2:** As a corner handle is dragged, Maptastic updates the perspective transformation applied to the display stage element in real-time, visually warping the content.
    - **AC 5.3:** The perspective transformation persists visually as long as the user remains in Projection Setup Mode or until reset.
6.  **Story:** As a User in Projection Setup Mode, I want controls to adjust the scale, translation (position), rotation, and flip of the displayed visuals so that I can fine-tune the size, position, and orientation of the projection within the defined stage.
    - **AC 6.1:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for adjusting global scale (size) of the visuals on the stage. These controls are only visible/active when in Projection Setup Mode.
    - **AC 6.2:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for adjusting global translation (X and Y position offset) of the visuals on the stage. These controls are only visible/active when in Projection Setup Mode.
    - **AC 6.3:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for adjusting global rotation of the visuals on the stage. These controls are only visible/active when in Projection Setup Mode.
    - **AC 6.4:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for flipping the visuals horizontally and vertically. These controls are only visible/active when in Projection Setup Mode.
    - **AC 6.5:** Adjusting these scale, translate, rotate, or flip controls updates the corresponding transformations applied to the display stage using Maptastic or CSS transforms.
    - **AC 6.6:** These transformations are applied in conjunction with any active perspective warping (from Story 5) and relative to the stage size/aspect ratio (from Story 4).
    - **AC 6.7:** The applied transformations persist visually as long as the user remains in Projection Setup Mode or until reset.
7.  **Story:** As a User with advanced needs (when the advanced panel is visible), I want controls to adjust the brightness, contrast, and saturation of the displayed visuals so that I can correct for projector or room lighting conditions.
    - **AC 7.1:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders) for adjusting the global brightness of the display stage.
    - **AC 7.2:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders) for adjusting the global contrast of the display stage.
    - **AC 7.3:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders) for adjusting the global saturation of the display stage.
    - **AC 7.4:** Adjusting these controls updates the corresponding CSS filters (`brightness()`, `contrast()`, `saturate()`) applied to the display stage element in real-time.
    - **AC 7.5:** These color filter adjustments are applied regardless of whether the user is in "Projection Setup Mode".
8.  **Story:** As a User with advanced needs (when the advanced panel is visible), I want a control to toggle a test card overlay so that I can easily calibrate projection mapping and other visual settings against a reference pattern.
    - **AC 8.1:** Given the advanced controls panel is visible, there is a clearly labeled control (e.g., a button) to toggle the visibility of a test card overlay.
    - **AC 8.2:** When the test card toggle is activated, a predefined test card image/pattern is displayed as an overlay on the stage. Activating it again hides the overlay.
    - **AC 8.3:** The test card overlay is positioned and scaled to perfectly match the dimensions and currently applied transformations of the display stage (respecting aspect ratio and warping).
9.  **Story (CONTINGENCY):** As the Application, all settings exposed in the advanced UI panels (projection, filters, aspect ratio) AND the UI state (advanced panel visible/hidden, projection mode active/inactive) must be automatically saved to and loaded from `localStorage` (leveraging Epic 4 persistence) so that advanced configurations and UI state persist across sessions. _(Note: This may already be fully implemented through existing persistence infrastructure.)_
    - **AC 10.1:** Given a setting controlled in the advanced UI (e.g., aspect ratio choice, warp points, scale/translate/rotate values, color filter values) is changed, then its new value is automatically saved to `localStorage`.
    - **AC 10.2:** Given the visibility of the advanced panel changes (via 2), its new state (visible/hidden) is automatically saved to `localStorage`.
    - **AC 10.3:** Given the active state of "Projection Setup Mode" changes (via 3), its new state (active/inactive) is automatically saved to `localStorage`.
    - **AC 10.4:** Given the application starts, saved advanced settings AND UI states (panel visible/hidden, projection mode active/inactive) are found in `localStorage`, then these are loaded and applied to the internal state, the UI controls, and the UI panel/mode visibility _before_ playback begins.
    - **AC 10.5:** If no saved advanced settings or UI states are found in `localStorage` on startup, the application uses default values for settings and defaults to the advanced panel hidden and Projection Mode inactive (as per 1).