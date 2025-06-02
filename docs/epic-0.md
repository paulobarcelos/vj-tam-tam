### Epic 0: Developer Environment & Project Setup

_Goal: To establish a fully functional and verifiable local development environment, ensuring all required tooling and third-party libraries are correctly installed and configured as per the architecture document._

1.  **Story:** As a Developer, I want to run a single command to install all required development tooling so that I can quickly set up my local environment for testing, linting, and formatting.

    - **AC 1.1:** Given the project is cloned and includes a `package.json` file, when I run `npm install` in the project root, the command completes successfully.
    - **AC 1.2:** After the command completes, a `node_modules` directory exists in the project root, containing the development dependencies specified in `package.json` (such as Vitest, ESLint, Prettier).
    - **AC 1.3:** After installation, I can successfully execute the predefined npm scripts in `package.json` (e.g., `npm test`, `npm run lint`).

2.  **Story:** As a Developer, I need to manually download the `Maptastic.js` library and place it in the correct project directory so that it is available for the application's projection mapping features.
    - **AC 2.1:** The JavaScript library file is downloaded from the official repository URL: `https://github.com/glowbox/maptasticjs/blob/master/build/maptastic.min.js`.
    - **AC 2.2:** The downloaded file is renamed to `maptastic.js` and placed inside the `/lib/` directory at the project root.
    - **AC 2.3:** The final path to the file is exactly `./lib/maptastic.js`, as specified in the project structure.
