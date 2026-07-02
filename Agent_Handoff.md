# Agent Handoff

## Project Snapshot

- Repository: `DiffPairUtil`
- App type: static Vite, React, and TypeScript web app.
- Purpose: interactive PCB differential-pair width/gap estimator for Ossenna.
- Current hosting target: default GitHub Pages project site at `https://ossenna-hq.github.io/DiffPairUtil/`.
- Deployment source: GitHub Actions, not a custom domain or branch-root Pages source.
- Production Vite base path: `/DiffPairUtil/`.
- Development Vite base path: `/`.

## Operating Contracts

- Follow the DOX instructions before edits: read `AGENTS.md`, identify touched paths, then read any nested `AGENTS.md` files on those paths.
- Do not revert unrelated working tree changes.
- Update nearby requirements or architecture docs when behavior changes.
- Keep infrastructure as code in the repo: devcontainer, CI, deployment, domain configuration, and quality checks are versioned.
- Use the default GitHub Pages project-site deployment unless a custom domain is explicitly requested.

## Runtime And Tooling

- Local and CI Node version: `24.x`.
- Dev Container image: `mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm`.
- Dev Container includes GitHub CLI through `ghcr.io/devcontainers/features/github-cli:1`.
- Local dev command: `npm run dev`.
- Local dev URL: `http://localhost:5173`.
- Validation commands:
  - `npm run lint`
  - `npm test`
  - `npm run build`

## Deployment State

- Workflow: `.github/workflows/pages.yml`.
- Pushes to `main` run lint, tests, build, Pages artifact checks, and deploy to GitHub Pages.
- CI uses Node 24 through `actions/setup-node@v6`.
- Build artifact guard checks that `dist/index.html` references `/DiffPairUtil/assets/` and does not publish the Vite dev `/src/main.tsx` entrypoint.
- `public/CNAME` is intentionally absent.
- `www.ossenna.com` remains reserved for the main website.

## Current App Behavior

- Manual material inputs only.
- Supports target single-ended and differential impedance inputs.
- Tolerance band slider sits in the target strip below the `Differential` checkbox.
- Calculated single-ended and differential readouts show closest achievable values; readouts render red when outside tolerance.
- Exact target failures must not blank or disable track, gap, or dielectric controls.
- Copper thickness dropdowns support:
  - `0.5 oz / 0.7mil / 17um`
  - `1 oz / 1.4mil / 35um`
- Cross-section graphic is the primary work surface.
- Coplanar and Mask are checkboxes in the visualization.
- Signal copper stays at a fixed vertical position; dielectric and reference plane grow downward.
- Dk input is placed in the dielectric layer.
- Dielectric, Track, and Gap controls provide mm/mil fields plus increment controls.
- Padlock buttons only prevent calculation updates from overwriting dimensions; locked controls remain directly user-editable.

## Width Vs Gap Graph

- Shows axis units and a note: `Units are mil (mm)`.
- Hover readout is pinned outside the plot area so it does not obscure graph selection.
- Hover readout only appears when the mouse is inside the graph region.
- Hover text order and labels are:
  - `Track: <mil> (<mm>), Gap: <mil> (<mm>), Band: +/-<tolerance>%`
- Tolerance banding follows the selected gap range, including gaps below the original lower axis range.
- The live Track/Gap datapoint follows the control values.
- The live datapoint is green inside the target tolerance and red outside it.
- Clicking a graph datapoint updates the Track and Gap controls to match.

## Important Files

- `src/App.tsx` - main UI, controls, graph interaction, visualization state.
- `src/App.css` - layout, cross-section, graph, and control styling.
- `src/calculators/differentialPair.ts` - impedance and constrained solving logic.
- `src/calculators/differentialPair.test.ts` - calculator unit tests.
- `docs/requirements/diff-pair-estimator.md` - user-visible behavior requirements.
- `docs/architecture/deployment.md` - development, validation, and Pages deployment architecture.
- `vite.config.ts` - Vite config, including production `/DiffPairUtil/` base path.
- `.github/workflows/pages.yml` - GitHub Pages validation and deploy workflow.
- `.devcontainer/devcontainer.json` - reproducible VS Code Dev Container setup.

## Calculator Notes

- Locked dimensions are treated as calculation constraints, not UI disablement.
- When a requested impedance is not exactly achievable within the available geometry range, solving should return the closest achievable result instead of throwing or blanking dependent controls.
- Single-ended and differential readouts are compared to the active target and tolerance range for pass/fail coloring.

## Known Environment Notes

- On Windows or sandboxed runs, Vitest/Vite may fail with `spawn EPERM` while loading `vite.config.ts`.
- If that happens, rerun validation from the Dev Container terminal or outside the sandbox.
- Do not store GitHub credentials or tokens in the repo. Use local `gh auth login` or existing GitHub CLI auth when repository access is needed.

## Recent Work Summary

- Aligned local and CI runtime on Node 24.
- Hardened GitHub Pages deployment for the default project-site path.
- Removed custom-domain assumptions and `CNAME` usage.
- Kept impedance controls editable when targets are unreachable.
- Added closest-achievable calculated impedance readouts with tolerance coloring.
- Added graph live datapoint and graph-to-control point selection.
- Fixed graph tolerance alignment against datapoint coloring.
- Refined graph hover behavior, pinned readout placement, and display labels.

## Suggested Next Checks

- After any UI behavior change, update `docs/requirements/diff-pair-estimator.md`.
- After any deployment or runtime change, update `docs/architecture/deployment.md`.
- Before pushing, run `npm run lint`, `npm test`, and `npm run build`.
- After pushing deployment changes, verify the GitHub Actions Pages run and the live project URL.
