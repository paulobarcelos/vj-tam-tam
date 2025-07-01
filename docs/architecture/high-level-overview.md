# High-Level Overview

VJ Tam Tam is architected as a **client-side monolithic application**. [cite: 31]
All application logic, including media processing, playback control, UI rendering, and state management, resides and executes within the user's web browser. [cite: 32]
There is no backend server component for the core functionality. [cite: 33]
The entire codebase will be contained within a **single repository (Monorepo)**, facilitating straightforward deployment to GitHub Pages. [cite: 34]
The primary user interaction flow begins with the user providing media to the application. [cite: 35]
Once media is loaded, the application automatically initiates a continuous, randomized playback of segments from this media pool. [cite: 36]
Users can interact with a minimalist UI to add more media, manage text overlays, and access advanced display controls. [cite: 37]
All settings and configurations are persisted in the browser's `localStorage`. [cite: 38]
Conceptually, the data flow can be visualized as follows:

```mermaid
graph LR
    subgraph sg_init ["Application Initialization"]
        AppInit((Initialize App));
        AppInit -.-> I;
    end
    subgraph sg_ui ["User Interaction"]
        A["User Drops/Selects Media Files"] --> B{Media Processor};
        C[User Enters Text Overlays] --> D{Text Overlay Manager};
        E[User Adjusts Settings via UI] --> F{Settings Manager};
    end
    subgraph sg_core ["Application Core & State"]
        I[Application State & Configuration];
        G[Media Pool];
        H[Text Pool];
        J{Playback Engine};
        B --> G;
        D --> H;
        F --> I;
        G -- "Updates State" --> I;
        H -- "Updates State" --> I;
        I -- "Settings, Media & Text Info" --> J;
        G -- "Media Content" --> J;
        H -- "Text Content" --> J;
    end
    subgraph sg_persist ["Persistence"]
        P[localStorage];
        I -- "Persisted on Update" --> P;
        P -- "Loaded on App Init" --> I;
    end
    subgraph sg_display ["Display & Output"]
        K["Visual Stage (HTML/CSS)"];
        L{Projection & Display Tools UI};
        M{Maptastic.js Integration};
        J --> K;
        I -- "Projection/Color Settings" --> M;
        M --> K;
        I -- "UI State (Panel Visibility, etc)" --> L;
    end
```
