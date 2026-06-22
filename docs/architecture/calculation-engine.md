# Calculation Engine

## Boundary

- Calculation code lives in `src/calculators/`.
- UI components pass validated numeric inputs to pure calculation functions.
- Supplier stackups are data inputs, not separate calculation paths.

## Initial Model

- Geometry: edge-coupled external microstrip.
- Width estimate: closed-form microstrip approximation using dielectric height and effective dielectric constant.
- Gap estimate: binary search over a coupled microstrip approximation:
  - `Zdiff = 2 * Z0 * (1 - 0.48 * exp(-0.96 * gap / height))`

## Assumptions

- Inputs are positive finite values.
- Copper thickness is displayed and preserved as an input, but the first model does not yet apply a thickness correction.
- Results are engineering estimates for early layout planning, not fabrication constraints.

## Extension Points

- Add geometry-specific calculators behind a common input/output interface.
- Add supplier stackup data under `src/data/suppliers/`.
- Add provenance fields to supplier stackups when manufacturer data is introduced.
