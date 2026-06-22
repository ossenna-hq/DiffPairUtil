# Application Source

## Purpose

- Implement the interactive differential pair estimator and supporting data models.

## Ownership

- Owns source files under `src/`, including UI, calculators, supplier data, styling, and tests.

## Local Contracts

- Keep calculation logic in pure functions under `src/calculators/`.
- Keep supplier stackups as data under `src/data/`.
- Keep UI code separate from calculation formulas.
- Validate numeric inputs before calculation.

## Work Guidance

- Add tests for calculation boundary behavior and new formulas.
- Document model assumptions when formulas or supplier data change.
- Avoid hidden network dependencies; the app must work as a static site.

## Verification

- Run `npm run lint`, `npm test`, and `npm run build` after meaningful source changes.

## Child DOX Index

- No child DOX files.
