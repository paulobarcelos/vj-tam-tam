# Infrastructure and Deployment Overview

This section outlines the infrastructure, deployment strategy, and environment management for the VJ Tam Tam project. [cite: 88]

- **Cloud Provider(s):** GitHub. [cite: 89]
- **Core Services Used:** GitHub Pages will be used for hosting the static client-side application. [cite: 89]
- **GitHub Pages URL:** The application can be deployed to the default `https://<username>.github.io/<repository-name>/` URL or to a **custom domain** configured in the repository settings. [cite: 90]
- **Infrastructure as Code (IaC):** Not applicable. Infrastructure is configured via GitHub repository settings. [cite: 91]
- **Deployment Strategy:** Manual deployment using **git subtree** to push the `/app` folder contents to the `gh-pages` branch. [cite: 92] The `npm run publish` script handles this process by executing `git subtree push --prefix app origin gh-pages`. [cite: 93]
- **Deployment Process:** 
  1. Ensure all changes are committed to the `main` branch
  2. Run `npm run publish` from the repository root
  3. The script pushes the `/app` folder contents to the `gh-pages` branch
  4. GitHub Pages automatically serves the updated content from the `gh-pages` branch [cite: 94]
- **Environments:**
  - Local (Recommended): Use `npm run dev` to serve the application locally via the `serve` package, or use any simple static file server (e.g., Python's `http.server`) to avoid browser restrictions. [cite: 95] Running `index.html` directly from the file system is possible but not recommended for full feature compatibility. [cite: 96]
  - Production: The live application served via the GitHub Pages URL from the `gh-pages` branch. [cite: 97]
- **Environment Promotion:** Running `npm run publish` promotes the current `/app` folder state from the `main` branch to Production via the `gh-pages` branch. [cite: 98]
- **Rollback Strategy:** To rollback, checkout a previous commit in the `main` branch, then run `npm run publish` to deploy the previous version to the `gh-pages` branch. [cite: 99]
