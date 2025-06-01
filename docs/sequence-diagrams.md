## 10. Core Workflow / Sequence Diagrams
This section illustrates key workflows. [cite: 79]

### Sequence Diagram 1: Application Initialization & State Loading
```mermaid
sequenceDiagram
    participant Main_JS as "main.js (App Start)"
    participant StateMgr as "StateManager"
    participant StorageFcd as "StorageFacade"
    actor LocalStorage as "localStorage (Browser)"
    participant EventBus as "PubSubService (Event Bus)"
    participant UIMgr as "UIManager"
    participant PlaybackEng as "Playback Engine"
    Main_JS->>StateMgr: Initialize Application State()
    activate StateMgr
    StateMgr->>StorageFcd: loadPersistedData()
    activate StorageFcd
    StorageFcd->>LocalStorage: getItem('vjtamtamData')
    LocalStorage-->>StorageFcd: persistedDataString (or null)
    StorageFcd-->>StateMgr: parsedStateObject (or defaultSettings)
    deactivate StorageFcd
    StateMgr->>StateMgr: Populate internal state from parsedStateObject / defaults
    StateMgr->>EventBus: publish('appInitialized', loadedApplicationState)
    activate EventBus
    EventBus-->>UIMgr: notify('appInitialized', loadedApplicationState)
    activate UIMgr
    UIMgr->>UIMgr: Initialize UI with loaded state
    deactivate UIMgr
    EventBus-->>PlaybackEng: notify('appInitialized', loadedApplicationState)
    activate PlaybackEng
    PlaybackEng->>PlaybackEng: Initialize playback logic with loaded state
    deactivate PlaybackEng
    deactivate EventBus
    deactivate StateMgr
    Main_JS->>Main_JS: Proceed with further app setup
```

### Sequence Diagram 2: User Adds New Media & Persistence
```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant UIManager as "UI Manager"
    participant MediaProcessor as "Media Processor"
    participant StateManager as "State Manager"
    participant StorageFacade as "StorageFacade"
    actor LocalStorage as "localStorage (Browser)"
    participant EventBus as "PubSubService (Event Bus)"
    User->>Browser: Drags & Drops Media Files
    Browser->>UIManager: fires 'drop' event with file list
    activate UIManager
    UIManager->>MediaProcessor: processNewFiles(fileList)
    deactivate UIManager
    activate MediaProcessor
    MediaProcessor->>StateManager: addMediaItems(newItems)
    deactivate MediaProcessor
    activate StateManager
    StateManager->>StateManager: Update internal state (media pool)
    StateManager->>StorageFacade: persistApplicationData(currentState)
    activate StorageFacade
    StorageFacade->>LocalStorage: setItem('vjtamtamData', serializedStateString)
    deactivate StorageFacade
    StateManager->>EventBus: publish('mediaPoolUpdated', newItems)
    activate EventBus
    EventBus-->>UIManager: notify('mediaPoolUpdated', newItems)
    deactivate EventBus
    activate UIManager
    UIManager->>UIManager: Re-render media list in UI drawer
    deactivate UIManager
    deactivate StateManager
```

### Sequence Diagram 3: User Changes a Setting & Playback Reacts
```mermaid
sequenceDiagram
    actor User
    participant UIManager as "UI Manager"
    participant StateManager as "State Manager"
    participant StorageFacade as "StorageFacade"
    actor LocalStorage as "localStorage (Browser)"
    participant EventBus as "PubSubService (Event Bus)"
    participant PlaybackEngine as "Playback Engine"
    User->>UIManager: Interacts with a setting control
    activate UIManager
    UIManager->>StateManager: updateSetting({ key: 'minSegmentDuration', value: newValue })
    deactivate UIManager
    activate StateManager
    StateManager->>StateManager: Update internal state object
    StateManager->>StorageFacade: persistApplicationData(currentState)
    activate StorageFacade
    StorageFacade->>LocalStorage: setItem('vjtamtamData', serializedStateString)
    deactivate StorageFacade
    StateManager->>EventBus: publish('settingChanged', { key: 'minSegmentDuration', value: newValue })
    activate EventBus
    EventBus-->>PlaybackEngine: notify('settingChanged', changedSetting)
    deactivate EventBus
    activate PlaybackEngine
    PlaybackEngine->>PlaybackEngine: Update internal logic/variables with new setting
    deactivate PlaybackEngine
    deactivate StateManager
``` 