# Project Requirements Document: VJ Tam Tam

## 1. Introduction / Problem Statement

VJ Tam Tam is a user-friendly, web-based "auto VJ" tool designed to solve the problem of needing quick, engaging, and effortless visual content for social gatherings like parties. Traditional VJ software can be complex and time-consuming to set up and manage during an event. VJ Tam Tam offers a zero-configuration solution where users can simply drop a folder of their existing photos and videos to generate an infinite, dynamic, fullscreen visual display. This eliminates the need for manual slideshow management or complicated setups, allowing hosts and guests to focus on the event itself while providing a unique visual atmosphere. The project was born out of the need for simple, effective visuals for the "Bum Bum Tam Tam" parties and aims to make this capability accessible to anyone.

## 2. Vision & Goals

- **Vision:** To become the go-to, effortless web tool for anyone wanting to add a dynamic, personal, and "eternal" visual backdrop to their social gatherings, empowering them to create a unique atmosphere simply by using their existing media.

- **Primary Goals (MVP):**
    1.  Enable users to instantly initiate an endless, randomized playback of their local photos (JPG/PNG/GIF/HEIC/WebP) and videos (MP4/MOV/WebM/AVI) by simply dropping files or selecting via a file dialog.
    2.  Implement a core playback engine that seamlessly transitions between media segments (with an initial default duration of 5 seconds each, individually configurable from 1 to 30 seconds) using hard cuts, ensuring a continuous and unpredictable visual flow.
    3.  Provide an intuitive text overlay system allowing users to add and display custom messages randomly over the visuals, with configurable frequency and a visually impactful presentation.
    4.  Develop a hidden-by-default "Advanced" mode accessible via a UI toggle, offering essential projection mapping controls (perspective warp, rotate/flip/scale) and basic color correction (brightness, contrast, saturation) for adapting to various projector setups.
    5.  Ensure all user configurations (file selections - if possible via API, text entries, timing settings, advanced display settings (including projection settings like warp/calibration data), video segment controls) are automatically saved and loaded from `localStorage` for persistence across sessions.

- **Success Criteria (Lean & Pragmatic):**
    * Successful and stable playback of diverse media types over extended periods (e.g., several hours) without crashes or significant performance degradation on typical desktop browsers.
    * Positive qualitative feedback from initial users, particularly regarding the ease of use and the unique "eternal slideshow" effect during real-world party scenarios.
    * Evidence of community engagement via GitHub (e.g., creation of issues for bug reports or feature suggestions, potential pull requests), indicating the tool is being used and valued.
    * Minimal or no critical errors reported in the browser console during typical usage flows.

## 3. Target Audience / Users

The primary target audience for VJ Tam Tam includes:

1.  **Party Hosts and Event Organizers:** Individuals throwing house parties, small gatherings, or niche events (like the "Bum Bum Tam Tam" parties) who want to easily add a dynamic visual element using their personal media without needing complex, professional VJ software or manual content management during an event. Their key need is a reliable, low-effort, and engaging visual backdrop.
2.  **Casual Users:** Anyone organizing informal social events (birthdays, dinners, casual hangouts) at home or a private space who wants a unique visual atmosphere that uses their own photos and videos in a fresh, non-traditional way, distinct from a standard photo slideshow. Their need is for simplicity, speed, and zero technical barrier to entry.
3.  **DIY Venues and Creative Spaces:** Small clubs, galleries, or community spaces that occasionally need simple, customizable visuals for events, art installations, or background ambiance, and appreciate having basic projection correction tools available for non-ideal setups, but without the cost or complexity of professional AV equipment.

These users value ease of use, quick results, and a tool that enhances the atmosphere without demanding constant attention. They are typically comfortable using a web browser on a desktop or laptop connected to a display or projector.

**Key User Interactions & Flows:**

* **Initial Setup:** User visits URL, drops media files/folders or uses file picker. Playback begins automatically.
* **Persistence & Resumption:** User can close and later revisit the URL; the application state (selected media - if API allows, text entries, settings) will automatically reload from `localStorage`, and playback will resume where they left off.
* **Mid-Performance Updates:** Users can add more media or modify text entries *while playback is ongoing*. The system should integrate these changes dynamically into the current pool for randomization.
* **Mid-Performance Adjustments:** Users can access the advanced settings and projection tools *while playback is ongoing* to make adjustments (e.g., warp perspective, tweak colors) without interrupting the visual stream.
* **Idle State:** When idle, the UI controls fade away, leaving only the fullscreen visuals. Controls reappear on mouse movement or keypress.

**UI/Visual Approach:**

* **Minimalist Overlay:** A translucent overlay will house controls, appearing only when the user is not idle. This keeps the focus on the visuals.
* **"About" Information:** A small, unobtrusive text element will be present on the UI (likely in the control overlay) indicating authorship and referencing the "Bum Bum Tam Tam" origin.

**Error Handling:**

* In case of non-critical errors (e.g., failure to load a specific file, invalid user input in a setting), a small, non-intrusive, custom-coded **toast notification** will appear briefly to inform the user, and the application will attempt to continue operation without interruption. Critical errors should be logged to the console as noted in technical preferences.

## 4. Key Features / Scope (High-Level Ideas for MVP)

* **Media Input:**
    * Ability to add media (photos: JPG, PNG, GIF, HEIC, WebP; videos: MP4, MOV, WebM, AVI) via drag-and-drop of files/folders or a native file picker dialog.
    * Additive media pool: new files are added to the existing set, not replaced.
    * Option to clear the entire media pool.
* **Playback Engine:**
    * Continuous, random playback of media segments.
    * Configurable segment duration (min/max sliders, with initial defaults of 5s for both, range 1-30s).
    * Hard cuts between media segments (no crossfades or smooth transitions).
    * Fullscreen display, responsive to screen size, always covering the stage ("cover" mode only).
* **Text Overlays:**
    * Ability to add unlimited custom text strings (via input field).
    * Additive text pool: new entries add to the existing set.
    * Option to clear the entire text pool.
    * Random display of text entries on top of visuals.
    * Configurable frequency/probability of text display.
    * Text rendering: Bold Arial (default), centered, dynamically scaled to fit 80% of screen width or height.
* **Advanced Display & Projection Tools (UI Toggleable Panel):**
    * Panel containing advanced controls, hidden by default, toggled visible/hidden by a UI control.
    * "Projection Setup Mode" toggle within the advanced panel to activate interactive projection tools.
    * Define Projection Area Size/Aspect Ratio & Fixed Stage (Story E5.S4 complexity). Controls for presets (16:9, 4:3, 1:1), custom input, and a "Match Current Screen" button.
    * Interactive corner-point warping (via Maptastic), active in Projection Setup Mode.
    * Scale, translation, rotation, and flip controls, active in Projection Setup Mode.
    * Test card overlay toggle, available when advanced panel is visible.
    * Global brightness, contrast, saturation sliders, available when advanced panel is visible.
    * Video Segment Start/End Control: Sliders or inputs to define how many seconds to skip from the beginning and end of video files (Story E5.S9), available when advanced panel is visible.
* **Persistence:**
    * All user settings (timing, text entries, advanced display settings (including projection settings like warp/calibration data), video segment controls), the user-toggled visibility state of UI sections (e.g., the Advanced Controls panel), and the overall projection mode state (active/inactive) are automatically saved to and loaded from `localStorage`. Note: The main drawer's general visibility (as determined by user activity/idle state) and its scroll positions are not persisted. Attempt to persist file references using `FileSystemAccessAPI` if browser supports, otherwise just settings/UI state persist.
* **UI/UX:**
    * Minimalist UI, controls auto-hide when idle (including Maptastic handles and test card overlay). Simple custom toast notifications for non-critical feedback.
* **Fullscreen Mode Control:** A dedicated UI button to allow users to easily enter and exit application fullscreen mode, with its state synchronized with the browser's fullscreen status.

## 5. Post MVP Features / Scope and Ideas

* **Smarter Content Handling:**
    * Simple image tinting filters (abstract names, palette-based).
    * More advanced content analysis (e.g., basic scene/face detection) to inform content selection or sequencing.
    * Option for subtle dynamic effects on media (e.g., very slow, minimal pan/zoom or color shifts).
* **Enhanced Text Features:**
    * Smart text placement to avoid overlaying key visual elements (like faces).
    * Multiple font selection and text styling options.
    * Simple text entry animations/effects.
    * Link text color to image tint palettes.
* **Audio Reactivity:**
    * Basic beat detection to influence visual pacing or text flashes.
* **Preset Management:**
    * Ability to save and load custom projection/filter/aspect ratio presets.
    * **Shareable Configurations:** Storing settings and text entries in the URL for sharing/bookmarking (with reconciliation logic).
* **More Media Types:**
    * Support for audio-only files.

## 6. Known Technical Constraints or Preferences

* **Constraints:**
    * **Timeline:** Unspecified - project is for fun/learning.
    * **Budget:** Zero - open-source, community-driven potential.
    * **Platform:** Desktop browsers only (no explicit mobile support planned).
    * **Connectivity:** Offline-first after initial load (no backend server dependencies for core function).
    * **User Management:** No user accounts; all state saved locally via `localStorage`.
* **Preferences:**
    * **Frontend Stack:** Pure Vanilla JS + ES Modules (no frameworks).
    * **Rendering:** HTML/CSS for the stage (`<div>` based) rather than Canvas for core media display.
    * **Key Libraries:** Maptastic (local copy in `lib/`) for projection warping; native `FileSystemAccessAPI` for file handling.
    * **Code Structure:** Modular (`core.js`, `mapping.js`, `ui.js` in `src/`), flat directory tree at repo root, `docs/` for specifications. Avoid over-engineering (e.g., minimal functional style over classes).
    * **Deployment:** GitHub Pages.
    * **Analytics/Tracking:** Zero analytics or tracking.
* **Risks:**
    * Browser security restrictions impacting `FileSystemAccessAPI` persistence across sessions.
    * Performance issues with rendering large media files or complex projection transforms/CSS filters, especially on older hardware.
* **User Preferences (Specific/Non-Feature):**
    * Preference for functional programming style over classes in JS where feasible.
    * Desire for minimal, elegant code structure.
    * Requirement for console logs to be preserved (not suppressed) for debugging.

* **Technical Assumptions:**
    The following initial technical preferences and considerations have been noted:
    * **Rendering Approach:**
        * The initial preference is for **HTML/CSS** for rendering the main visual display stage, rather than Canvas. This choice is aimed at leveraging better text rendering capabilities and simpler media handling. It's acknowledged that this might limit visual effects to what CSS filters can provide, without pixel-level control.
    * **Key Libraries:**
        * **Maptastic.js** is identified as a key library for implementing projection warping features. It's anticipated this will be included as a local copy (e.g., in `lib/maptastic.js`).
    * **Code Structure & Deployment:**
        * The project is intended for deployment via **GitHub Pages**, suggesting a client-side heavy application with no complex backend.
        * Application files (e.g., `index.html`, `src/`, `lib/`, `assets/`) are planned to reside at the **repository root** to facilitate straightforward GitHub Pages deployment.
        * JavaScript development will utilize **ES Modules**.
        * A **flat directory tree** is preferred within the `src/` directory (e.g., containing modules like `core.js`, `mapping.js`, `ui.js`).
        * A guiding principle is to **avoid over-engineering** where possible (e.g., use classes only if critically necessary, favoring a functional programming style otherwise).
    * **Initial High-Level File Structure Envisioned:**
        ```plaintext
        ./
        ├── index.html
        ├── lib/
        │   └── maptastic.js
        ├── src/
        │   ├── core.js
        │   ├── mapping.js
        │   └── ui.js
        └── assets/
            ├── media/
            └── test-card.png
        ```

## 7. Epics, Stories, and Acceptance Criteria

This section outlines the breakdown of MVP scope into implementable Epics and User Stories, each with defined Acceptance Criteria.

### Epic 1: Foundational Playback & Media Input
*Goal: Establish the basic application structure, enable drag-and-drop/file picker, and create the core engine for playback of full media files.*

1.  **Story:** As a User, I want to be able to drop image and video files/folders onto the application window so that I can easily load my media.
    * **AC 1.1:** Given I am on the VJ Tam Tam page, when I drag one or more image files (JPG, PNG, GIF, HEIC, WebP) from my file system and drop them anywhere onto the application window, then the application processes these files for playback.
    * **AC 1.2:** Given I am on the VJ Tam Tam page, when I drag one or more video files (MP4, MOV, WebM, AVI) from my file system and drop them anywhere onto the application window, then the application processes these files for playback.
    * **AC 1.3:** Given I am on the VJ Tam Tam page, when I drag a folder containing supported image and/or video files from my file system and drop it anywhere onto the application window, then the application recursively finds and processes all supported files within that folder.
    * **AC 1.4:** Given I am on the VJ Tam Tam page, when I drag a file type that is *not* supported (e.g., a `.txt` or `.pdf` file) and drop it, then the application ignores this file **AND a toast notification appears indicating that the file type is not supported and listing the supported types (JPG, PNG, GIF, HEIC, WebP, MP4, MOV, WebM, AVI).**
    * **AC 1.5:** Given I am on the VJ Tam Tam page, when I drag files/folders, then the application window provides a visual indication (e.g., a border change or overlay) that it is a valid drop target.
2.  **Story:** As a User, I want to be able to select image and video files/folders using a standard file picker dialog so that I have an alternative way to load my media if drag-and-drop is inconvenient.
    * **AC 2.1:** Given I am on the VJ Tam Tam page, when I click on a designated area or button for selecting files, then a standard operating system file picker dialog opens.
    * **AC 2.2:** Given the file picker is open, when I select one or more supported image files (JPG, PNG, GIF, HEIC, WebP) and confirm the selection, then the application processes these files for playback.
    * **AC 2.3:** Given the file picker is open, when I select one or more supported video files (MP4, MOV, WebM, AVI) and confirm the selection, then the application processes these files for playback.
    * **AC 2.4:** Given the file picker is open, when I select a folder containing supported image and/or video files and confirm the selection, then the application recursively finds and processes all supported files within that folder.
    * **AC 2.5:** Given the file picker is open, when I select a file type that is *not* supported and confirm, then the application ignores this file **AND a toast notification appears indicating that the file type is not supported and listing the supported types.**
    * **AC 2.6:** Given the file picker is open, when I cancel the selection, then the picker closes, and the application state remains unchanged with no error message displayed.
3.  **Story:** As the Application, I want to add newly dropped/selected files to the existing media pool, rather than replacing it, so that users can build their media collection incrementally.
    * **AC 3.1:** Given the media pool is empty, when I drop/select one or more supported files/folders, then the media pool is populated with the valid files from my selection.
    * **AC 3.2:** Given the media pool already contains media, when I drop/select additional supported files/folders, then the new valid files from my selection are added to the *existing* media pool. The previously loaded media remains in the pool.
    * **AC 3.3:** Given the media pool has been updated by adding new files, when playback is active, the new media becomes eligible for random selection and display alongside the older media.
4.  **Story:** As the Application, I want to display the selected images and videos fullscreen, filling the entire browser window without distorting aspect ratio (like `background-size: cover` in CSS), so that the visuals create an immersive backdrop.
    * **AC 4.1:** Given the application is displaying an image from the media pool, then the image element is positioned and sized to fill the entire display area while maintaining its original aspect ratio, cropping as necessary.
    * **AC 4.2:** Given the application is displaying a video from the media pool, then the video element is positioned and sized to fill the entire display area while maintaining its original aspect ratio, cropping as necessary.
    * **AC 4.3:** Given the application is displaying media fullscreen, when the browser window is resized, then the displayed media immediately adapts to fill the new window dimensions while maintaining aspect ratio (cover behavior).
5.  **Story:** As the Application, I want to initiate playback automatically once media is loaded so that the user sees results instantly without needing to press a 'Play' button.
    * **AC 5.1:** Given the application has loaded in the browser and the media pool is populated (either from a new drop/selection or from `localStorage` persistence), then playback of media from the pool begins automatically without any user interaction.
    * **AC 5.2:** Given playback has started automatically, it continues without interruption until the browser tab is closed or the media pool is cleared.
6.  **Story:** As the Application, I want to cycle through the full images and videos in the media pool (initially just showing each for a duration, segments come later) so that the basic visual stream is established.
    * **AC 6.1:** Given playback is active and the media pool is not empty, then the application randomly selects a media item from the pool.
    * **AC 6.2:** Given a media item is selected, it is displayed fullscreen using the 'cover' behavior (as per AC 4.x).
    * **AC 6.3:** Given an image is displayed, it remains visible for a fixed duration (e.g., 4 seconds - we'll make this configurable later).
    * **AC 6.4:** Given a video is displayed, it plays from its beginning to its end (or a fixed maximum duration if the video is very long - this will be refined in the next Epic).
    * **AC 6.4a:** When a video is played, its audio track should be muted.
    * **AC 6.5:** After the display duration for the current media item is complete (or the video finishes), the application immediately (hard cut) transitions to a *new* randomly selected media item from the pool.
    * **AC 6.6:** The process of random selection and display continues indefinitely as long as the media pool is not empty.
7.  **Story:** As a User, when the media pool is empty, I want to see an informative message guiding me on how to add media so that I know how to get started.
    * **AC E1.S7.1:** Given the application loads and the media pool is empty (either initially or after clearing media), then a specific text message, like "Welcome to VJ Tam Tam, please drag and drop your photos and videos here, or click to browse, to start your performance", is displayed prominently on the stage area.
    * **AC E1.S7.2:** When the user adds media to the empty pool, the welcome/instruction text disappears.
    * **AC E1.S7.3:** The welcome/instruction text is styled clearly and centered on the stage.

### Epic 2: Randomized Segment Playback
*Goal: Enhance the playback engine to handle random segments (configurable duration, e.g., default 5s, range 1-30s) of media files, including skipping parts of videos, providing the "eternal slideshow" effect.*

1.  **Story:** As the Application, I want to select a random segment from the currently chosen media item (image or video) for display so that the playback is constantly varied and unpredictable.
    * **AC 1.1:** Given playback is active, when a new media item is selected for display, the application determines a random start point within the media's total duration.
    * **AC 1.2:** The random start point is calculated such that a segment of the configured duration can be played without exceeding the media's total duration.
    * **AC 1.3:** The calculated segment duration for display is a random value between the configured minimum and maximum duration settings (with the configurable minimum and maximum duration settings initially defaulting to 5 seconds each, and the overall configurable range for these settings being 1 to 30 seconds).
    * **AC 1.4:** Given an image is selected, the application displays the full image for the calculated random segment duration.
    * **AC 1.5:** Given a video is selected, the application starts playback of the video from the random start point for the calculated random segment duration.
    * **AC 1.6 (Video Offset Edge Case - Calculate Valid Range):** Given a video with total duration `D`, configured "skip start" `SS`, configured "skip end" `SE`, and selected segment duration `SD` (where `min_duration <= SD <= max_duration`), the application determines the valid range of possible start points `[ValidStartMin, ValidStartMax]` for the segment. This range is initially constrained by `SS` (segment must start >= `SS`) and `D - SE - SD` (segment must end <= `D - SE`).
    * **AC 1.7 (Video Offset Edge Case - Fallback Logic):** If the initially calculated valid range `[ValidStartMin, ValidStartMax]` results in `ValidStartMin > ValidStartMax` (meaning no valid start point exists considering all offsets and duration), the application attempts the following fallback steps until a valid range is found:
        * **Fallback 1:** Recalculate the range ignoring the "skip end" (`SE`) constraint.
        * **Fallback 2:** If Fallback 1 still results in `ValidStartMin > ValidStartMax`, recalculate the range ignoring *both* the "skip start" (`SS`) and "skip end" (`SE`) constraints.
    * **AC 1.8 (Video Offset Edge Case - Selection):** Once a valid range `[ValidStartMin, ValidStartMax]` is found (either through the initial calculation or a fallback step), the application selects a random start point for the video segment within this valid range.
    * **AC 1.9 (Video Offset Edge Case - Notification):** If Fallback 2 is triggered (meaning both start and end offsets had to be ignored for this specific video), a toast notification appears informing the user that the configured video offsets were too large for a particular video and were temporarily ignored for that playback.
2.  **Story:** As the Application, when displaying a video segment, I want to ensure it plays correctly for its specified duration starting from the randomly selected point so that video playback is consistent with images.
    * **AC 2.1:** Given a video is selected for playback at a specific random start point and for a specific segment duration, the video element's playback begins precisely at the calculated start point.
    * **AC 2.2:** The video playback continues from the start point for the exact duration specified for the segment.
    * **AC 2.3:** When the video playback reaches the end of the segment duration, the application immediately (hard cut) transitions to the next media item.
    * **AC 2.4:** If the video's natural end is reached before the segment duration is complete, the application immediately transitions to the next media item when the video ends.
3.  **Story:** As a User, I want to be able to configure the duration range (minimum and maximum seconds) for the random segments so that I can control the pace of the visual transitions.
    * **AC 3.1:** Given the UI is visible, there is a control (e.g., a slider or input field pair) labeled clearly for setting the minimum segment duration.
    * **AC 3.2:** Given the UI is visible, there is a control (e.g., a slider or input field pair) labeled clearly for setting the maximum segment duration.
    * **AC E2.S3.2a (Min Slider Range & Default):** The minimum segment duration control (slider/input) allows selection from 1 second to 30 seconds, and its initial default value upon first load (before any user configuration is saved) is 5 seconds.
    * **AC E2.S3.2b (Max Slider Range & Default):** The maximum segment duration control (slider/input) allows selection from 1 second to 30 seconds, and its initial default value upon first load (before any user configuration is saved) is 5 seconds.
    * **AC 3.3:** When the user adjusts the minimum duration control, the application updates the setting for subsequent segment duration calculations.
    * **AC 3.4:** When the user adjusts the maximum duration control, the application updates the setting for subsequent segment duration calculations.
    * **AC 3.5:** The application enforces the relationship between minimum and maximum duration: If the user attempts to set a minimum duration greater than the current maximum duration, the maximum duration is automatically increased to equal the new minimum. If the user attempts to set a maximum duration less than the current minimum duration, the minimum duration is automatically decreased to equal the new maximum. No toast notification is displayed for these adjustments.
    * **AC 3.6:** The application uses the currently configured minimum and maximum duration settings when calculating the random segment duration for each new media item.
4.  **Story:** As a User with advanced needs, I want to specify how many seconds to skip from the beginning of video files when selecting a random segment start point so that I can avoid intros or static starts.
    * **AC 4.1:** Given the advanced UI is visible, there is a control (e.g., a slider or input field) labeled clearly for setting the "skip start" duration for videos.
    * **AC 4.2:** When the user adjusts the "skip start" control, the application updates this setting for subsequent video segment calculations (as used in AC 1.6).
5.  **Story:** As a User with advanced needs, I want to specify how many seconds to skip from the end of video files when selecting a random segment start point so that I can avoid outros or final static frames.
    * **AC 5.1:** Given the advanced UI is visible, there is a control (e.g., a slider or input field) labeled clearly for setting the "skip end" duration for videos.
    * **AC 5.2:** When the user adjusts the "skip end" control, the application updates this setting for subsequent video segment calculations (as used in AC 1.6).

### Epic 3: Text Overlay Experience
*Goal: Implement the text input, pool management, and random display logic, allowing users to add and see their custom messages over the visuals.*

1.  **Story:** As a User, I want to be able to enter custom text strings one by one so that I can build a pool of messages to display.
    * **AC 1.1:** Given the UI is visible, there is a clearly labeled input field where the user can type text.
    * **AC 1.2:** Given the UI is visible, there is a button (e.g., "Add Text" or "+") next to the input field, or hitting the "Enter" key while focused on the input field, triggers the action to add the entered text.
    * **AC 1.3:** When the user enters text into the input field and triggers the add action, the text string is processed by the application.
    * **AC 1.4:** If the input field is empty when the add action is triggered, no text is added to the pool.
2.  **Story:** As the Application, I want to add newly entered text strings to a pool of text entries, rather than replacing them, so that users can build their collection of messages incrementally.
    * **AC 2.1:** Given the text pool is empty, when the user adds a valid text string, the text pool is populated with that string.
    * **AC 2.2:** Given the text pool already contains entries, when the user adds a new valid text string, the new string is added to the existing text pool. The previously added entries remain in the pool.
    * **AC 2.3:** Given the text pool has been updated by adding new strings, when text display is active, the new strings become eligible for random selection and display alongside the older ones.
3.  **Story:** As a User, I want to see a list of the text strings I have added so that I can review my current pool of messages.
    * **AC 3.1:** Given the UI is visible and the text pool is not empty, there is a visible list or display area showing all the current text strings in the pool.
    * **AC 3.2:** When text strings are added to the pool (via input), the displayed list updates automatically to include the new entries.
    * **AC 3.3:** When text strings are removed from the pool, the displayed list updates automatically to reflect the changes.
    * **AC 3.4:** If the text pool is empty, the list/display area for text strings is empty or hidden.
4.  **Story:** As a User, I want to be able to remove individual text strings from the list so that I can manage my pool of messages.
    * **AC 4.1:** Given the list of text strings is displayed, each individual text string in the list has a clearly identifiable control (e.g., an "X" button) to trigger its removal.
    * **AC 4.2:** When the user activates the removal control for a specific text string, that string is removed from the text pool.
    * **AC 4.3:** Removing a text string updates the displayed list (as per AC 3.3).
5.  **Story:** As a User, I want to be able to clear the entire list of text strings so that I can start my message pool over.
    * **AC 5.1:** Given the UI is visible and the text pool is not empty, there is a clearly labeled control (e.g., a "Clear All" button) to remove all text entries.
    * **AC 5.2:** When the user activates the "Clear All" control, the text pool becomes empty.
    * **AC 5.3:** Clearing all text strings updates the displayed list to be empty (as per AC 3.4).
6.  **Story:** As the Application, I want to randomly select a text string from the pool and display it on the screen periodically during playback so that custom messages appear over the visuals.
    * **AC 6.1:** Given playback is active and the text pool is not empty, the application periodically selects a random text string from the pool for display.
    * **AC 6.2:** The selection and display of text strings occur independently of the media segment transitions.
    * **AC 6.3:** When a text string is selected, it is displayed on the screen for a specific duration (e.g., 3-5 seconds).
    * **AC 6.4:** After the display duration, the text string fades out or is immediately hidden.
    * **AC 6.5:** The frequency with which new text strings are selected and displayed is controllable (see Story 7).
7.  **Story:** As a User, I want to be able to configure how frequently text strings appear on the screen so that I can control the balance between visuals and messages.
    * **AC 7.1:** Given the UI is visible, there is a control (e.g., a slider or input field) labeled clearly for setting the frequency or probability of text display (e.g., a value from 0 to 1, or "Rare", "Occasional", "Frequent").
    * **AC 7.2:** When the user adjusts the text frequency control, the application updates this setting.
    * **AC 7.3:** The application uses the current text frequency setting to determine how often new text strings are selected and displayed (AC 6.5). A frequency of 0 should result in no text being displayed.
8.  **Story:** As the Application, I want the displayed text strings to be styled with a bold Arial font, be centered on the screen, and scale dynamically to occupy a maximum of 80% of the screen's width or height so that they are prominent and readable.
    * **AC 8.1:** Given a text string is selected for display, it is rendered using a bold weight of the Arial font family.
    * **AC 8.2:** Given a text string is displayed, its HTML element is positioned using CSS so that it is visually centered horizontally within the display area.
    * **AC 8.3:** Given a text string is displayed, its HTML element is positioned using CSS so that it is visually centered vertically within the display area.
    * **AC 8.4:** Given a text string is displayed, its font size is dynamically calculated based on the current browser window dimensions and the text content, such that the text bounding box does not exceed 80% of either the screen width or the screen height.
    * **AC 8.5:** Given a text string is displayed, its color is randomly chosen to be either pure black (`#000000`) or pure white (`#FFFFFF`). A different random color choice is made each time a text string is selected for display.
    * **AC 8.6:** Given a text string is displayed, its HTML element has a CSS `z-index` value or stacking context that ensures it appears visually *on top of* the media elements (`<img>` or `<video>`) displayed on the stage.

### Epic 4: Persistence & Basic Settings
*Goal: Implement saving and loading of user configurations and media/text pools using `localStorage`, ensuring the application state persists across sessions.*

1.  **Story:** As the Application, I want to automatically save user-configurable settings (like segment duration range, text frequency, video skip offsets) to `localStorage` whenever a setting is changed so that the user's preferences are remembered across sessions.
    * **AC E4.S1.1:** Given a user setting that is intended to be persistent (e.g., min/max segment duration, text frequency, video skip start/end, advanced UI visible state, projection mode state) is changed via its UI control, then the new value of that setting is immediately saved to `localStorage` under a predictable key structure (e.g., `vjtamtam.settings.minDuration`).
    * **AC E4.S1.2:** All persistent user settings are stored within a single, structured object or related keys in `localStorage` to keep the data organized.
    * **AC E4.S1.3:** Saving to `localStorage` is done asynchronously if the operation could potentially block the main thread, or confirmation is provided that `localStorage` operations are non-blocking in modern browsers for typical data sizes.
    * **AC E4.S1.4:** If saving to `localStorage` fails (e.g., storage quota exceeded), a toast notification appears informing the user that settings could not be saved.
2.  **Story:** As the Application, I want to load saved user settings from `localStorage` when the application starts so that the user's last configuration is automatically applied without requiring manual setup.
    * **AC E4.S2.1:** Given the application starts in a browser where VJ Tam Tam has been previously used and settings were saved to `localStorage`, then the application reads the saved settings on load.
    * **AC E4.S2.2:** The application applies the loaded settings to the corresponding internal state variables and UI controls (if the UI is visible) before playback begins.
    * **AC E4.S2.3:** If no settings are found in `localStorage` on startup, the application uses the default values for all settings.
    * **AC E4.S2.4:** Loading from `localStorage` does not cause any visual delay or blocking of the initial application render.
    * **AC E4.S2.5:** If loading from `localStorage` fails for any reason (e.g., corrupted data), the application uses default values and potentially logs an error to the console.
3.  **Story:** As the Application, I want to attempt to save references to the user's selected media files using the `FileSystemAccessAPI` (if available) so that the media pool can potentially be reloaded automatically on startup.
    * **AC E4.S3.1:** Given the browser supports the `FileSystemAccessAPI` and the user has added files/folders via the picker or drag-and-drop, then the application obtains the necessary `FileSystemFileHandle` or `FileSystemDirectoryHandle` for each selected item.
    * **AC E4.S3.2:** The application serializes these file/directory handles into a format suitable for storage (as allowed by the API, typically just the handles themselves can be stored directly in `localStorage`).
    * **AC E4.S3.3:** The serialized file/directory handles are saved to `localStorage` under a dedicated key (e.g., `vjtamtam.media.handles`) whenever the media pool is updated (files added or cleared).
    * **AC E4.S3.4:** If the browser does *not* support `FileSystemAccessAPI`, the application skips saving file handles and logs a note to the console indicating that media persistence is not available.
4.  **Story:** As the Application, if loadable file references exist in `localStorage` and the browser supports `FileSystemAccessAPI`, I want to automatically load the associated media files into the pool when the application starts so that the user's media is ready without re-selection.
    * **AC E4.S4.1:** Given the application starts, the browser supports `FileSystemAccessAPI`, and saved file/directory handles are found in `localStorage`, then the application attempts to retrieve the corresponding `File` or `Directory` objects from these handles.
    * **AC E4.S4.2:** The application recursively reads supported media files from the re-obtained handles (similar logic to initial file input).
    * **AC E4.S4.3:** Successfully loaded media files are added to the application's media pool on startup.
    * **AC E4.S4.4:** The application handles potential user permissions requests from the browser if re-accessing handles requires it. If permission is granted, loading continues; if denied, proceed as per AC E4.S5.2.
5.  **Story:** As the Application, if file references cannot be loaded or re-accessed (e.g., browser limitation, user moved/deleted files), I want to handle this gracefully by starting with an empty media pool but still loading saved settings, potentially indicating that previous media could not be loaded via a toast notification, so that the application doesn't appear broken.
    * **AC E4.S5.1:** Given the application starts, but either the browser does not support `FileSystemAccessAPI` OR no saved file handles are found in `localStorage`, then the media pool starts empty. Saved settings are still loaded (as per E4.S2).
    * **AC E4.S5.2:** Given the application starts, saved file handles *are* found, and the browser *does* support the API, but the application fails to re-obtain the files from the handles (e.g., files moved/deleted, user denied permission request), then the media pool starts empty. Saved settings are still loaded (as per E4.S2).
    * **AC E4.S5.3:** In the scenario described in AC E4.S5.2 (failed attempt to load persisted media), a toast notification appears informing the user that previously selected media could not be reloaded and they need to select files again.
6.  **Story:** As a User, I want a visible control (e.g., a button in the UI) to clear all currently loaded media from the pool so that I can easily remove all files and start fresh or add a completely new set.
    * **AC E4.S6.1:** Given the UI is visible and the media pool is not empty, there is a clearly labeled control (e.g., a "Clear Media" or "Reset Files" button) to remove all media.
    * **AC E4.S6.2:** When the user activates the "Clear Media" control, all media items are removed from the application's current media pool.
    * **AC E4.S6.3:** Activating the "Clear Media" control immediately stops playback if it was active and the pool becomes empty.
    * **AC E4.S6.4:** After clearing, the media pool remains empty until the user adds new media.
7.  **Story:** As the Application, when the user clears the media pool, I want to remove all media references and settings related to the media pool from `localStorage` so that the pool is empty on the next load.
    * **AC E4.S7.1:** Given the user activates the "Clear Media" control (AC E4.S6.2), then any saved file/directory handles for media in `localStorage` are removed or the corresponding `localStorage` key is cleared (`vjtamtam.media.handles`).
    * **AC E4.S7.2:** After clearing media and its references from `localStorage`, if the application is reloaded, the media pool starts empty (unless new files are added).
8.  **Story:** As the Application, when the user clears the text pool (using the control from Epic 3), I want to remove all text entries from `localStorage` so that the pool is empty on the next load.
    * **AC E4.S8.1:** Given the user activates the "Clear All Text" control (from Epic 3), then all saved text entries in `localStorage` are removed or the corresponding `localStorage` key is cleared (e.g., `vjtamtam.text.entries`).
    * **AC E4.S8.2:** After clearing text entries from `localStorage`, if the application is reloaded, the text pool starts empty.

### Epic 5: Advanced Display & Projection Tools
*Goal: Implement the advanced UI panel and integrate the projection mapping, color correction, and other advanced display controls, ensuring they are accessible via a UI toggle and function correctly, with persistence (via localStorage).*

1.  **Story:** As the Application, the panel containing advanced controls (including projection and color tools) should be hidden by default so that the main interface remains simple for most users.
    * **AC E5.S1.1:** Given the application loads and there is no saved state for the advanced panel's visibility in `localStorage`, then the HTML element containing the advanced controls UI panel is not visible to the user.
    * **AC E5.S1.2:** Given the application loads and there is no saved state for Projection Setup Mode in `localStorage`, then the application is not in Projection Setup Mode.
    * **AC E5.S1.3:** The default hidden/inactive state is achieved using standard CSS display properties or similar methods that prevent interaction when not active.
2.  **Story:** As a User, I want a clear control in the basic UI to toggle the visibility of the panel containing advanced settings so that I can access these options when needed.
    * **AC E5.S2.1:** Given the basic UI is visible (when not idle), there is a clearly identifiable control (e.g., a button labeled "Advanced" or an icon) that, when activated, toggles the visibility state of the advanced controls panel.
    * **AC E5.S2.2:** When the advanced panel state is hidden and the user activates the toggle control, the advanced panel becomes visible.
    * **AC E5.S2.3:** When the advanced panel state is visible and the user activates the toggle control, the advanced panel becomes hidden.
    * **AC E5.S2.4:** Toggling the advanced panel visibility does not interrupt media playback.
    * **AC E5.S2.5:** The current visibility state of the advanced panel is automatically saved to `localStorage` whenever it changes.
3.  **Story:** As a User, when the advanced settings panel is visible, I want to be able to enter/exit a specific "Projection Setup Mode" which activates the interactive projection mapping tools and potentially visual aids.
    * **AC E5.S3.1:** Given the advanced controls panel is visible, there is a clearly identifiable control (e.g., a button labeled "Projection Setup" or "Edit Projection") that, when activated, toggles entry into/exit from "Projection Setup Mode".
    * **AC E5.S3.2:** When the user enters "Projection Setup Mode", the interactive Maptastic handles for corner warping become visible and active on the display stage.
    * **AC E5.S3.3:** When the user exits "Projection Setup Mode", the interactive Maptastic handles become hidden and inactive.
    * **AC E5.S3.4:** Entering/exiting "Projection Setup Mode" does not interrupt media playback.
    * **AC E5.S3.5:** The active/inactive state of "Projection Setup Mode" is automatically saved to `localStorage` whenever it changes.
    * **AC E5.S3.7:** **All interactive controls and visual aids associated with Projection Setup Mode (specifically the Maptastic handles) respect the idle UI hiding mechanism defined in the core UI specs.** When the UI is idle, these handles are hidden; they reappear on user interaction.
4.  **Story:** As a User in Projection Setup Mode, I want to define the size and aspect ratio of the display stage to match my projection surface so that I can calibrate the projection area accurately.
    * **AC E5.S4.1:** Given the user enters "Projection Setup Mode", the display stage's size transitions from being fully responsive to the window size (`width: 100vw`, `height: 100vh`) to having a fixed, user-definable size and aspect ratio.
    * **AC E5.S4.2:** The advanced UI provides controls (e.g., dropdowns, input fields) to select common aspect ratio presets (16:9, 4:3, 1:1). These controls are only visible/active when in Projection Setup Mode.
    * **AC E5.S4.2a (Match Screen Button Presence):** Given the user is in 'Projection Setup Mode' and the custom aspect ratio input controls are visible, a button (e.g., labeled 'Match Current Screen') is available.
    * **AC E5.S4.2b (Match Screen Button Functionality):** When the user clicks the 'Match Current Screen' button, the custom aspect ratio input fields are updated with values reflecting the current **screen's** aspect ratio, and the display stage updates accordingly to this new custom aspect ratio (as per existing AC E5.S4.4).
    * **AC E5.S4.3:** The advanced UI provides input fields for the user to define a custom aspect ratio (e.g., entering 'x' and 'y' values for x:y). These controls are only visible/active when in Projection Setup Mode.
    * **AC E5.S4.3a (Custom AR Default to Screen):** Given the custom aspect ratio input fields are activated (e.g., when 'Projection Setup Mode' is first entered with no saved custom aspect ratio, or when the user selects a 'custom' option), these input fields are pre-populated with values reflecting the current **screen's** aspect ratio.
    * **AC E5.S4.4:** When an aspect ratio is selected (preset or custom) *while in Projection Setup Mode*, the display stage's dimensions are updated to match this ratio, maintaining maximum size within the window bounds while preserving the ratio.
    * **AC E5.S4.5:** When the user exits "Projection Setup Mode", the display stage's size returns to being fully responsive to the window size.
    * **AC E5.S4.6:** Changing the stage size/aspect ratio (while in Projection Setup Mode) gracefully handles currently applied Maptastic transformations and CSS filters, ensuring the visuals remain correctly positioned and styled relative to the *new* stage dimensions.
5.  **Story:** As a User in Projection Setup Mode, I want interactive controls to adjust the perspective of the displayed visuals by dragging the corners so that I can correct distortion for projection mapping.
    * **AC E5.S5.1:** Given the user is in "Projection Setup Mode", and Maptastic handles are visible and active (as per E5.S3), the user can click and drag each of the four corner handles (top-left, top-right, bottom-right, bottom-left) of the display stage.
    * **AC E5.S5.2:** As a corner handle is dragged, Maptastic updates the perspective transformation applied to the display stage element in real-time, visually warping the content.
    * **AC E5.S5.3:** The perspective transformation persists visually as long as the user remains in Projection Setup Mode or until reset.
6.  **Story:** As a User in Projection Setup Mode, I want controls to adjust the scale, translation (position), rotation, and flip of the displayed visuals so that I can fine-tune the size, position, and orientation of the projection within the defined stage.
    * **AC E5.S6.1:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for adjusting global scale (size) of the visuals on the stage. These controls are only visible/active when in Projection Setup Mode.
    * **AC E5.S6.2:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for adjusting global translation (X and Y position offset) of the visuals on the stage. These controls are only visible/active when in Projection Setup Mode.
    * **AC E5.S6.3:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for adjusting global rotation of the visuals on the stage. These controls are only visible/active when in Projection Setup Mode.
    * **AC E5.S6.4:** Given the user is in "Projection Setup Mode", there are controls in the advanced UI for flipping the visuals horizontally and vertically. These controls are only visible/active when in Projection Setup Mode.
    * **AC E5.S6.5:** Adjusting these scale, translate, rotate, or flip controls updates the corresponding transformations applied to the display stage using Maptastic or CSS transforms.
    * **AC E5.S6.6:** These transformations are applied in conjunction with any active perspective warping (from Story 5) and relative to the stage size/aspect ratio (from Story 4).
    * **AC E5.S6.7:** The applied transformations persist visually as long as the user remains in Projection Setup Mode or until reset.
7.  **Story:** As a User with advanced needs (when the advanced panel is visible), I want controls to adjust the brightness, contrast, and saturation of the displayed visuals so that I can correct for projector or room lighting conditions.
    * **AC E5.S7.1:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders) for adjusting the global brightness of the display stage.
    * **AC E5.S7.2:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders) for adjusting the global contrast of the display stage.
    * **AC E5.S7.3:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders) for adjusting the global saturation of the display stage.
    * **AC E5.S7.4:** Adjusting these controls updates the corresponding CSS filters (`brightness()`, `contrast()`, `saturate()`) applied to the display stage element in real-time.
    * **AC E5.S7.5:** These color filter adjustments are applied regardless of whether the user is in "Projection Setup Mode".
8.  **Story:** As a User with advanced needs (when the advanced panel is visible), I want a control to toggle a test card overlay so that I can easily calibrate projection mapping and other visual settings against a reference pattern.
    * **AC E5.S8.1:** Given the advanced controls panel is visible, there is a clearly labeled control (e.g., a button) to toggle the visibility of a test card overlay.
    * **AC E5.S8.2:** When the test card toggle is activated, a predefined test card image/pattern is displayed as an overlay on the stage. Activating it again hides the overlay.
    * **AC E5.S8.3:** The test card overlay is positioned and scaled to perfectly match the dimensions and currently applied transformations of the display stage (respecting aspect ratio and warping).
    * **AC E5.S8.5:** **The test card overlay respects the idle UI hiding mechanism defined in the core UI specs.** When the UI is idle, the test card is hidden; it reappears when the UI becomes active again.
9.  **Story:** As a User with advanced needs (when the advanced panel is visible), I want controls to set the number of seconds to skip from the start and end of videos (revisiting Epic 2 logic) so that I have fine-grained control over video segment selection points.
    * **AC E5.S9.1:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders or input fields) for setting the "skip start" duration for videos (as described in E2.S4).
    * **AC E5.S9.2:** Given the advanced controls panel is visible, there are clearly labeled controls (e.g., sliders or input fields) for setting the "skip end" duration for videos (as described in E2.S5).
    * **AC E5.S9.3:** Adjusting these controls updates the internal settings used by the video segment selection logic (as per E2.S4 and E2.S5 ACs).
    * **AC E5.S9.4:** These video skip offset controls are accessible when the advanced panel is visible, regardless of whether the user is in "Projection Setup Mode".
10. **Story:** As the Application, all settings exposed in the advanced UI panels (projection, filters, aspect ratio, video skip offsets) AND the UI state (advanced panel visible/hidden, projection mode active/inactive) must be automatically saved to and loaded from `localStorage` (leveraging Epic 4 persistence) so that advanced configurations and UI state persist across sessions.
    * **AC E5.S10.1:** Given a setting controlled in the advanced UI (e.g., aspect ratio choice, warp points, scale/translate/rotate values, color filter values, video skip offsets) is changed, then its new value is automatically saved to `localStorage`.
    * **AC E5.S10.2:** Given the visibility of the advanced panel changes (via E5.S2), its new state (visible/hidden) is automatically saved to `localStorage`.
    * **AC E5.S10.3:** Given the active state of "Projection Setup Mode" changes (via E5.S3), its new state (active/inactive) is automatically saved to `localStorage`.
    * **AC E5.S10.4:** Given the application starts, saved advanced settings AND UI states (panel visible/hidden, projection mode active/inactive) are found in `localStorage`, then these are loaded and applied to the internal state, the UI controls, and the UI panel/mode visibility *before* playback begins.
    * **AC E5.S10.5:** If no saved advanced settings or UI states are found in `localStorage` on startup, the application uses default values for settings and defaults to the advanced panel hidden and Projection Mode inactive (as per E5.S1).
11. **Story:** As a User, I want a button to easily toggle application fullscreen mode for a more immersive experience.
    * **User Story Statement:** As a User, I want an easily accessible button to enter and exit application fullscreen mode so that I can quickly switch to an immersive viewing experience or return to a windowed mode as needed.
    * **AC E5.S11.1 (Button Presence & Appearance):** Given the UI drawer is visible, a clearly identifiable fullscreen toggle button (e.g., an icon with a dynamic tooltip like 'Enter Fullscreen' / 'Exit Fullscreen') is present and easily accessible (e.g., near the top of the drawer).
    * **AC E5.S11.2 (Enter Fullscreen Functionality):** When the application is not in fullscreen mode and the user activates the 'Enter Fullscreen' button, the application attempts to enter browser fullscreen mode.
    * **AC E5.S11.3 (Exit Fullscreen Functionality):** When the application is in fullscreen mode and the user activates the 'Exit Fullscreen' button, the application attempts to exit browser fullscreen mode.
    * **AC E5.S11.4 (State Synchronization - Button State Reflects Actual Fullscreen):** The visual state of the fullscreen toggle button (e.g., its icon and tooltip) accurately reflects the application's actual current fullscreen status.
    * **AC E5.S11.5 (State Synchronization - External Changes Update Button):** If the user enters or exits fullscreen mode using browser-native controls (e.g., F11 key, browser's View menu, or the ESC key to exit fullscreen), the state of the application's fullscreen toggle button updates automatically to reflect the new actual fullscreen status.


## Relevant Research (Optional)

This project was born from a real-world need at the "Bum Bum Tam Tam" party and validated with a prototype, making extensive upfront market research less critical for the MVP.

(END Checklist START Design Architect UI/UX Specification Mode Prompt)

## Prompt for Design Architect (UI/UX Specification Mode)

**Objective:** Elaborate on the UI/UX aspects of the product defined in this PRD.
**Mode:** UI/UX Specification Mode
**Input:** This completed PRD document, particularly focusing on Sections 3 (Target Audience/Users) and 4 (Key Features/Scope - MVP), especially the UI/UX points.
**Key Tasks:**

1. Review the product goals, user stories, and any UI-related notes herein.
2. Collaboratively define detailed user flows, wire-frames (conceptual), and key screen mockups/descriptions, especially for the minimalist UI overlay, advanced controls panel, and Projection Setup Mode interface.
3. Specify usability requirements and accessibility considerations (to the extent applicable for a non-commercial desktop tool).
4. Consider visual design principles for the minimalist UI and text overlays.
5. Populate or create the `front-end-spec-tmpl` document based on these specifications.
6. Ensure that this PRD is updated or clearly references the detailed UI/UX specifications derived from your work, so that it provides a comprehensive foundation for subsequent architecture and development phases.

Please guide the user through this process to enrich the PRD with detailed UI/UX specifications.

## Initial Architect Prompt

**Objective:** Review this PRD and the defined Epics/Stories to propose a detailed technical implementation plan and address any remaining architectural questions or risks.
**Mode:** Architecture Mode
**Input:** This completed PRD document, including the Epics, Stories, and Acceptance Criteria.
**Key Tasks:**

1. Review the PRD thoroughly, ensuring understanding of all functional and non-functional requirements.
2. Analyze the defined Epics, Stories, and Acceptance Criteria for completeness, feasibility, and potential technical challenges.
3. Address the open architectural questions, particularly regarding rendering implementation details (HTML vs. Canvas trade-offs) and codebase modularity/structure.
4. Propose a detailed technical design or implementation approach for the defined Epics/Stories, considering the agreed-upon Vanilla JS + ES Modules architecture and use of Maptastic/FileSystemAccessAPI.
5. Identify any new or confirm existing technical risks and propose mitigation strategies.
6. Refine the conceptual file structure as needed based on implementation considerations.
7. Prepare for handoff to the Developer agent by outlining clear development tasks based on the stories and technical design.

Please review this PRD and prepare your architectural plan and recommendations based on the requirements and technical preferences outlined.

(END Architect Prompt)