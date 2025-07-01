# Overall Testing Strategy

This section outlines the project's comprehensive testing strategy. With the adoption of `npm` for development-time tooling, we can leverage command-line test runners for automated unit and integration tests, while still emphasizing manual testing for UI and E2E validation, given the "no build process" for the application itself.

## Testing Tools & Philosophy

- **Core Philosophy:** Utilize a command-line JavaScript test runner for automated testing of logic and module integration in a Node.js environment or simulated DOM (JSDOM). The application code itself remains Vanilla JS for direct browser execution. Manual testing remains crucial for UI-heavy aspects and E2E flows.
- **Primary Test Runner (Proposed):**
  - **Technology:** Vitest.
  - **Version:** Latest stable.
  - **Description / Purpose:** A fast and modern test framework with a Jest-compatible API. It will be used for running unit and integration tests from the command line.
  - **Justification:** Offers speed, a familiar API, good support for ES Modules, and can run tests in a Node.js environment or with JSDOM for DOM-related testing without a full browser. It will be installed as a dev dependency via `npm`.
- **Test Environment for DOM:**
  - **Technology:** JSDOM.
  - **Description / Purpose:** A JavaScript-based implementation of web standards, used by Vitest to simulate a browser environment for testing DOM manipulation and browser-like APIs without needing a full browser.
- **Manual Testing:** Remains a significant component for E2E, usability, and visual verification. Structured manual test plans and exploratory testing are key.
- **Browser Developer Tools:** Essential for debugging E2E manual tests and verifying behavior directly in the browser.
- **Execution:** Automated tests will be run via `npm` scripts defined in `package.json` (e.g., `npm test`, `npm run test:unit`, `npm run test:integration`).

## Unit Tests

- **Scope:** Test individual JavaScript functions, methods, and modules in isolation. Focus on business logic (e.g., in `playbackEngine.js`, `stateManager.js`), utility functions, and data transformations.
- **Location & Naming:** Test scripts (e.g., `playbackEngine.test.js` or `playbackEngine.spec.js`) will be co-located with the source files they test or in a `__tests__` subdirectory within the module's folder (e.g., `src/playbackEngine/__tests__/playbackEngine.test.js`).
- **Mocking/Stubbing:** Utilize Vitest's built-in mocking capabilities (`vi.mock()`, `vi.fn()`, `vi.spyOn()`) to isolate units under test and mock dependencies, including browser APIs like `localStorage` where necessary for a Node.js/JSDOM environment. For Maptastic.js, mock implementations of its API can be created.
- **Execution:** Run from the command line via an `npm` script.
- **AI Agent Responsibility:** The AI Agent developing a module must generate corresponding unit tests. Tests should cover public APIs, significant logic paths, edge cases, and error conditions.

## Integration Tests

- **Scope:** Test the interaction between several JavaScript modules. For example:
  - `uiManager.js` interaction with `stateManager.js` (can be tested with JSDOM if DOM interaction is involved).
  - `playbackEngine.js` interaction with `mediaProcessor.js` and `stateManager.js` (likely testable in Node.js environment).
  - `mappingManager.js` interaction with a mocked Maptastic.js facade and `stateManager.js`.
- **Location:** Integration tests will reside in a dedicated directory like `tests/integration/` or be named distinctively (e.g., `*.integration.test.js`) if co-located.
- **Environment:** Most integration tests should be designed to run in a Node.js environment using Vitest. For those requiring DOM APIs (e.g., testing `uiManager.js`'s DOM manipulations), Vitest will be configured to use JSDOM.
- **AI Agent Responsibility:** The AI Agent may be tasked with generating integration tests for key interactions between modules.

## End-to-End (E2E) Tests

- **Scope:** Validate complete user flows and critical paths through the live application running in an actual browser (from a local static server). This remains critical.
  - Adding and clearing media.
  - Adding and clearing text overlays, adjusting frequency.
  - Changing segment durations.
  - Activating advanced controls, projection mode, and manipulating projection settings (warp, scale, etc.).
  - Toggling the test card.
  - Persistence of settings in `localStorage`.
  - Fullscreen toggle functionality.
- **Tools:**
  - **Primarily Manual:** Structured E2E test cases documented (e.g., in `docs/manual-tests.md`).
  - **Browser Automation (Exploratory):** Remains an exploratory TBD item if a very lightweight, "no build process for app" compatible tool can be found. The introduction of `npm` for dev tools might make it slightly easier to integrate a more standard E2E tool like Playwright or Cypress _for the testing process itself_, but this would be a significant addition to the dev stack and needs careful consideration against the project's desire for simplicity. For MVP, focus is on manual.
- **AI Agent Responsibility:** Generate steps for manual E2E test cases.

## UI & Visual Regression Testing

- **Approach:** Primarily manual, visual inspection against `VJ-Tam-Tam-UI-UX-Spec.md`.
- **Test Card:** Key tool for manual verification of projection mapping.

## Test Coverage

- **Target:** Aim for high unit test coverage for business logic and utility modules. Vitest can generate coverage reports. The goal is not just a number, but meaningful tests.
- **Measurement:** Use Vitest's coverage reporting capabilities (e.g., via `c8` or `istanbul`). An `npm` script like `npm run coverage` will be configured.

## Mocking/Stubbing Strategy (General)

- Utilize Vitest's comprehensive mocking features.
- For browser-specific APIs not fully supported by JSDOM in certain contexts, provide manual mocks if necessary (e.g., a simplified mock for `FileSystemAccessAPI` if its direct usage is tested at an integration level that doesn't involve full E2E interaction).

## Test Data Management

- **Unit/Integration Tests:** Test data defined directly within test scripts or imported from small, co-located JSON files.
- **Manual E2E Tests:** Consistent set of local media files. `assets/test-card.png` remains a key asset.
