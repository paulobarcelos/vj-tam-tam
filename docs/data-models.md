# Data Models

## 9. Data Models

This section defines the core data structures used within the application, representing entities and configuration persisted to `localStorage`. Key models include: `PersistedMediaItem` (metadata for media files), `TextItem`, a comprehensive `ApplicationSettings` object, and the top-level `PersistedDataStructure` that wraps them for storage. The `maptasticLayout` within `ApplicationSettings` will store the complete geometric state from Maptastic.js (`id`, `targetPoints`, `sourcePoints`).

### Key Data Structures

**Note**: Detailed data model definitions will be developed during implementation phase. The core entities identified include:

- **PersistedMediaItem**: Metadata for media files including file handles, type information, and display properties
- **TextItem**: User-entered text strings for overlay display with associated metadata
- **ApplicationSettings**: Comprehensive settings object covering playback configuration, UI state, projection settings, and user preferences
- **PersistedDataStructure**: Top-level wrapper for localStorage persistence containing all application state
- **MaptasticLayout**: Geometric state from Maptastic.js including transformation matrices and corner point data

These models will be refined based on implementation requirements and browser API capabilities, particularly for FileSystemAccessAPI integration.
