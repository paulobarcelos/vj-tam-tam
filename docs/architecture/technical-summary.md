# Technical Summary

VJ Tam Tam's architecture is designed as a **client-side monolithic application** built primarily with **pure Vanilla JavaScript (ES Modules), HTML5, and CSS3**, adhering to a strict **no-build-process** requirement.
The architecture may leverage carefully selected, minimal, locally-hosted libraries for specific functionalities, such as state management, if they significantly enhance maintainability without introducing a build step.
Key architectural features include:

- A modular JavaScript structure to manage different aspects of the application: media handling, playback logic, user interface interactions, and advanced display/projection functionalities.
- Direct HTML/CSS rendering for the main visual display stage.
- Integration with **Maptastic.js** (hosted locally) for projection mapping capabilities. [cite: 6, 25]
- Utilization of the native **`FileSystemAccessAPI`** for persisting media file references where supported, with graceful fallbacks. [cite: 26]
- Comprehensive state persistence using **`localStorage`** for all user settings, UI states, and configurations. [cite: 27]
- A custom approach for internal state management and component communication, potentially augmented by minimal, no-build utility libraries. [cite: 28]
- Deployment via **GitHub Pages**, necessitating a simple, flat root directory structure. [cite: 29]
  The architecture prioritizes ease of use for the end-user, robust offline-first functionality after initial load, and adherence to the specific technical constraints outlined in the PRD, with the "no build process" being paramount. [cite: 30]
