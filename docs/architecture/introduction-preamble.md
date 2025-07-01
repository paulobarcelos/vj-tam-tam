# Introduction / Preamble

This document outlines the overall project architecture for VJ Tam Tam, a client-side, web-based "auto VJ" tool.
Its primary goal is to serve as the guiding architectural blueprint for development.
The project mandates **no build process**, prioritizing a direct Vanilla JavaScript, HTML, and CSS implementation.
However, the architecture may incorporate minimal, locally-hosted libraries if they demonstrably and significantly improve code clarity and maintainability for specific concerns like state management or UI component organization, without requiring a build step.
Given this project is entirely client-side with no backend components, this document focuses solely on the frontend architecture, covering its structure, core modules, state management, key library integrations, and operational aspects like persistence and error handling.
It aims to translate the requirements from the Product Requirements Document (PRD) and the UI/UX Specification into a technical plan.

