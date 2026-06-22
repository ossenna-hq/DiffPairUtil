# Differential Pair Estimator Requirements

## Functional Outcomes

- User can enter dielectric height, dielectric constant, copper thickness, target differential impedance, and target single-ended impedance.
- User can toggle differential-pair mode, coplanar visualization, and solder-mask visualization from the cross-section graphic.
- User can enter signal and plane copper thickness in copper ounces or microns.
- User can adjust prepreg/core thickness and Dk manually.
- User can estimate trace width and pair gap for an edge-coupled microstrip geometry.
- User can use the cross-section visualization as the primary work surface, with geometry and material controls colocated with the drawing.
- User can see a trace-width-versus-gap graph for differential pair planning with axis units, hover readouts, and adjustable tolerance banding.
- User can see the assumptions and approximation limits that apply to the estimate.
- User can use manual material inputs only in the initial version.
- User can read linear measurements with metric and imperial values shown together in millimeters and mils.
- User can use the app as a static webpage hosted at `www.ossenna.com`.

## Initial Scope

- Support manual inputs only.
- Use deterministic client-side calculations.
- Render configuration visualization and graph client-side without external services.
- Avoid server-side services, accounts, databases, or telemetry.

## Out Of Scope For Initial Version

- Fabricator-validated impedance guarantees.
- Stripline, broadside coupling, solder mask corrections, copper thickness corrections, and roughness corrections.
- Fabricator-validated coplanar waveguide field-solving.
- Supplier preset selection and direct import of PCBWay or JLCPCB stackup files.
