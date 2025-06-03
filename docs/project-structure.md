## 7. Project Structure

The VJ Tam Tam project will adhere to the following folder structure:

```plaintext
./
├── .github/
│   └── workflows/
├── app/                     # Main application directory (served by GitHub Pages)
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── images/
│   │   └── test-card.png
│   ├── lib/
│   │   └── maptastic.js
│   └── src/
│       ├── uiManager.js
│       ├── playbackEngine.js
│       ├── mappingManager.js
│       ├── stateManager.js
│       ├── mediaProcessor.js
│       ├── textManager.js
│       ├── eventBus.js
│       ├── facades/
│       │   ├── storageFacade.js
│       │   ├── fileSystemFacade.js
│       │   ├── maptasticFacade.js
│       │   └── fullscreenFacade.js
│       └── main.js
├── docs/
│   ├── VJ-Tam-Tam-PRD.md
│   ├── VJ-Tam-Tam-UI-UX-Spec.md
│   └── architecture.md
├── bmad-agent/
│   └── [agent management files]
├── .gitignore
├── package.json
├── vitest.config.js
├── eslint.config.js
└── README.md
```
