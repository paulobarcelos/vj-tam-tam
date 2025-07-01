# Error Handling Strategy

This section details the strategy for handling errors within the VJ Tam Tam client-side application. The primary goals are to ensure application stability, prevent data corruption in `localStorage`, and provide informative feedback to the user without disrupting the core visual experience.

## General Approach

- **Exception Handling:** Standard JavaScript `try...catch` blocks will be used to handle anticipated errors in potentially problematic operations (e.g., parsing `localStorage` data, interacting with `FileSystemAccessAPI`, processing media files).
- **Error Objects:** Native JavaScript `Error` objects (e.g., `Error`, `TypeError`, `RangeError`) will be utilized. Custom error objects may be simple Plain Old JavaScript Objects (POJOs) if more specific error information needs to be conveyed internally, but complex custom error class hierarchies will be avoided to maintain simplicity.
- **User Feedback:**
  - **Non-Critical Errors:** For non-critical issues (e.g., an unsupported file type is dropped, a setting cannot be saved to `localStorage` due to quota issues, a previously saved file via `FileSystemAccessAPI` cannot be re-accessed), a brief, non-intrusive toast notification will be displayed to the user as per the PRD. The application will attempt to continue functioning.
  - **Critical Errors:** For unexpected errors that might compromise the application's state or core functionality, a more prominent message might be logged to the console, and in severe cases, the application might need to guide the user to refresh or reset. However, the aim is graceful degradation wherever possible.
- **Graceful Degradation:** If a non-essential feature encounters an error (e.g., loading a specific setting), the application will attempt to fall back to default behavior for that feature and continue operating.

## Logging

- **Library/Method:** Primarily, the native browser `console` object (`console.error()`, `console.warn()`, `console.log()`) will be used for logging. This aligns with the technical preference for preserving console logs for debugging.
- **Format:** Logs will be plain text. To aid debugging, logs should ideally include:
  - A timestamp (can be manually prepended or using `console.timeStamp()`).
  - The name of the module/function where the error occurred.
  - A descriptive error message.
  - Relevant contextual data (e.g., variable values), ensuring no excessively large objects are logged directly.
- **Levels:**
  - `console.error()`: For actual errors that have been caught or that indicate a significant problem.
  - `console.warn()`: For potential issues, deprecated API usage, or minor recoverable errors.
  - `console.log()` / `console.debug()`: For general debugging information during development (should be minimal in production-intended code, though with no build process, these might remain).
- **Context:** Log messages should provide enough context to understand the state of the application or module when the error occurred. For example, if a `localStorage` parsing error occurs, log the key that failed.

## Specific Handling Patterns

- **External API Calls:**
  - Not applicable. VJ Tam Tam does not consume any external web/network APIs.
- **Internal Errors / Business Logic Exceptions:**
  - **JavaScript Runtime Errors:** These will be caught by `try...catch` blocks where appropriate, particularly around external data handling (like `localStorage` or file processing). Uncaught errors will typically halt script execution in the current context but should not crash the entire browser tab if possible.
  - **`localStorage` Operations:**
    - Quota Exceeded: When writing to `localStorage` (e.g., saving settings, media handles), operations will be wrapped in `try...catch`. If a `QuotaExceededError` (or similar) occurs, a toast notification will inform the user that settings could not be saved. The application will continue with its current in-memory state.
    - Parsing Errors: When reading and parsing JSON data from `localStorage` (e.g., on application load), `JSON.parse()` will be in a `try...catch` block. If parsing fails, the application will default to initial settings for that piece of data and log an error to the console.
  - **`FileSystemAccessAPI` Operations:**
    - Permissions: User denial of permission will be handled gracefully; the application will continue without the persisted media but should notify the user via a toast.
    - File Not Found/Access Errors (on reload): If previously stored handles are invalid, a toast will inform the user, and the application will start with an empty media pool.
  - **Media Processing:**
    - Unsupported File Types: Already specified in the PRD (Epic 1, Stories 1 & 2) to show a toast notification and ignore the file.
    - Corrupted Files / Playback Errors: If a loaded media file cannot be played by the browser's `<video>` or `<img>` element, the application should attempt to skip to the next media item and log an error to the console. A toast might inform the user if this happens repeatedly for a specific file.
  - **Maptastic.js Integration:** Errors originating from Maptastic.js (if any are exposed or catchable) should be logged to the console. The UI controls related to Maptastic should have their own input validation to prevent sending invalid data to the library.
- **Transaction Management:**
  - Not applicable in the traditional database sense. For `localStorage`, each setting or data piece is typically saved individually. If a group of settings needs to be saved "atomically," they would be part of a single object serialized to `localStorage`. If saving this single object fails, the previous state (if any) in `localStorage` would remain, and the application's in-memory state would hold the newer, unsaved values.
