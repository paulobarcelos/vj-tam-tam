# Component View

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
