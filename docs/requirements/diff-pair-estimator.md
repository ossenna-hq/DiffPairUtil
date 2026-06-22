# Differential Pair Estimator Requirements

## Functional Outcomes

- User can enter dielectric height, dielectric constant, copper thickness, target differential impedance, and target single-ended impedance.
- User can estimate trace width and pair gap for an edge-coupled microstrip geometry.
- User can see the assumptions and approximation limits that apply to the estimate.
- User can switch between manual material inputs and supplier presets as supplier libraries are added.
- User can read results in metric and imperial units.
- User can use the app as a static webpage hosted at `www.ossenna.com`.

## Initial Scope

- Support manual inputs and a small data structure for future supplier presets.
- Use deterministic client-side calculations.
- Avoid server-side services, accounts, databases, or telemetry.

## Out Of Scope For Initial Version

- Fabricator-validated impedance guarantees.
- Stripline, coplanar waveguide, broadside coupling, solder mask corrections, and roughness corrections.
- Direct import of PCBWay or JLCPCB stackup files.
