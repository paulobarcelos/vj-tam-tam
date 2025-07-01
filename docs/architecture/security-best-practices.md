# Security Best Practices

This section outlines key security considerations relevant to the VJ Tam Tam client-side application. These practices must be actively addressed by AI agents and human developers during development to ensure a safe user experience.

## Input Sanitization & Validation

- **Text Overlay Input:**
  - **Action:** When rendering text overlays, ensure that HTML entities are escaped by default (e.g., by setting `textContent` of an element rather than `innerHTML`).
- **User Settings Input:**
  - **Action:** Implement client-side validation for all user-configurable settings. Parsed values from `localStorage` should also be validated on load.

## Output Encoding

- **Text Overlays:**
  - **Action:** Primarily use `element.textContent = userText;` for placing text into DOM elements. Avoid `element.innerHTML = userText;`.
- **Dynamic Content in UI:** Any other dynamic data displayed in the UI should also use `textContent`.

## Secrets Management

- **No Application Secrets:** VJ Tam Tam is a purely client-side application.
- **`localStorage`:**
  - **Action:** Do not store any sensitive personal information in `localStorage`. Current usage is considered non-sensitive.

## Dependency Security

- **Maptastic.js (Locally Hosted):**
  - **Action:** The specific version should be noted and not changed without consideration.
- **NPM Development Dependencies:**
  - **Action:** Regularly update development dependencies (`npm audit`). These do not become part of the deployed application.

## Browser API Security

- **`FileSystemAccessAPI`:**
  - **Action:** Handle permission denials gracefully. Use handles only for reading media.
- **`localStorage`:**
  - **Action:** Handle potential `QuotaExceededError` exceptions (see Section 14.1).
- **Fullscreen API:**
  - **Action:** Ensure fullscreen mode is only triggered by direct user interaction.

## File Handling Security

- **Client-Side Processing:** All media files are processed client-side.
- **File Type Validation:**
  - **Action:** Rely on browser's native capabilities for rendering media. Do not execute file content.
- **Displaying File Information:** Use `textContent` if displaying filenames.

## DOM Security

- **`innerHTML` vs. `textContent`:**
  - **Action:** Strongly prefer `element.textContent`.
- **CSS Injection:** Avoid dynamic CSS string construction.

## Error Handling & Information Disclosure

- **Action:** Ensure user-facing error messages are generic. Detailed errors to console (see Section 14).

## Regular Security Reviews/Audits

- **Action:** Periodically review code for potential security oversights. Manual code review is the primary approach.
