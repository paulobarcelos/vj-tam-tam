# VJ Tam Tam

VJ Tam Tam is a user-friendly, web-based "auto VJ" tool designed to solve the problem of needing quick, engaging, and effortless visual content for social gatherings like parties. Simply drop a folder of your existing photos and videos to generate an infinite, dynamic, fullscreen visual display.

## Features

- **Zero Configuration**: Drop files and start immediately
- **Infinite Playback**: Randomized segments create endless visual streams
- **Text Overlays**: Add custom messages that appear over visuals
- **Projection Mapping**: Advanced perspective correction for projector setups
- **File Persistence**: Your media selections persist across browser sessions
- **Fullscreen Experience**: Immersive visual backdrop for any event

## Current State

As of 2026-06-10, `main` is the current usable static app and deploys through GitHub Pages from the `app/` directory. Older planning docs and the unfinished `nextjs-migration` branch include Vercel-oriented and future-feature notes that do not all match the current implementation. See [Current State Audit - 2026-06-10](./docs/current-state-audit-2026-06-10.md) for the latest repo-level review.

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url> vj-tam-tam
   cd vj-tam-tam
   ```

2. **Install development dependencies**
   ```bash
   npm install
   ```

3. **Start local development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

4. **Drop your media files** onto the application window and enjoy!

### Deployment

To deploy the application to GitHub Pages:

1. **Ensure all changes are committed**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run publish
   ```

3. **Configure GitHub Pages** (one-time setup)
   - Go to repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Folder: `/ (root)`

The application will be available at `https://<username>.github.io/<repository-name>/`

## Development

### Available Scripts

- `npm run dev` - Start local development server
- `npm run publish` - Deploy to GitHub Pages via `gh-pages` branch
- `npm test` - Run test suite
- `npm run lint` - Check code quality
- `npm run format` - Format code with Prettier

### Project Structure

```
./
├── app/                    # Production application
│   ├── index.html         # Main application entry
│   ├── src/               # Application source code
│   ├── lib/               # Third-party libraries
│   └── assets/            # Static assets
├── docs/                  # Project documentation
├── bmad-agent/           # BMad agent configuration
└── [config files]       # Development configuration
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Libraries**: Maptastic.js (projection mapping)
- **APIs**: FileSystemAccessAPI, localStorage, Fullscreen API
- **Deployment**: GitHub Pages
- **Testing**: Vitest, JSDOM
- **Development**: ESLint, Prettier, Husky

## Browser Support

Modern evergreen browsers supporting:
- ES6+ JavaScript modules
- FileSystemAccessAPI (Chrome, Edge) with graceful fallback
- Fullscreen API
- Drag and Drop API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Check linting: `npm run lint`
6. Submit a pull request

## License

ISC License - see LICENSE file for details.

---

**Born from the "🇧🇷 Bum Bum Tam Tam" party in Kyiv** - Glory to Ukraine! Glory to the heroes! 🇺🇦
