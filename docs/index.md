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
- [Epic 3: Text Overlay Experience](epic-3.md) - Describes the text overlay feature, including input, management, and display.
- [Epic 4: Persistence & Basic Settings](epic-4.md) - Outlines how user settings and application state are persisted.
- [Epic 5: Advanced Display & Projection Tools](epic-5.md) - Covers advanced features like projection mapping and color correction.

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