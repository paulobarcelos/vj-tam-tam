# Epic 5: Persistence & Basic Settings

_Goal: Implement saving and loading of user configurations and media/text pools using `localStorage`, ensuring the application state persists across sessions._

1.  **Story:** As the Application, I want to automatically save user-configurable settings (like segment duration range, text frequency, video skip offsets) to `localStorage` whenever a setting is changed so that the user's preferences are remembered across sessions.
    - **AC E6.S1.1:** Given a user setting that is intended to be persistent (e.g., min/max segment duration, text frequency, video skip start/end, advanced UI visible state, projection mode state) is changed via its UI control, then the new value of that setting is immediately saved to `localStorage` under a predictable key structure (e.g., `vjtamtam.settings.minDuration`).
    - **AC E6.S1.2:** All persistent user settings are stored within a single, structured object or related keys in `localStorage` to keep the data organized.
    - **AC E6.S1.3:** Saving to `localStorage` is done asynchronously if the operation could potentially block the main thread, or confirmation is provided that `localStorage` operations are non-blocking in modern browsers for typical data sizes.
    - **AC E6.S1.4:** If saving to `localStorage` fails (e.g., storage quota exceeded), a toast notification appears informing the user that settings could not be saved.
2.  **Story:** As the Application, I want to load saved user settings from `localStorage` when the application starts so that the user's last configuration is automatically applied without requiring manual setup.
    - **AC E6.S2.1:** Given the application starts in a browser where VJ Tam Tam has been previously used and settings were saved to `localStorage`, then the application reads the saved settings on load.
    - **AC E6.S2.2:** The application applies the loaded settings to the corresponding internal state variables and UI controls (if the UI is visible) before playback begins.
    - **AC E6.S2.3:** If no settings are found in `localStorage` on startup, the application uses the default values for all settings.
    - **AC E6.S2.4:** Loading from `localStorage` does not cause any visual delay or blocking of the initial application render.
    - **AC E6.S2.5:** If loading from `localStorage` fails for any reason (e.g., corrupted data), the application uses default values and potentially logs an error to the console.
3.  **Story:** As the Application, I want to attempt to save references to the user's selected media files using the `FileSystemAccessAPI` (if available) so that the media pool can potentially be reloaded automatically on startup.
    - **AC E6.S3.1:** Given the browser supports the `FileSystemAccessAPI` and the user has added files/folders via the picker or drag-and-drop, then the application obtains the necessary `FileSystemFileHandle` or `FileSystemDirectoryHandle` for each selected item.
    - **AC E6.S3.2:** The application serializes these file/directory handles into a format suitable for storage (as allowed by the API, typically just the handles themselves can be stored directly in `localStorage`).
    - **AC E6.S3.3:** The serialized file/directory handles are saved to `localStorage` under a dedicated key (e.g., `vjtamtam.media.handles`) whenever the media pool is updated (files added or cleared).
    - **AC E6.S3.4:** If the browser does _not_ support `FileSystemAccessAPI`, the application skips saving file handles and logs a note to the console indicating that media persistence is not available.
4.  **Story:** As the Application, if loadable file references exist in `localStorage` and the browser supports `FileSystemAccessAPI`, I want to automatically load the associated media files into the pool when the application starts so that the user's media is ready without re-selection.
    - **AC E6.S4.1:** Given the application starts, the browser supports `FileSystemAccessAPI`, and saved file/directory handles are found in `localStorage`, then the application attempts to retrieve the corresponding `File` or `Directory` objects from these handles.
    - **AC E6.S4.2:** The application recursively reads supported media files from the re-obtained handles (similar logic to initial file input).
    - **AC E6.S4.3:** Successfully loaded media files are added to the application's media pool on startup.
    - **AC E6.S4.4:** The application handles potential user permissions requests from the browser if re-accessing handles requires it. If permission is granted, loading continues; if denied, proceed as per AC E6.S5.2.
5.  **Story:** As the Application, if file references cannot be loaded or re-accessed (e.g., browser limitation, user moved/deleted files), I want to handle this gracefully by starting with an empty media pool but still loading saved settings, potentially indicating that previous media could not be loaded via a toast notification, so that the application doesn't appear broken.
    - **AC E6.S5.1:** Given the application starts, but either the browser does not support `FileSystemAccessAPI` OR no saved file handles are found in `localStorage`, then the media pool starts empty. Saved settings are still loaded (as per E5.S2).
    - **AC E6.S5.2:** Given the application starts, saved file handles _are_ found, and the browser _does_ support the API, but the application fails to re-obtain the files from the handles (e.g., files moved/deleted, user denied permission request), then the media pool starts empty. Saved settings are still loaded (as per E5.S2).
    - **AC E6.S5.3:** In the scenario described in AC E6.S5.2 (failed attempt to load persisted media), a toast notification appears informing the user that previously selected media could not be reloaded and they need to select files again.
6.  **Story:** As a User, I want a visible control (e.g., a button in the UI) to clear all currently loaded media from the pool so that I can easily remove all files and start fresh or add a completely new set.
    - **AC E6.S6.1:** Given the UI is visible and the media pool is not empty, there is a clearly labeled control (e.g., a "Clear Media" or "Reset Files" button) to remove all media.
    - **AC E6.S6.2:** When the user activates the "Clear Media" control, all media items are removed from the application's current media pool.
    - **AC E6.S6.3:** Activating the "Clear Media" control immediately stops playback if it was active and the pool becomes empty.
    - **AC E6.S6.4:** After clearing, the media pool remains empty until the user adds new media.
7.  **Story:** As the Application, when the user clears the media pool, I want to remove all media references and settings related to the media pool from `localStorage` so that the pool is empty on the next load.
    - **AC E6.S7.1:** Given the user activates the "Clear Media" control (AC E6.S6.2), then any saved file/directory handles for media in `localStorage` are removed or the corresponding `localStorage` key is cleared (`vjtamtam.media.handles`).
    - **AC E6.S7.2:** After clearing media and its references from `localStorage`, if the application is reloaded, the media pool starts empty (unless new files are added).
8.  **Story:** As the Application, when the user clears the text pool (using the control from Epic 4), I want to remove all text entries from `localStorage` so that the pool is empty on the next load.
    - **AC E6.S8.1:** Given the user activates the "Clear All Text" control (from Epic 4), then all saved text entries in `localStorage` are removed or the corresponding `localStorage` key is cleared (e.g., `vjtamtam.text.entries`).
    - **AC E6.S8.2:** After clearing text entries from `localStorage`, if the application is reloaded, the text pool starts empty.
