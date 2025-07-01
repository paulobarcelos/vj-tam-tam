# Epic 3: Core UI/UX Implementation & Design System

_Goal: Align the current UI implementation with the UI-UX-Spec.md and establish design standards for all future development. This epic ensures that the user interface follows the specified brutalist minimalism aesthetic and implements proper overlay positioning, idle/active states, and visual hierarchy as detailed in the UI-UX-Spec.md document._

**UI-UX-Spec.md Compliance:** All stories in this epic must be implemented according to the specifications in `docs/UI-UX-Spec.md`, which serves as the authoritative design document for visual implementation.

1.  **Story:** As a User, I want the left drawer to appear as a translucent overlay on top of the stage so that the visual content remains the primary focus while controls are accessible.
    - **AC 3.1.1:** Given the UI-UX-Spec.md Section 3 specifications, the left drawer is positioned as an overlay on top of the stage rather than as a sidebar taking up separate space.
    - **AC 3.1.2:** The left drawer has a translucent (semi-transparent black) background allowing the stage content behind it to be partially visible, as specified in UI-UX-Spec.md Section 3.
    - **AC 3.1.3:** The stage occupies the full browser window dimensions (100vw × 100vh) with the drawer overlaid on top, as specified in UI-UX-Spec.md Section 3.
    - **AC 3.1.4:** The drawer positioning and sizing follows the responsive behavior specified in UI-UX-Spec.md Section 7, adapting appropriately for different screen sizes.

2.  **Story:** As a User, I want the UI to automatically hide when I'm not interacting with it so that I can focus on the visuals without distraction during performance.
    - **AC 3.2.1:** Given the UI-UX-Spec.md Section 4 idle state specifications, all UI elements (left drawer, Maptastic handles, test card) are hidden by default when there is no user interaction.
    - **AC 3.2.2:** The UI appears (active state) when any mouse movement or keyboard input is detected, excluding ESC key in fullscreen mode, as specified in UI-UX-Spec.md Section 4.
    - **AC 3.2.3:** The UI returns to idle state after a defined period of inactivity, as specified in UI-UX-Spec.md Section 4.
    - **AC 3.2.4:** The idle state behavior does not persist across sessions - UI state on reload follows UI-UX-Spec.md Section 4 specifications.

3.  **Story:** As a User, I want the interface to follow a consistent brutalist minimalism design system so that the tool maintains a clean, purposeful aesthetic that doesn't interfere with the visual performance.
    - **AC 3.3.1:** Given the UI-UX-Spec.md Section 2 typography specifications, all text throughout the interface uses Arial Bold font family with consistent sizing.
    - **AC 3.3.2:** The interface implements the limited color palette specified in UI-UX-Spec.md Section 2: black background (#000000), white text on dark backgrounds (#FFFFFF), black text on light elements.
    - **AC 3.3.3:** The VJ Tam Tam logo is positioned at the top of the left drawer panel and follows the styling guidelines in UI-UX-Spec.md Section 5.2, appearing only when UI is active.
    - **AC 3.3.4:** Visual hierarchy and spacing follow the brutalist minimalism principles specified in UI-UX-Spec.md Section 1 and 2.

4.  **Story:** As a User, I want the media pool to display my files as square thumbnails with clear visual indicators so that I can easily identify and manage my media collection.
    - **AC 3.4.1:** Given the UI-UX-Spec.md Section 5.2 media pool specifications, media items display as square thumbnails using CSS object-fit cover to fill the square area while cropping as needed.
    - **AC 3.4.2:** Video files display with a play icon overlay to distinguish them from images, as specified in UI-UX-Spec.md Section 5.2.
    - **AC 3.4.3:** The media pool uses a responsive grid layout that reflows based on available space, as specified in UI-UX-Spec.md Section 5.2.
    - **AC 3.4.4:** Hover states reveal a delete button ("×") for individual media items, and the grid reflows when items are removed, as specified in UI-UX-Spec.md Section 5.2.

5.  **Story:** As a User, I want all interface components to follow consistent styling standards so that the tool feels cohesive and professional.
    - **AC 3.5.1:** All buttons throughout the interface follow the styling specifications in UI-UX-Spec.md, maintaining visual consistency.
    - **AC 3.5.2:** Form controls (sliders, inputs, toggles) implement the styling standards specified in UI-UX-Spec.md Section 5.2.
    - **AC 3.5.3:** Toast notifications are positioned bottom-center and styled according to UI-UX-Spec.md Section 5.4 specifications.
    - **AC 3.5.4:** Interactive elements meet the accessibility requirements specified in UI-UX-Spec.md Section 8, including keyboard navigation and visual feedback.

6.  **Story:** As a User, I want a fullscreen toggle button that integrates seamlessly with the brutalist design so that I can easily switch between windowed and fullscreen modes.
    - **AC 3.6.1:** Given the UI-UX-Spec.md Section 5.2 header specifications, a fullscreen toggle button is positioned in the drawer header area with appropriate icon-based design.
    - **AC 3.6.2:** The button's visual state (icon and tooltip) accurately reflects the current fullscreen status as specified for fullscreen controls in the UI-UX-Spec.md.
    - **AC 3.6.3:** The button responds to external fullscreen changes (browser ESC key, F11) and updates its state accordingly, following UI-UX-Spec.md interaction principles.
    - **AC 3.6.4:** The button styling follows the brutalist minimalism design system established in UI-UX-Spec.md Sections 1 and 2.
