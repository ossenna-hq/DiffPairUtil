# Differential Pair Estimator Requirements

## Functional Outcomes

- User can enter dielectric height, dielectric constant, copper thickness, target differential impedance, and target single-ended impedance.
- User can toggle differential-pair mode, coplanar visualization, and solder-mask visualization from the cross-section graphic.
- User can set single-ended and differential impedance targets in a target strip above the cross-section graphic.
- User can adjust the impedance tolerance band from the target strip below the Differential checkbox.
- User can see calculated single-ended and differential impedance readouts in a non-editable row of the target strip; if the closest achievable value is outside the tolerance band, the readout is red.
- User can choose signal and plane copper thickness from `0.5 oz / 0.7mil / 17um` and `1 oz / 1.4mil / 35um` options in the cross-section control card.
- User can adjust prepreg/core thickness with millimeter and mil entries in the stackup control card and a vertical slider with increment buttons inside the cross-section visualization.
- User can adjust Dk from the dielectric section of the cross-section control card.
- User can see calculated track width and gap readouts aligned above the corresponding track and gap in the cross-section graphic, with directly editable millimeter/mil number fields whose native up/down steppers provide fine adjustment.
- User can lock or unlock dielectric thickness, track width, and gap using padlock buttons; locked dimensions remain fixed while unlocked dimensions are adjusted to solve the active impedance targets where possible.
- User can continue editing dielectric thickness, track width, and gap when the exact impedance target cannot be achieved; calculated impedance readouts show the closest achievable result.
- User sees dielectric thickness, track width, and gap padlocks unlocked by default when the form first loads.
- User can see the signal copper stay at a fixed vertical position while dielectric and reference-plane graphics grow downward as dielectric thickness changes.
- User can estimate trace width and pair gap for an edge-coupled microstrip geometry.
- User can use the cross-section visualization as the primary work surface, with geometry and material controls colocated with the drawing.
- User can see a trace-width-versus-gap graph for differential pair planning with axis units, hover readouts, and adjustable tolerance banding.
- User can see the assumptions and approximation limits that apply to the estimate.
- User can use manual material inputs only in the initial version.
- User can read linear measurements with metric and imperial values shown together in millimeters and mils.
- User can use the app as a static webpage hosted by the default GitHub Pages project-site process.

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
