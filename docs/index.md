# VJ Tam Tam Documentation Index

## Root Documents

### [Product Requirements Document (PRD)](./prd.md)

Complete product requirements document defining the VJ Tam Tam auto-VJ tool, including vision, goals, target audience, key features, technical constraints, and detailed epics with user stories and acceptance criteria.

### [Architecture Document](./architecture.md)

Comprehensive technical architecture document covering project structure, design patterns, component view, tech stack selections, testing strategy, coding standards, and deployment specifications.

### [UI/UX Specification](./ui-ux-spec.md)

Detailed user interface and user experience specification document defining the brutalist minimalism design system, interaction states, component specifications, user flows, and accessibility considerations.

## Architecture Documentation

Documents within the `architecture/` directory (sharded sections):

### [Introduction & Preamble](./architecture/introduction-preamble.md)

Project introduction and architectural overview explaining the core goals and technical approach.

### [Technical Summary](./architecture/technical-summary.md)

High-level technical summary of the VJ Tam Tam architecture and key design decisions.

### [High-Level Overview](./architecture/high-level-overview.md)

System overview with data flow diagrams and conceptual architecture.

### [Architectural Design Patterns](./architecture/architectural-design-patterns-adopted.md)

Design patterns adopted for the project including Module Pattern, Observer Pattern, and Facade Pattern.

### [Component View](./architecture/component-view.md)

Detailed component architecture showing system modules and their relationships.

### [Project Structure](./architecture/project-structure.md)

File and directory organization for the production application and development environment.

### [API Reference](./architecture/api-reference.md)

Browser APIs and library integrations used by the application.

### [Data Models](./architecture/data-models.md)

Core data structures and models used throughout the application.

### [Core Workflow & Sequence Diagrams](./architecture/core-workflow-sequence-diagrams.md)

Key application workflows illustrated with sequence diagrams.

### [Definitive Tech Stack Selections](./architecture/definitive-tech-stack-selections.md)

Final technology choices and justifications for the project stack.

### [Infrastructure and Deployment Overview](./architecture/infrastructure-and-deployment-overview.md)

Deployment strategy and GitHub Pages configuration.

### [Overall Testing Strategy](./architecture/overall-testing-strategy.md)

Comprehensive testing approach including unit tests, integration tests, and E2E testing.

### [Error Handling Strategy](./architecture/error-handling-strategy.md)

Error handling patterns and logging strategies for robust application behavior.

### [Coding Standards](./architecture/coding-standards.md)

Mandatory coding standards, linting rules, and development practices.

### [String Management Guidelines](./architecture/string-management-guidelines.md)

Centralized string management approach for UI text and internationalization readiness.

### [Security Best Practices](./architecture/security-best-practices.md)

Security considerations and best practices for client-side web applications.

## Product Requirements Documentation

Documents within the `prd/` directory (sharded sections):

### [Introduction & Problem Statement](./prd/introduction-problem-statement.md)

Project overview and the problem VJ Tam Tam aims to solve.

### [Vision & Goals](./prd/vision-goals.md)

Product vision, primary goals, and success criteria.

### [Target Audience & Users](./prd/target-audience-users.md)

User personas, target audience analysis, and key user interaction flows.

### [Key Features & Scope](./prd/key-features-scope-high-level-ideas-for-mvp.md)

High-level feature overview and MVP scope definition.

### [Post-MVP Features & Ideas](./prd/post-mvp-features-scope-and-ideas.md)

Future feature considerations and enhancement opportunities.

### [Technical Constraints & Preferences](./prd/known-technical-constraints-or-preferences.md)

Technical requirements, constraints, and architectural preferences.

### [Out of Scope Ideas](./prd/out-of-scope-ideas-post-mvp-exploration.md)

Features explicitly excluded from MVP scope but valuable for future consideration.

### [Epics & Stories Overview](./prd/epics-stories-and-acceptance-criteria.md)

Complete breakdown of MVP scope into implementable epics and user stories.

### Individual Epics

Detailed epic documentation within the `prd/epics/` directory:

- [Epic 0: Developer Environment & Project Setup](./prd/epics/epic-0-developer-environment-project-setup.md)
- [Epic 1: Foundational Playback & Media Input](./prd/epics/epic-1-foundational-playback-media-input.md)
- [Epic 2: Randomized Segment Playback](./prd/epics/epic-2-randomized-segment-playback.md)
- [Epic 3: Core UI/UX Implementation & Design System](./prd/epics/epic-3-core-uiux-implementation-design-system.md)
- [Epic 4: Text Overlay Experience](./prd/epics/epic-4-text-overlay-experience.md)
- [Epic 5: Persistence & Basic Settings](./prd/epics/epic-5-persistence-basic-settings.md)
- [Epic 6: Advanced Display & Projection Tools](./prd/epics/epic-6-advanced-display-projection-tools.md)

### [Relevant Research](./prd/relevant-research-optional.md)

Optional research and market analysis for the project.

### [Design Architect Prompt](./prd/prompt-for-design-architect-uiux-specification-mode.md)

Guidance for UI/UX specification development.

### [Initial Architect Prompt](./prd/initial-architect-prompt.md)

Instructions for technical architecture development.

## UI/UX Specification Documentation

Documents within the `ui-ux-spec/` directory (sharded sections):

### [Design Principles](./ui-ux-spec/design-principles.md)

Core design philosophy including brutalist minimalism aesthetic and interaction principles.

### [Visual Design System](./ui-ux-spec/visual-design-system.md)

Typography, color palette, and logo specifications.

### [Layout Structure](./ui-ux-spec/layout-structure.md)

Stage and drawer panel layout specifications.

### [Interaction States](./ui-ux-spec/interaction-states.md)

Idle/active states, advanced controls, and projection mode behaviors.

### [Component Specifications](./ui-ux-spec/component-specifications.md)

Detailed specifications for UI components including welcome state, drawer structure, and toast notifications.

### [User Flows](./ui-ux-spec/user-flows.md)

Key user interaction flows for media management, text overlays, and advanced features.

### [Responsive Behavior](./ui-ux-spec/responsive-behavior.md)

Responsive design specifications for different screen sizes.

### [Accessibility Considerations](./ui-ux-spec/accessibility-considerations.md)

Keyboard navigation, visual accessibility, and interaction feedback requirements.

### [Technical Implementation Notes](./ui-ux-spec/technical-implementation-notes.md)

State management, performance considerations, and integration points.

## Development Stories

### [Stories Directory](./stories/)

Collection of detailed user stories with acceptance criteria, implementation notes, and development progress tracking. Stories are organized by epic number (0.x, 1.x, 2.x, etc.) corresponding to the epics defined in the PRD. 