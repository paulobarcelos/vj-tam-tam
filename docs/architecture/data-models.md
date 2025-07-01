# Data Models

This section defines the core data structures used within the application, representing entities and configuration persisted to `localStorage`. [cite: 76] Key models include: `PersistedMediaItem` (metadata for media files), `TextItem`, a comprehensive `ApplicationSettings` object, and the top-level `PersistedDataStructure` that wraps them for storage. [cite: 77] The `maptasticLayout` within `ApplicationSettings` will store the complete geometric state from Maptastic.js (`id`, `targetPoints`, `sourcePoints`). [cite: 78]
