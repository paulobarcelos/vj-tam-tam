# VJ Tam Tam Documentation Index

This index provides a central point of reference for all VJ Tam Tam project documentation.

## Core Project Documents

- [Product Requirements Document (PRD)](PRD.md) - Outlines the project's vision, goals, target audience, key features, and scope.
- [UI/UX Specification](UI-UX-Spec.md) - Details the user interface design, user experience flows, and visual guidelines.
- [Architecture Document](Architecture.md) - Describes the technical architecture, system design, and technology stack.

## Granular Documentation (Sharded)

### Epics (from PRD)

- [Epic 0: Developer Environment & Project Setup](epic-0.md) - Focuses on establishing the local development environment.
- [Epic 1: Foundational Playback & Media Input](epic-1.md) - Covers basic media loading and playback functionality.
- [Epic 2: Randomized Segment Playback](epic-2.md) - Details the implementation of random media segment playback.
- [Epic 3: Core UI/UX Implementation & Design System](epic-3.md) - Aligns UI implementation with design specifications and establishes design standards.
- [Epic 4: Text Overlay Experience](epic-4.md) - Describes the text overlay feature, including input, management, and display.
- [Epic 5: Persistence & Basic Settings](epic-5.md) - Outlines how user settings and application state are persisted.
- [Epic 6: Advanced Display & Projection Tools](epic-6.md) - Covers advanced features like projection mapping and color correction.

### UI/UX Design Specifications (from UI-UX-Spec)

- [UI Design Principles](ui-design-principles.md) - Core design philosophy, visual aesthetic, and interaction principles.
- [UI Layout Structure](ui-layout-structure.md) - Defines the stage and drawer panel positioning and behavior.
- [UI Interaction States](ui-interaction-states.md) - Details idle, active, advanced, and projection modes.
- [UI Component Specifications](ui-component-specifications.md) - Comprehensive component definitions including welcome state, drawer structure, and calibration interface.
- [UI User Flows](ui-user-flows.md) - Documents key user interaction flows for first-time users, media management, text overlays, and advanced features.
- [UI Responsive Behavior & Accessibility](ui-responsive-accessibility.md) - Covers responsive design and accessibility considerations.
- [UI Technical Implementation](ui-technical-implementation.md) - Technical implementation notes for state management, performance, and integration points.

### Architecture Details (from Architecture Document)

- [API Reference](api-reference.md) - Documents the browser APIs and local library APIs used by the application.
- [Component View](component-view.md) - Describes the architectural and design patterns adopted, and the main logical components of the application.
- [Data Models](data-models.md) - Defines the core data structures used within the application and persisted to `localStorage`.
- [Environment Variables & Configuration](environment-vars.md) - Details deployment and environment setup, as no runtime environment variables are used for this client-side application.
- [Infrastructure and Deployment Overview](infra-deployment.md) - Outlines the infrastructure, deployment strategy, and environment management.
- [Operational Guidelines](operational-guidelines.md) - Consolidates coding standards, testing strategy, error handling, and security best practices.
- [Project Structure](project-structure.md) - Details the folder and file organization of the project.
- [Sequence Diagrams](sequence-diagrams.md) - Illustrates key application workflows like initialization, media addition, and settings changes.
- [Technology Stack](tech-stack.md) - Lists the definitive technology choices for the project.
