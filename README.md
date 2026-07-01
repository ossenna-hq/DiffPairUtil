# Diff Pair Util

Interactive PCB differential pair width and gap estimator for Ossenna.

## Scope

- Static Vite, React, and TypeScript web app.
- Initial edge-coupled microstrip estimator using manual dielectric height and Dk inputs.
- Supplier stackup data placeholders for future PCBWay and JLCPCB support.
- GitHub Actions validation and GitHub Pages deployment.
- VS Code Dev Container for reproducible development.

## Development

Open the repository in VS Code and choose **Reopen in Container**.

```powershell
npm install
npm run dev
```

The local app runs at `http://localhost:5173`.

## Validation

```powershell
npm run lint
npm test
npm run build
```

## Deployment

GitHub Actions deploys `dist/` to GitHub Pages on pushes to `main`.

The app is configured for the default GitHub Pages project-site URL:
`https://ossenna-hq.github.io/DiffPairUtil/`.

This repository does not claim `www.ossenna.com`; that host remains reserved for the main website.
