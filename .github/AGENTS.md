# GitHub Automation

## Purpose

- Define repository automation for validation and GitHub Pages deployment.

## Ownership

- Owns `.github/workflows/` and other GitHub repository automation files.

## Local Contracts

- Workflows must be reproducible from committed files.
- Deployment must only publish build artifacts produced by CI.
- Keep workflow permissions minimal and explicit.
- Use Node.js 24 for repository validation and Pages builds.

## Work Guidance

- Run the same `npm` scripts locally and in CI where practical.
- Keep Pages deployment on `main` unless the repository branching strategy changes.

## Verification

- Validate workflow YAML structure after editing.
- Confirm GitHub Actions passes before relying on a deployment.

## Child DOX Index

- No child DOX files.
