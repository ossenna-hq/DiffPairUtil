# Deployment Architecture

## Development

- VS Code Dev Containers define the development environment under `.devcontainer/`.
- `npm install` prepares dependencies inside the container.
- `npm run dev` starts the local Vite server on port `5173`.

## Validation

- `npm run lint` checks TypeScript and React source.
- `npm test` runs calculator unit tests.
- `npm run build` type-checks and builds the static site.
- CI verifies the built `dist/index.html` uses `/DiffPairUtil/assets/` URLs and does not publish the Vite development `/src/main.tsx` entrypoint.

## Hosting

- GitHub Actions builds the app and deploys the `dist/` artifact to GitHub Pages.
- Production builds use the `/DiffPairUtil/` base path required by the default GitHub Pages project-site URL.
- No custom domain or `CNAME` file is used in the current deployment model because `www.ossenna.com` remains the main website domain.
- To host from an Ossenna domain later, use a dedicated subdomain for this tool or route it through the main website, then update `vite.config.ts`, DNS, and the Pages custom domain together.
