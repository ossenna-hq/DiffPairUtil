# Calculation Engine

## Boundary

- Calculation code lives in `src/calculators/`.
- UI components pass validated numeric inputs to pure calculation functions.
- Supplier stackups are not exposed in the current UI.
- Visualization state lives in the UI until the underlying geometry has validated formulas.
- Cross-section drawing and chart interaction are SVG-based UI concerns in `src/App.tsx`.

## Initial Model

- Geometry: edge-coupled external microstrip.
- Width estimate: closed-form microstrip approximation using dielectric height and effective dielectric constant.
- Gap estimate: binary search over a coupled microstrip approximation:
  - `Zdiff = 2 * Z0 * (1 - 0.48 * exp(-0.96 * gap / height))`
- Width-versus-gap graph: repeats the same coupled microstrip approximation across a bounded gap sweep.
- Chart crosshairs and hover labels read the calculated sweep points; they do not alter calculation results.
- Chart tolerance banding is a UI overlay derived from calculated trace width values and the selected percentage.

## Assumptions

- Inputs are positive finite values.
- Copper thickness is displayed and preserved as an input, but the first model does not yet apply a thickness correction.
- Coplanar and solder-mask selections affect the visualization only in the current version.
- Results are engineering estimates for early layout planning, not fabrication constraints.

## Extension Points

- Add geometry-specific calculators behind a common input/output interface.
- Add supplier stackup data under `src/data/suppliers/` when supplier presets are reintroduced.
- Add provenance fields to supplier stackups when manufacturer data is introduced.
