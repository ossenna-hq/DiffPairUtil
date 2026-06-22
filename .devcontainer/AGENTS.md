# Dev Container

## Purpose

- Define the reproducible VS Code development environment for the web application.

## Ownership

- Owns `.devcontainer/devcontainer.json` and devcontainer diagnostic helper scripts.

## Local Contracts

- Keep toolchain versions pinned or intentionally selected by base image tag.
- Install only development tools required to build, test, lint, and run the app.
- Keep `node_modules` container-local so Windows-native packages are not reused inside Linux containers.
- Do not place project source or generated build output in this folder.

## Work Guidance

- Prefer declarative devcontainer features and settings over manual setup instructions.
- Keep `postCreateCommand` aligned with the package manager used by `package.json`.
- Prefer `npm ci` in the devcontainer because this project commits `package-lock.json`.

## Verification

- Rebuild the devcontainer after changing base images, features, or setup commands.
- Use `.devcontainer/diagnose.ps1` to collect Docker and Dev Containers CLI logs when VS Code fails to open the container.

## Child DOX Index

- No child DOX files.
