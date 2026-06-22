# Dev Container

## Purpose

- Define the reproducible VS Code development environment for the web application.

## Ownership

- Owns `.devcontainer/devcontainer.json` and `.devcontainer/Dockerfile`.

## Local Contracts

- Keep toolchain versions pinned or intentionally selected by base image tag.
- Install only development tools required to build, test, lint, and run the app.
- Do not place project source or generated build output in this folder.

## Work Guidance

- Prefer declarative devcontainer features and settings over manual setup instructions.
- Keep `postCreateCommand` aligned with the package manager used by `package.json`.

## Verification

- Rebuild the devcontainer after changing base images, features, or setup commands.

## Child DOX Index

- No child DOX files.
