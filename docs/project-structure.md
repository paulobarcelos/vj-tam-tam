## 7. Project Structure

The VJ Tam Tam project will adhere to the following folder structure:

```plaintext
./
├── .github/
│   └── workflows/
├── docs/
│   ├── VJ-Tam-Tam-PRD.md
│   ├── VJ-Tam-Tam-UI-UX-Spec.md
│   └── architecture.md
├── lib/
│   └── maptastic.js
├── src/
│   ├── uiManager.js
│   ├── playbackEngine.js
│   ├── mappingManager.js
│   ├── stateManager.js
│   ├── mediaProcessor.js
│   ├── textManager.js
│   ├── eventBus.js
│   ├── facades/
│   │   ├── storageFacade.js
│   │   ├── fileSystemFacade.js
│   │   ├── maptasticFacade.js
│   │   └── fullscreenFacade.js
│   └── main.js
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── images/
│   └── test-card.png
├── .gitignore
├── index.html
└── README.md
```
