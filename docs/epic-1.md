### Epic 1: Foundational Playback & Media Input

_Goal: Establish the basic application structure, enable drag-and-drop/file picker, and create the core engine for playback of full media files._

1.  **Story:** As a User, I want to be able to drop image and video files/folders onto the application window so that I can easily load my media.
    - **AC 1.1:** Given I am on the VJ Tam Tam page, when I drag one or more image files (JPG, PNG, GIF, HEIC, WebP) from my file system and drop them anywhere onto the application window, then the application processes these files for playback.
    - **AC 1.2:** Given I am on the VJ Tam Tam page, when I drag one or more video files (MP4, MOV, WebM) from my file system and drop them anywhere onto the application window, then the application processes these files for playback.
    - **AC 1.3:** Given I am on the VJ Tam Tam page, when I drag a folder containing supported image and/or video files from my file system and drop it anywhere onto the application window, then the application recursively finds and processes all supported files within that folder.
    - **AC 1.4:** Given I am on the VJ Tam Tam page, when I drag a file type that is _not_ supported (e.g., a `.txt` or `.pdf` file) and drop it, then the application ignores this file **AND a toast notification appears indicating that the file type is not supported and listing the supported types (JPG, PNG, GIF, HEIC, WebP, MP4, MOV, WebM).**
    - **AC 1.5:** Given I am on the VJ Tam Tam page, when I drag files/folders, then the application window provides a visual indication (e.g., a border change or overlay) that it is a valid drop target.
2.  **Story:** As a User, I want to be able to select image and video files/folders using a standard file picker dialog so that I have an alternative way to load my media if drag-and-drop is inconvenient.
    - **AC 2.1:** Given I am on the VJ Tam Tam page, when I click on a designated area or button for selecting files, then a standard operating system file picker dialog opens.
    - **AC 2.2:** Given the file picker is open, when I select one or more supported image files (JPG, PNG, GIF, HEIC, WebP) and confirm the selection, then the application processes these files for playback.
    - **AC 2.3:** Given the file picker is open, when I select one or more supported video files (MP4, MOV, WebM) and confirm the selection, then the application processes these files for playback.
    - **AC 2.4:** Given the file picker is open, when I select a folder containing supported image and/or video files and confirm the selection, then the application recursively finds and processes all supported files within that folder.
    - **AC 2.5:** Given the file picker is open, when I select a file type that is _not_ supported and confirm, then the application ignores this file **AND a toast notification appears indicating that the file type is not supported and listing the supported types.**
    - **AC 2.6:** Given the file picker is open, when I cancel the selection, then the picker closes, and the application state remains unchanged with no error message displayed.
3.  **Story:** As the Application, I want to add newly dropped/selected files to the existing media pool, rather than replacing it, so that users can build their media collection incrementally.
    - **AC 3.1:** Given the media pool is empty, when I drop/select one or more supported files/folders, then the media pool is populated with the valid files from my selection.
    - **AC 3.2:** Given the media pool already contains media, when I drop/select additional supported files/folders, then the new valid files from my selection are added to the _existing_ media pool. The previously loaded media remains in the pool.
    - **AC 3.3:** Given the media pool has been updated by adding new files, when playback is active, the new media becomes eligible for random selection and display alongside the older media.
4.  **Story:** As the Application, I want to display the selected images and videos fullscreen, filling the entire browser window without distorting aspect ratio (like `background-size: cover` in CSS), so that the visuals create an immersive backdrop.
    - **AC 4.1:** Given the application is displaying an image from the media pool, then the image element is positioned and sized to fill the entire display area while maintaining its original aspect ratio, cropping as necessary.
    - **AC 4.2:** Given the application is displaying a video from the media pool, then the video element is positioned and sized to fill the entire display area while maintaining its original aspect ratio, cropping as necessary.
    - **AC 4.3:** Given the application is displaying media fullscreen, when the browser window is resized, then the displayed media immediately adapts to fill the new window dimensions while maintaining aspect ratio (cover behavior).
5.  **Story:** As the Application, I want to initiate playback automatically once media is loaded so that the user sees results instantly without needing to press a 'Play' button.
    - **AC 5.1:** Given the application has loaded in the browser and the media pool is populated (either from a new drop/selection or from `localStorage` persistence), then playback of media from the pool begins automatically without any user interaction.
    - **AC 5.2:** Given playback has started automatically, it continues without interruption until the browser tab is closed or the media pool is cleared.
6.  **Story:** As a Developer, I want to reorganize the project structure by moving core application files to an `/app` folder so that the repository has clean separation between application code and project management files.
    - **AC 6.1:** Given the current project structure with `index.html`, `assets/`, `lib/`, and `src/` at the repository root, when I reorganize the structure, then these files are moved to a new `/app` folder.
    - **AC 6.2:** Given the files have been moved to `/app`, when I configure GitHub Pages deployment, then it points to the `/app` folder as the source directory.
    - **AC 6.3:** Given the new structure is in place, when I run the application locally or via GitHub Pages, then all functionality works identically to before the reorganization.
    - **AC 6.4:** Given the reorganization is complete, when I update any configuration files (package.json, .gitignore, etc.), then they reflect the new `/app` folder structure.
7.  **Story:** As a Developer, I want to centralize all media type constants (MIME types and file extensions) in a shared module so that media validation is consistent across the application and eliminates code duplication.
    - **AC 7.1:** Given media type definitions are currently scattered across multiple files, when I create a centralized constants module, then all supported image and video MIME types and extensions are defined in a single `src/constants/mediaTypes.js` file.
    - **AC 7.2:** Given the centralized constants exist, when any module needs to validate or check media types, then it imports and uses the shared constants instead of defining its own.
    - **AC 7.3:** Given the refactoring is complete, when I search the codebase for hardcoded media type strings, then no duplicates exist outside the centralized constants file.
    - **AC 7.4:** Given the centralized constants are in use, when all tests are run, then they pass with the new shared validation logic.
8.  **Story:** As a Developer, I want to create shared utility functions for common operations (filtering, validation, etc.) so that code duplication is eliminated and maintainability is improved.
    - **AC 8.1:** Given filtering and validation logic is currently duplicated across modules, when I create shared utility functions, then common operations are centralized in `src/utils/` modules.
    - **AC 8.2:** Given utility functions exist, when modules need to perform common operations (like media filtering or validation), then they import and use the shared utilities instead of implementing their own versions.
    - **AC 8.3:** Given the refactoring is complete, when I analyze the codebase, then no duplicate utility logic exists across different modules.
    - **AC 8.4:** Given shared utilities are implemented, when all tests are run, then they pass and demonstrate that the utilities work correctly across different contexts.
9.  **Story:** As a Developer, I want to centralize all user-facing strings (UI text, error messages, tooltips) in a shared constants module so that UI copy can be maintained in one place and the application is prepared for future internationalization.
    - **AC 9.1:** Given UI strings are currently scattered throughout the codebase, when I create a centralized strings module, then all user-facing text is defined in `src/constants/strings.js`.
    - **AC 9.2:** Given the centralized strings exist, when any module needs to display user-facing text, then it imports the appropriate string from the centralized module instead of using hardcoded strings.
    - **AC 9.3:** Given the refactoring is complete, when I need to update UI copy, then I can make the change in a single location and it reflects throughout the application.
    - **AC 9.4:** Given centralized strings are in use, when all tests are run, then they pass and display the correct text from the centralized source.
10. **Story:** As the Application, I want to cycle through the full images and videos in the media pool (initially just showing each for a duration, segments come later) so that the basic visual stream is established.
    - **AC 10.1:** Given playback is active and the media pool is not empty, then the application randomly selects a media item from the pool.
    - **AC 10.2:** Given a media item is selected, it is displayed fullscreen using the 'cover' behavior (as per AC 4.x).
    - **AC 10.3:** Given an image is displayed, it remains visible for a fixed duration (e.g., 4 seconds - we'll make this configurable later).
    - **AC 10.4:** Given a video is displayed, it plays from its beginning to its end (or a fixed maximum duration if the video is very long - this will be refined in the next Epic).
    - **AC 10.4a:** When a video is played, its audio track should be muted.
    - **AC 10.5:** After the display duration for the current media item is complete (or the video finishes), the application immediately (hard cut) transitions to a _new_ randomly selected media item from the pool.
    - **AC 10.6:** The process of random selection and display continues indefinitely as long as the media pool is not empty.
11. **Story:** As a User, when the media pool is empty, I want to see an informative message guiding me on how to add media so that I know how to get started.
    - **AC 11.1:** Given the application loads and the media pool is empty (either initially or after clearing media), then a specific text message, like "Welcome to VJ Tam Tam, please drag and drop your photos and videos here, or click to browse, to start your performance", is displayed prominently on the stage area.
    - **AC 11.2:** When the user adds media to the empty pool, the welcome/instruction text disappears.
    - **AC 11.3:** The welcome/instruction text is styled clearly and centered on the stage.

---

## Epic 1 Dependencies & Implementation Notes

**Prerequisites for Epic 2:** Stories 1.6-1.9 (structural foundation) must be completed before Epic 2 development begins to ensure clean, maintainable code patterns.

**Implementation Priority:**
- **Sprint Blockers:** Stories 1.6-1.9 (structural improvements)
- **Epic Completion:** Stories 1.10-1.11 (final functionality)

**Story 1.5 Enhancement Note:** Story 1.5 delivered significant architectural enhancements beyond the original scope, including FileSystemAccessAPI integration and dual persistence strategies. These enhancements are documented in the story completion notes and should be reflected in updated PRD/Architecture documentation.
