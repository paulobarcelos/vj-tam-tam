# Known Technical Constraints or Preferences

- **Constraints:**
  - **Timeline:** Unspecified - project is for fun/learning.
  - **Budget:** Zero - open-source, community-driven potential.
  - **Platform:** Desktop browsers only (no explicit mobile support planned).
  - **Connectivity:** Offline-first after initial load (no backend server dependencies for core function).
  - **User Management:** No user accounts; all state saved locally via `localStorage`.
- **Preferences:**
  - **Frontend Stack:** Pure Vanilla JS + ES Modules (no frameworks).
  - **Rendering:** HTML/CSS for the stage (`<div>` based) rather than Canvas for core media display.
  - **Key Libraries:** Maptastic (local copy in `lib/`) for projection warping; native `FileSystemAccessAPI` for file handling.
  - **Code Structure:** Modular (`core.js`, `mapping.js`, `ui.js` in `src/`), flat directory tree at repo root, `docs/` for specifications. Avoid over-engineering (e.g., minimal functional style over classes).
  - **Deployment:** GitHub Pages.
  - **Analytics/Tracking:** Zero analytics or tracking.
- **Risks:**
  - Browser security restrictions impacting `FileSystemAccessAPI` persistence across sessions.
  - Performance issues with rendering large media files or complex projection transforms/CSS filters, especially on older hardware.
- **User Preferences (Specific/Non-Feature):**

  - Preference for functional programming style over classes in JS where feasible.
  - Desire for minimal, elegant code structure.
  - Requirement for console logs to be preserved (not suppressed) for debugging.

- **Technical Assumptions:**
  The following initial technical preferences and considerations have been noted:
  - **Rendering Approach:**
    - The initial preference is for **HTML/CSS** for rendering the main visual display stage, rather than Canvas. This choice is aimed at leveraging better text rendering capabilities and simpler media handling. It's acknowledged that this might limit visual effects to what CSS filters can provide, without pixel-level control.
  - **Key Libraries:**
    - **Maptastic.js** is identified as a key library for implementing projection warping features. It's anticipated this will be included as a local copy (e.g., in `lib/maptastic.js`).
  - **Code Structure & Deployment:**
    - The project is intended for deployment via **GitHub Pages**, suggesting a client-side heavy application with no complex backend.
    - Application files (e.g., `index.html`, `src/`, `lib/`, `assets/`) are planned to reside in the **`/app` folder** to facilitate straightforward GitHub Pages deployment via the `gh-pages` branch.
    - **Deployment Process:** Use `npm run publish` to deploy the `/app` folder contents to the `gh-pages` branch, which is served by GitHub Pages.
    - JavaScript development will utilize **ES Modules**.
    - A **flat directory tree** is preferred within the `src/` directory (e.g., containing modules like `core.js`, `mapping.js`, `ui.js`).
    - A guiding principle is to **avoid over-engineering** where possible (e.g., use classes only if critically necessary, favoring a functional programming style otherwise).
  - **Initial High-Level File Structure Envisioned:**
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
