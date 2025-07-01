# Project Structure

The VJ Tam Tam project adheres to the following production folder structure:

```plaintext
./
├── app/                          # Production application (served by GitHub Pages)
│   ├── index.html
│   ├── lib/
│   │   └── maptastic.js
│   ├── src/
│   │   ├── constants/            # Shared constants and configuration
│   │   │   ├── mediaTypes.js     # Media MIME types and extensions
│   │   │   └── strings.js        # UI strings and messages
│   │   ├── utils/                # Shared utility functions
│   │   │   ├── mediaUtils.js     # Media processing utilities
│   │   │   ├── validationUtils.js # Input validation helpers
│   │   │   └── arrayUtils.js     # Array manipulation utilities
│   │   ├── facades/              # External API wrappers
│   │   │   ├── storageFacade.js
│   │   │   ├── fileSystemFacade.js
│   │   │   ├── fileSystemAccessFacade.js  # FileSystemAccessAPI wrapper (NEW)
│   │   │   ├── maptasticFacade.js
│   │   │   └── fullscreenFacade.js
│   │   ├── uiManager.js
│   │   ├── playbackEngine.js
│   │   ├── mappingManager.js
│   │   ├── stateManager.js
│   │   ├── mediaProcessor.js
│   │   ├── textManager.js
│   │   ├── eventBus.js
│   │   └── main.js
│   └── assets/
│       ├── css/
│       │   └── style.css
│       ├── images/
│       └── test-card.png
├── docs/                         # Project documentation
│   ├── PRD.md
│   ├── Architechture.md
│   ├── epic-1.md
│   └── stories/
├── bmad-agent/                   # BMad agent configuration and tasks
├── .github/                      # GitHub workflows
├── .gitignore
├── package.json
├── package-lock.json
├── vitest.config.js
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
└── README.md
```

## Key Structural Changes (Stories 1.6-1.9)

**Production Application Isolation:**
- Core application files moved to `/app` folder for clean GitHub Pages deployment
- Clear separation between application code and project management files

**Centralized Constants:**
- `src/constants/mediaTypes.js` - All media MIME types and file extensions
- `src/constants/strings.js` - All user-facing strings for maintainability and i18n readiness

**Shared Utilities:**
- `src/utils/` modules provide reusable functions eliminating code duplication
- Common operations (filtering, validation, array manipulation) centralized

**Enhanced Facades:**
- New `fileSystemAccessFacade.js` provides FileSystemAccessAPI integration
- Existing facades enhanced for better error handling and browser compatibility
