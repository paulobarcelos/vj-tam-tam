## 5. Architectural / Design Patterns Adopted

The following architectural and design patterns are proposed for the VJ Tam Tam project to ensure a well-structured, maintainable, and scalable client-side application:

- **Module Pattern (via ES Modules):** We will use ES Modules (`import`/`export`) to organize code into distinct, reusable, and manageable JavaScript files. [cite: 50]
- **Observer Pattern (Publish/Subscribe or "Pub/Sub"):** This pattern will facilitate decoupled communication between different parts of the application (e.g., state changes notifying UI components). [cite: 51]
- **Facade Pattern:** We will use facades to provide simplified, higher-level interfaces to more complex subsystems or libraries like Maptastic.js, FileSystemAccessAPI, and `localStorage`. [cite: 52]
- **State Management Pattern (Custom Centralized State with Defined Mutators):** A central JavaScript object will hold the application's shared state. Access and modifications will be handled through defined functions (mutators), and changes will be broadcast using the Observer pattern.
- **Singleton Pattern:** For certain global services or managers where only one instance should exist (e.g., a StorageFacade or a global Pub/Sub dispatcher), the Singleton pattern will ensure a single point of access. [cite: 55]

## 6. Component View

The VJ Tam Tam application will be structured into several key logical components, each with distinct responsibilities. [cite: 56] These components will communicate using ES Modules and the Observer (Pub/Sub) pattern where decoupled interaction is beneficial. [cite: 57]
The main components are: `UI Manager`, `Playback Engine`, `Mapping Manager`, `State Manager`, `Media Processor`, `Text Manager`, various `Facades`, and a `Pub/Sub Service`. [cite: 58]

```mermaid
graph TD
    subgraph sg_ui_input ["User Interface & Input Handling"]
        UIManager["UI Manager (ui.js)"];
        FullscreenFacade["FullscreenAPIFacade"];
    end
    subgraph sg_media_text ["Media & Text Handling"]
        MediaProcessor["Media Processor"];
        TextManager["Text Manager"];
        FSFacade["FileSystemAccessAPIFacade"];
    end
    subgraph sg_core_display ["Core Logic & Display Engine"]
        PlaybackEngine["Playback Engine (core.js)"];
        MappingManager["Mapping Manager (mapping.js)"];
        MaptasticFacade["MaptasticFacade"];
        MaptasticLib["(Maptastic.js Library)"];
    end
    subgraph sg_state_persist ["State & Persistence"]
        StateManager["State Manager (state.js)"];
        StorageFacade["StorageFacade (localStorage)"];
    end
    subgraph sg_eventing ["Eventing"]
        PubSub["Pub/Sub Service (eventBus.js)"];
    end
    UIManager -- "Uses" --> FullscreenFacade;
    UIManager -- "Initiates Actions via Pub/Sub or StateManager" --> MediaProcessor;
    UIManager -- "Initiates Actions via Pub/Sub or StateManager" --> TextManager;
    UIManager -- "Controls Tools via Pub/Sub or StateManager" --> MappingManager;
    UIManager -- "R/W State" --> StateManager;
    UIManager -- "Pub/Sub" --> PubSub;
    MediaProcessor -- "Uses" --> FSFacade;
    MediaProcessor -- "Updates" --> StateManager;
    TextManager -- "Updates" --> StateManager;
    PlaybackEngine -- "Reads State" --> StateManager;
    PlaybackEngine -- "Manipulates" --> VisualStage["Visual Stage (DOM Element)"];
    MappingManager -- "Reads State" --> StateManager;
    MappingManager -- "Updates State" --> StateManager;
    MappingManager -- "Uses" --> MaptasticFacade;
    MaptasticFacade -- "Wraps" --> MaptasticLib;
    MaptasticFacade -- "Manipulates" --> VisualStage;
    StateManager -- "Uses" --> StorageFacade;
    StateManager -- "Pub/Sub for State Changes" --> PubSub;
    PubSub -- "Notifies Subscribers" --> UIManager;
    PubSub -- "Notifies Subscribers" --> PlaybackEngine;
    PubSub -- "Notifies Subscribers" --> MappingManager;
    VisualStage;
```
