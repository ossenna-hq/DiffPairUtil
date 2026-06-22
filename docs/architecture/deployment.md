# Deployment Architecture

## Development

- VS Code Dev Containers define the development environment under `.devcontainer/`.
- `npm install` prepares dependencies inside the container.
- `npm run dev` starts the local Vite server on port `5173`.

## Validation

- `npm run lint` checks TypeScript and React source.
- `npm test` runs calculator unit tests.
- `npm run build` type-checks and builds the static site.

## Hosting

- GitHub Actions builds the app and deploys the `dist/` artifact to GitHub Pages.
- `public/CNAME` configures the custom domain as `www.ossenna.com`.
- DNS should map `www.ossenna.com` to the GitHub Pages host for the repository owner.
