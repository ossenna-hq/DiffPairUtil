import { useMemo, useState, type MouseEvent } from "react";
import {
  estimateConstrainedDifferentialPair,
  estimateDifferentialPair,
  estimateTraceWidthForDifferentialGap,
  mmToMils,
  type DimensionLocks,
  type DifferentialPairInput,
  type TraceGapPoint,
} from "./calculators/differentialPair";
import "./App.css";

type CouplingMode = "coplanar" | "non-coplanar";
type SignalMode = "differential" | "single-ended";
type SolderMaskMode = "with-mask" | "without-mask";

interface ThicknessControl {
  ounces: "0.5" | "1";
  microns: number;
}

interface ImpedanceConfiguration {
  coupling: CouplingMode;
  signal: SignalMode;
  solderMask: SolderMaskMode;
}

interface ManualDimensions {
  dielectricHeightMm: number;
  traceWidthMm: number;
  gapMm: number;
}

interface TraceGapSeries {
  points: TraceGapPoint[];
  lowerBand: TraceGapPoint[];
  upperBand: TraceGapPoint[];
}

const initialInput: DifferentialPairInput = {
  dielectricHeightMm: 0.18,
  dielectricConstant: 4.2,
  copperThicknessUm: ouncesToMicrons("1"),
  targetDifferentialOhms: 90,
  targetSingleEndedOhms: 50,
  geometry: "microstrip",
};

const initialConfiguration: ImpedanceConfiguration = {
  coupling: "non-coplanar",
  signal: "differential",
  solderMask: "without-mask",
};

const initialThickness: ThicknessControl = {
  ounces: "1",
  microns: ouncesToMicrons("1"),
};

const initialEstimate = estimateDifferentialPair(initialInput);

const initialManualDimensions: ManualDimensions = {
  dielectricHeightMm: initialInput.dielectricHeightMm,
  traceWidthMm: initialEstimate.traceWidthMm,
  gapMm: initialEstimate.gapMm,
};

const initialDimensionLocks: DimensionLocks = {
  dielectricHeight: false,
  traceWidth: false,
  gap: false,
};

const initialManualDimensionHolds: DimensionLocks = {
  dielectricHeight: false,
  traceWidth: false,
  gap: false,
};

function App() {
  const [input, setInput] = useState<DifferentialPairInput>(initialInput);
  const [configuration, setConfiguration] =
    useState<ImpedanceConfiguration>(initialConfiguration);
  const [signalThickness, setSignalThickness] =
    useState<ThicknessControl>(initialThickness);
  const [planeThickness, setPlaneThickness] =
    useState<ThicknessControl>(initialThickness);
  const [manualDimensions, setManualDimensions] = useState<ManualDimensions>(
    initialManualDimensions,
  );
  const [dimensionLocks, setDimensionLocks] = useState<DimensionLocks>(
    initialDimensionLocks,
  );
  const [manualDimensionHolds, setManualDimensionHolds] = useState(
    initialManualDimensionHolds,
  );
  const [tolerancePercent, setTolerancePercent] = useState(8);

  const estimate = useMemo(() => {
    const solverLocks = {
      dielectricHeight:
        dimensionLocks.dielectricHeight ||
        manualDimensionHolds.dielectricHeight,
      traceWidth: dimensionLocks.traceWidth || manualDimensionHolds.traceWidth,
      gap: dimensionLocks.gap || manualDimensionHolds.gap,
    };

    try {
      return {
        value: estimateConstrainedDifferentialPair({
          ...input,
          dielectricHeightMm: manualDimensions.dielectricHeightMm,
          traceWidthMm: manualDimensions.traceWidthMm,
          gapMm: manualDimensions.gapMm,
          locks: solverLocks,
        }),
        error: null,
      };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid inputs.",
      };
    }
  }, [dimensionLocks, input, manualDimensionHolds, manualDimensions]);

  function updateNumber(field: keyof DifferentialPairInput, value: string) {
    setInput((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  function updateDielectricHeight(nextHeightMm: number) {
    const dielectricHeightMm = clamp(nextHeightMm, 0.05, 0.6);
    setManualDimensionHolds((current) => ({
      ...current,
      dielectricHeight: true,
    }));
    setManualDimensions((current) => ({
      ...current,
      dielectricHeightMm,
    }));
  }

  function updateTraceWidth(nextTraceWidthMm: number) {
    setManualDimensionHolds((current) => ({
      ...current,
      traceWidth: true,
    }));
    setManualDimensions((current) => ({
      ...current,
      traceWidthMm: Math.max(0.001, nextTraceWidthMm),
    }));
  }

  function updateGap(nextGapMm: number) {
    setManualDimensionHolds((current) => ({
      ...current,
      gap: true,
    }));
    setManualDimensions((current) => ({
      ...current,
      gapMm: Math.max(0.001, nextGapMm),
    }));
  }

  function updateTraceGap(nextTraceWidthMm: number, nextGapMm: number) {
    setManualDimensionHolds((current) => ({
      ...current,
      traceWidth: true,
      gap: true,
    }));
    setManualDimensions((current) => ({
      ...current,
      traceWidthMm: Math.max(0.001, nextTraceWidthMm),
      gapMm: Math.max(0.001, nextGapMm),
    }));
  }

  function toggleDimensionLock(
    dimension: keyof DimensionLocks,
    solvedValueMm: number | null,
  ) {
    setDimensionLocks((current) => {
      const nextLocked = !current[dimension];
      if (nextLocked && solvedValueMm !== null) {
        setManualDimensions((manual) => ({
          ...manual,
          [dimension === "dielectricHeight"
            ? "dielectricHeightMm"
            : dimension === "traceWidth"
              ? "traceWidthMm"
              : "gapMm"]: solvedValueMm,
        }));
      }

      return {
        ...current,
        [dimension]: nextLocked,
      };
    });

    setManualDimensionHolds((current) => ({
      ...current,
      [dimension]: false,
    }));
  }

  function updateSignalThickness(ounces: ThicknessControl["ounces"]) {
    const microns = ouncesToMicrons(ounces);
    setSignalThickness({ ounces, microns });
    setInput((current) => ({
      ...current,
      copperThicknessUm: microns,
    }));
  }

  function updatePlaneThickness(ounces: ThicknessControl["ounces"]) {
    setPlaneThickness({ ounces, microns: ouncesToMicrons(ounces) });
  }

  const solvedDielectricHeightMm =
    estimate.value?.dielectricHeightMm ?? manualDimensions.dielectricHeightMm;
  const solvedTraceWidthMm =
    estimate.value?.traceWidthMm ?? manualDimensions.traceWidthMm;
  const solvedGapMm = estimate.value?.gapMm ?? manualDimensions.gapMm;
  const singleEndedOutOfTolerance = isOutsideTolerance(
    estimate.value?.singleEndedOhms ?? null,
    input.targetSingleEndedOhms,
    tolerancePercent,
  );
  const differentialOutOfTolerance = isOutsideTolerance(
    estimate.value?.differentialOhms ?? null,
    input.targetDifferentialOhms,
    tolerancePercent,
  );
  const traceGapSeries = useMemo(() => {
    if (configuration.signal !== "differential") {
      return { points: [], lowerBand: [], upperBand: [] };
    }

    return createTraceGapSeries(
      {
        ...input,
        dielectricHeightMm:
          estimate.value?.dielectricHeightMm ??
          manualDimensions.dielectricHeightMm,
      },
      estimate.value?.gapMm ?? manualDimensions.gapMm,
      tolerancePercent,
    );
  }, [
    configuration.signal,
    estimate.value?.dielectricHeightMm,
    estimate.value?.gapMm,
    input,
    manualDimensions.dielectricHeightMm,
    manualDimensions.gapMm,
    tolerancePercent,
  ]);

  return (
    <main className="shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Ossenna PCB Utilities</p>
          <h1 id="page-title">Impedance Geometry Estimator</h1>
          <p>
            Explore signal geometry, material assumptions, and planning
            dimensions for early PCB stackup decisions.
          </p>
        </div>

        <div className="layout-grid">
          <form className="panel visual-panel primary-panel">
            <div className="target-controls" aria-label="Impedance targets">
              <h2 className="target-heading">Target:</h2>
              <label className="target-single-ended">
                Single-ended
                <span className="field-unit">ohms</span>
                <input
                  min="20"
                  step="1"
                  type="number"
                  value={input.targetSingleEndedOhms}
                  onChange={(event) =>
                    updateNumber("targetSingleEndedOhms", event.target.value)
                  }
                />
              </label>

              <label className="target-check">
                <input
                  checked={configuration.signal === "differential"}
                  type="checkbox"
                  onChange={(event) =>
                    setConfiguration((current) => ({
                      ...current,
                      signal: event.target.checked
                        ? "differential"
                        : "single-ended",
                    }))
                  }
                />
                Differential
              </label>

              <label className="target-value target-differential">
                <span className="field-unit">ohms</span>
                <input
                  disabled={configuration.signal === "single-ended"}
                  min="40"
                  step="1"
                  type="number"
                  value={input.targetDifferentialOhms}
                  onChange={(event) =>
                    updateNumber("targetDifferentialOhms", event.target.value)
                  }
                />
              </label>

              {configuration.signal === "differential" ? (
                <label className="target-tolerance">
                  Tolerance band
                  <span className="field-unit">+/- {tolerancePercent}%</span>
                  <input
                    min="0"
                    max="20"
                    step="1"
                    type="range"
                    value={tolerancePercent}
                    onChange={(event) =>
                      setTolerancePercent(Number(event.target.value))
                    }
                  />
                </label>
              ) : (
                <div className="target-tolerance" aria-hidden="true" />
              )}

              <h2 className="calculated-heading">Calculated:</h2>
              <label className="target-calculated calculated-single-ended">
                Single-ended
                <span className="field-unit">ohms</span>
                <input
                  className={
                    singleEndedOutOfTolerance
                      ? "impedance-out-of-tolerance"
                      : undefined
                  }
                  readOnly
                  type="number"
                  value={
                    estimate.value
                      ? estimate.value.singleEndedOhms.toFixed(1)
                      : ""
                  }
                />
              </label>

              <div className="target-row-spacer" aria-hidden="true" />

              <label className="target-value target-calculated calculated-differential">
                <span className="field-unit">ohms</span>
                <input
                  className={
                    differentialOutOfTolerance
                      ? "impedance-out-of-tolerance"
                      : undefined
                  }
                  readOnly
                  type="number"
                  value={
                    estimate.value
                      ? estimate.value.differentialOhms.toFixed(1)
                      : ""
                  }
                />
              </label>
            </div>

            <div className="section-heading">
              <h2>Cross Section:</h2>
              <span>
                {configuration.coupling === "coplanar"
                  ? "Coplanar"
                  : "Microstrip"}
              </span>
            </div>

            <div className="cross-section-workbench">
              <aside className="stack-controls" aria-label="Stackup controls">
                <ThicknessField
                  label="Signal:"
                  value={signalThickness}
                  onChange={updateSignalThickness}
                />

                <div className="stack-divider" />

                <section
                  className="dielectric-controls"
                  aria-label="Dielectric controls"
                >
                  <h3>Dielectric:</h3>
                  <label className="dk-row">
                    Dk:
                    <input
                      min="1.01"
                      step="0.05"
                      type="number"
                      value={input.dielectricConstant}
                      onChange={(event) =>
                        updateNumber("dielectricConstant", event.target.value)
                      }
                    />
                  </label>
                  <div className="thickness-control-grid">
                    <LockButton
                      locked={dimensionLocks.dielectricHeight}
                      label="dielectric thickness"
                      onClick={() =>
                        toggleDimensionLock(
                          "dielectricHeight",
                          solvedDielectricHeightMm,
                        )
                      }
                    />
                    <div
                      className="dual-units"
                      aria-label="Dielectric thickness"
                    >
                      <label>
                        <span>mm</span>
                        <input
                          min="0.05"
                          max="0.6"
                          step="0.001"
                          type="number"
                          value={solvedDielectricHeightMm.toFixed(3)}
                          onChange={(event) =>
                            updateDielectricHeight(Number(event.target.value))
                          }
                        />
                      </label>
                      <label>
                        <span>mil</span>
                        <input
                          min="2"
                          max="24"
                          step="0.1"
                          type="number"
                          value={mmToMils(solvedDielectricHeightMm).toFixed(1)}
                          onChange={(event) =>
                            updateDielectricHeight(
                              Number(event.target.value) / mmToMils(1),
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <div className="stack-divider" />

                <ThicknessField
                  label="Plane:"
                  value={planeThickness}
                  onChange={updatePlaneThickness}
                />
              </aside>

              <div className="geometry-frame">
                <div
                  className="graphic-toggles"
                  aria-label="Cross section options"
                >
                  <label className="check-control">
                    <input
                      checked={configuration.coupling === "coplanar"}
                      type="checkbox"
                      onChange={(event) =>
                        setConfiguration((current) => ({
                          ...current,
                          coupling: event.target.checked
                            ? "coplanar"
                            : "non-coplanar",
                        }))
                      }
                    />
                    Coplanar
                  </label>
                  <label className="check-control">
                    <input
                      checked={configuration.solderMask === "with-mask"}
                      type="checkbox"
                      onChange={(event) =>
                        setConfiguration((current) => ({
                          ...current,
                          solderMask: event.target.checked
                            ? "with-mask"
                            : "without-mask",
                        }))
                      }
                    />
                    Mask
                  </label>
                </div>
                <div className="vertical-stepper visual-thickness-stepper">
                  <button
                    aria-label="Decrease dielectric thickness"
                    type="button"
                    onClick={() =>
                      updateDielectricHeight(solvedDielectricHeightMm - 0.01)
                    }
                  >
                    -
                  </button>
                  <input
                    aria-label="Dielectric thickness"
                    className="vertical-slider"
                    min="0.05"
                    max="0.6"
                    step="0.01"
                    type="range"
                    value={solvedDielectricHeightMm}
                    onChange={(event) =>
                      updateDielectricHeight(Number(event.target.value))
                    }
                  />
                  <button
                    aria-label="Increase dielectric thickness"
                    type="button"
                    onClick={() =>
                      updateDielectricHeight(solvedDielectricHeightMm + 0.01)
                    }
                  >
                    +
                  </button>
                </div>
                <GeometryGraphic
                  configuration={configuration}
                  estimate={estimate.value}
                  dielectricHeightMm={solvedDielectricHeightMm}
                  planeThicknessUm={planeThickness.microns}
                  signalThicknessUm={signalThickness.microns}
                />
                <GeometryReadouts
                  estimate={estimate.value}
                  locks={dimensionLocks}
                  signal={configuration.signal}
                  onGapChange={updateGap}
                  onGapLockToggle={() =>
                    toggleDimensionLock("gap", solvedGapMm)
                  }
                  onTraceLockToggle={() =>
                    toggleDimensionLock("traceWidth", solvedTraceWidthMm)
                  }
                  onTraceWidthChange={updateTraceWidth}
                />
              </div>
            </div>
          </form>

          <section className="panel results-panel" aria-live="polite">
            <div className="panel-heading">
              <h2>Estimate</h2>
              <span>Planning only</span>
            </div>

            {estimate.error ? (
              <div className="error">{estimate.error}</div>
            ) : estimate.value ? (
              <>
                <div className="metric-grid">
                  <ResultMetric
                    label="Trace width"
                    metric={formatMmMil(estimate.value.traceWidthMm)}
                    imperial="calculated"
                  />
                  <ResultMetric
                    label="Pair gap"
                    metric={
                      configuration.signal === "differential"
                        ? formatMmMil(estimate.value.gapMm)
                        : "N/A"
                    }
                    imperial={
                      configuration.signal === "differential"
                        ? "calculated"
                        : "single ended"
                    }
                  />
                  <ResultMetric
                    label="Signal copper"
                    metric={formatMicronMil(signalThickness.microns)}
                    imperial={`${micronsToOunces(signalThickness.microns).toFixed(2)} oz copper`}
                  />
                  <ResultMetric
                    label="Effective Dk"
                    metric={estimate.value.effectiveDielectricConstant.toFixed(
                      2,
                    )}
                    imperial="calculated"
                  />
                </div>

                <div className="notes">
                  <h3>Assumptions</h3>
                  <ul>
                    {estimate.value.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                    <li>
                      Coplanar, solder mask, and copper thickness corrections
                      are visual controls only.
                    </li>
                  </ul>
                </div>
              </>
            ) : null}
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading">
              <h2>Width vs Gap</h2>
              <span>
                {configuration.signal === "differential"
                  ? `+/- ${tolerancePercent}%`
                  : "Hidden"}
              </span>
            </div>
            {configuration.signal === "differential" ? (
              <TraceGapChart
                currentPoint={estimate.value}
                onPointSelect={updateTraceGap}
                lowerBand={traceGapSeries.lowerBand}
                points={traceGapSeries.points}
                targetOhms={input.targetDifferentialOhms}
                tolerancePercent={tolerancePercent}
                upperBand={traceGapSeries.upperBand}
              />
            ) : (
              <div className="empty-state">
                Select Differential Pair to inspect trace width versus gap.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

interface ThicknessFieldProps {
  label: string;
  value: ThicknessControl;
  onChange: (value: ThicknessControl["ounces"]) => void;
}

function ThicknessField({ label, value, onChange }: ThicknessFieldProps) {
  return (
    <fieldset className="thickness-field">
      <legend>{label}</legend>
      <select
        value={value.ounces}
        onChange={(event) =>
          onChange(event.target.value as ThicknessControl["ounces"])
        }
      >
        <option value="0.5">0.5 oz / 0.7mil / 17um</option>
        <option value="1">1 oz / 1.4mil / 35um</option>
      </select>
    </fieldset>
  );
}

interface GeometryReadoutsProps {
  estimate: ReturnType<typeof estimateDifferentialPair> | null;
  locks: DimensionLocks;
  signal: SignalMode;
  onGapChange: (valueMm: number) => void;
  onGapLockToggle: () => void;
  onTraceLockToggle: () => void;
  onTraceWidthChange: (valueMm: number) => void;
}

function GeometryReadouts({
  estimate,
  locks,
  signal,
  onGapChange,
  onGapLockToggle,
  onTraceLockToggle,
  onTraceWidthChange,
}: GeometryReadoutsProps) {
  const gapMm = signal === "differential" && estimate ? estimate.gapMm : null;
  const trackMm = estimate?.traceWidthMm ?? null;

  return (
    <div className="dimension-rail" aria-label="Track and gap controls">
      <DimensionReadout
        className="track-readout"
        label="Track:"
        locked={locks.traceWidth}
        valueMm={trackMm}
        onChange={onTraceWidthChange}
        onLockToggle={onTraceLockToggle}
      />
      <DimensionReadout
        className="gap-readout"
        label="Gap:"
        locked={locks.gap}
        valueMm={gapMm}
        onChange={onGapChange}
        onLockToggle={onGapLockToggle}
      />
    </div>
  );
}

interface DimensionReadoutProps {
  className: string;
  label: string;
  locked: boolean;
  valueMm: number | null;
  onChange: (valueMm: number) => void;
  onLockToggle: () => void;
}

function DimensionReadout({
  className,
  label,
  locked,
  valueMm,
  onChange,
  onLockToggle,
}: DimensionReadoutProps) {
  return (
    <div className={`dimension-readout ${className}`}>
      <h3>{label}</h3>
      <div className="dimension-body">
        <LockButton
          locked={locked}
          label={label.replace(":", "").toLowerCase()}
          onClick={onLockToggle}
        />
        <div className="dual-units">
          <label>
            <span>mm</span>
            <input
              disabled={valueMm === null}
              min="0.001"
              step="0.001"
              type="number"
              value={valueMm === null ? "" : valueMm.toFixed(3)}
              onChange={(event) => onChange(Number(event.target.value))}
            />
          </label>
          <label>
            <span>mil</span>
            <input
              disabled={valueMm === null}
              min="0.1"
              step="0.1"
              type="number"
              value={valueMm === null ? "" : mmToMils(valueMm).toFixed(1)}
              onChange={(event) =>
                onChange(Number(event.target.value) / mmToMils(1))
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}

interface LockButtonProps {
  label: string;
  locked: boolean;
  onClick: () => void;
}

function LockButton({ label, locked, onClick }: LockButtonProps) {
  return (
    <button
      aria-label={`${locked ? "Unlock" : "Lock"} ${label}`}
      aria-pressed={locked}
      className={locked ? "lock-button locked" : "lock-button unlocked"}
      type="button"
      onClick={onClick}
    >
      <svg aria-hidden="true" className="lock-icon-svg" viewBox="0 0 48 48">
        {locked ? (
          <path
            d="M15 21v-5a9 9 0 0 1 18 0v5M13 21h22a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V24a3 3 0 0 1 3-3Zm11 8v6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        ) : (
          <path
            d="M31 19v-3a9 9 0 0 0-17-4M13 21h22a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V24a3 3 0 0 1 3-3Zm11 8v6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        )}
      </svg>
    </button>
  );
}

interface ResultMetricProps {
  label: string;
  metric: string;
  imperial: string;
}

function ResultMetric({ label, metric, imperial }: ResultMetricProps) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{metric}</strong>
      <small>{imperial}</small>
    </div>
  );
}

interface GeometryGraphicProps {
  configuration: ImpedanceConfiguration;
  estimate: ReturnType<typeof estimateDifferentialPair> | null;
  dielectricHeightMm: number;
  planeThicknessUm: number;
  signalThicknessUm: number;
}

function GeometryGraphic({
  configuration,
  estimate,
  dielectricHeightMm,
  planeThicknessUm,
  signalThicknessUm,
}: GeometryGraphicProps) {
  const traceWidth = estimate ? previewTraceWidth(estimate.traceWidthMm) : 92;
  const gapWidth = estimate ? previewGapWidth(estimate.gapMm) : 60;
  const traceHeight = Math.max(12, signalThicknessUm / 2.4);
  const hasMask = configuration.solderMask === "with-mask";
  const isDifferential = configuration.signal === "differential";
  const isCoplanar = configuration.coupling === "coplanar";
  const surfaceY = 206;
  const dielectricVisualHeight = scale(
    clamp(dielectricHeightMm, 0.05, 0.6),
    0.05,
    0.6,
    72,
    182,
  );
  const boardBottomY = surfaceY + dielectricVisualHeight;
  const leftTraceX = 380 - traceWidth - gapWidth / 2;
  const rightTraceX = 380 + gapWidth / 2;
  const singleTraceX = 380 - traceWidth / 2;
  const coplanarShapes = isCoplanar
    ? [
        { x: 112, width: 142 },
        { x: 506, width: 142 },
      ]
    : [];
  const traceShapes = isDifferential
    ? [
        { x: leftTraceX, width: traceWidth },
        { x: rightTraceX, width: traceWidth },
      ]
    : [{ x: singleTraceX, width: traceWidth }];
  const maskPath = createSolderMaskPath(
    [...coplanarShapes, ...traceShapes],
    surfaceY,
    traceHeight,
  );

  return (
    <svg className="geometry-svg" role="img" viewBox="0 0 760 430">
      <title>Selected PCB impedance geometry</title>
      <rect
        className="svg-board"
        x="62"
        y={surfaceY}
        width="636"
        height={dielectricVisualHeight}
        rx="12"
      />
      <rect
        className="svg-plane"
        x="88"
        y={boardBottomY}
        width="584"
        height={Math.max(9, planeThicknessUm / 2.5)}
        rx="2"
      />

      {hasMask ? <path className="svg-mask" d={maskPath} /> : null}

      {isCoplanar ? (
        <>
          <polygon
            className="svg-ground"
            points={trapezoidPoints(112, surfaceY, 142, traceHeight)}
          />
          <polygon
            className="svg-ground"
            points={trapezoidPoints(506, surfaceY, 142, traceHeight)}
          />
        </>
      ) : null}

      {traceShapes.map((trace) => (
        <polygon
          className="svg-trace"
          key={`${trace.x}-${trace.width}`}
          points={trapezoidPoints(trace.x, surfaceY, trace.width, traceHeight)}
        />
      ))}

      {isDifferential ? (
        <>
          <line
            className="svg-measure"
            x1={380 - gapWidth / 2}
            y1={surfaceY - traceHeight - 34}
            x2={380 + gapWidth / 2}
            y2={surfaceY - traceHeight - 34}
          />
          <text
            className="svg-label"
            x="380"
            y={surfaceY - traceHeight - 43}
            textAnchor="middle"
          >
            gap
          </text>
        </>
      ) : null}
      <line
        className="svg-measure"
        x1="704"
        y1={surfaceY}
        x2="704"
        y2={boardBottomY}
      />
      <text
        className="svg-label"
        x="690"
        y={(surfaceY + boardBottomY) / 2}
        textAnchor="end"
      >
        {formatMmMil(dielectricHeightMm)} dielectric
      </text>
      <text className="svg-label dark" x="380" y="382" textAnchor="middle">
        {isCoplanar
          ? "coplanar reference copper plus plane"
          : "reference plane"}
      </text>
    </svg>
  );
}

interface TraceGapChartProps {
  currentPoint: ReturnType<typeof estimateDifferentialPair> | null;
  lowerBand: TraceGapPoint[];
  onPointSelect: (traceWidthMm: number, gapMm: number) => void;
  points: TraceGapPoint[];
  targetOhms: number;
  tolerancePercent: number;
  upperBand: TraceGapPoint[];
}

function TraceGapChart({
  currentPoint,
  lowerBand,
  onPointSelect,
  points,
  targetOhms,
  tolerancePercent,
  upperBand,
}: TraceGapChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TraceGapPoint | null>(null);

  if (points.length < 2) {
    return (
      <div className="empty-state">
        Current inputs do not produce a usable sweep.
      </div>
    );
  }

  const width = 640;
  const height = 300;
  const plotLeft = 112;
  const plotRight = width - 46;
  const plotTop = 46;
  const plotBottom = height - 66;
  const gapValues = [
    ...points.map((point) => point.gapMm),
    ...(currentPoint ? [currentPoint.gapMm] : []),
  ];
  const minGap = Math.min(...gapValues);
  const maxGap = Math.max(...gapValues);
  const hasToleranceBand =
    tolerancePercent > 0 && lowerBand.length > 1 && upperBand.length > 1;
  const traceValues = [...lowerBand, ...points, ...upperBand].map(
    (point) => point.traceWidthMm,
  );
  if (currentPoint) {
    traceValues.push(currentPoint.traceWidthMm);
  }
  const minTrace = Math.min(...traceValues);
  const maxTrace = Math.max(...traceValues);
  const currentPointOutOfTolerance = currentPoint
    ? isOutsideTolerance(
        currentPoint.differentialOhms,
        targetOhms,
        tolerancePercent,
      )
    : false;
  const currentPointStatus = currentPointOutOfTolerance
    ? "outside target"
    : "within target";
  const currentPointX = currentPoint
    ? scale(currentPoint.gapMm, minGap, maxGap, plotLeft, plotRight)
    : null;
  const currentPointY = currentPoint
    ? scale(currentPoint.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop)
    : null;
  const path = points
    .map((point, index) => {
      const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const y = scale(
        point.traceWidthMm,
        minTrace,
        maxTrace,
        plotBottom,
        plotTop,
      );
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const upperPath = lowerBand
    .map((point, index) => {
      const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const y = scale(
        point.traceWidthMm,
        minTrace,
        maxTrace,
        plotBottom,
        plotTop,
      );
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const lowerPath = upperBand
    .map((point) => {
      const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const y = scale(
        point.traceWidthMm,
        minTrace,
        maxTrace,
        plotBottom,
        plotTop,
      );
      return `L ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .reverse()
    .join(" ");
  const bandPath = hasToleranceBand ? `${upperPath} ${lowerPath} Z` : "";
  const activeX = hoveredPoint
    ? scale(hoveredPoint.gapMm, minGap, maxGap, plotLeft, plotRight)
    : null;
  const activeY = hoveredPoint
    ? scale(hoveredPoint.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop)
    : null;

  function handleChartMove(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const xInSvg = ((event.clientX - bounds.left) / bounds.width) * width;
    const yInSvg = ((event.clientY - bounds.top) / bounds.height) * height;

    if (
      xInSvg < plotLeft ||
      xInSvg > plotRight ||
      yInSvg < plotTop ||
      yInSvg > plotBottom
    ) {
      setHoveredPoint(null);
      return;
    }

    const nearest = points.reduce((best, point) => {
      const pointX = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const bestX = scale(best.gapMm, minGap, maxGap, plotLeft, plotRight);
      return Math.abs(pointX - xInSvg) < Math.abs(bestX - xInSvg)
        ? point
        : best;
    }, points[0]);

    setHoveredPoint(nearest);
  }

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        onMouseLeave={() => setHoveredPoint(null)}
        onMouseMove={handleChartMove}
      >
        <title>Trace width versus gap for target differential impedance</title>
        <line
          className="axis"
          x1={plotLeft}
          y1={plotBottom}
          x2={plotRight}
          y2={plotBottom}
        />
        <line
          className="axis"
          x1={plotLeft}
          y1={plotTop}
          x2={plotLeft}
          y2={plotBottom}
        />
        <text
          className="chart-tick"
          x={plotLeft}
          y={height - 29}
          textAnchor="start"
        >
          {formatMmMil(minGap)}
        </text>
        <text
          className="chart-tick"
          x={plotRight}
          y={height - 29}
          textAnchor="end"
        >
          {formatMmMil(maxGap)}
        </text>
        <text
          className="chart-tick"
          x={plotLeft + 8}
          y={plotBottom - 7}
          textAnchor="start"
        >
          {formatMmMil(minTrace)}
        </text>
        <text
          className="chart-tick"
          x={plotLeft + 8}
          y={plotTop + 13}
          textAnchor="start"
        >
          {formatMmMil(maxTrace)}
        </text>
        {hasToleranceBand ? <path className="chart-band" d={bandPath} /> : null}
        <path className="chart-line" d={path} />
        {points.map((point) => {
          const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
          const y = scale(
            point.traceWidthMm,
            minTrace,
            maxTrace,
            plotBottom,
            plotTop,
          );
          return (
            <circle
              key={point.gapMm}
              className="chart-dot"
              cx={x}
              cy={y}
              onClick={() => onPointSelect(point.traceWidthMm, point.gapMm)}
              r="3.5"
            />
          );
        })}
        {points.map((point) => {
          const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
          const y = scale(
            point.traceWidthMm,
            minTrace,
            maxTrace,
            plotBottom,
            plotTop,
          );
          return (
            <circle
              key={`hit-${point.gapMm}`}
              className="chart-hit-dot"
              cx={x}
              cy={y}
              onClick={() => onPointSelect(point.traceWidthMm, point.gapMm)}
              r="12"
            />
          );
        })}
        {hoveredPoint && activeX !== null && activeY !== null ? (
          <>
            <line
              className="crosshair"
              x1={activeX}
              y1={plotTop}
              x2={activeX}
              y2={plotBottom}
            />
            <line
              className="crosshair"
              x1={plotLeft}
              y1={activeY}
              x2={plotRight}
              y2={activeY}
            />
            <circle
              className="chart-active-dot"
              cx={activeX}
              cy={activeY}
              r="6"
            />
          </>
        ) : null}
        {currentPoint && currentPointX !== null && currentPointY !== null ? (
          <circle
            className={
              currentPointOutOfTolerance
                ? "chart-current-dot outside"
                : "chart-current-dot within"
            }
            cx={currentPointX}
            cy={currentPointY}
            r="8"
          >
            <title>
              Track {formatMmMil(currentPoint.traceWidthMm)}, gap{" "}
              {formatMmMil(currentPoint.gapMm)}, differential{" "}
              {currentPoint.differentialOhms.toFixed(1)} ohms,{" "}
              {currentPointStatus}
            </title>
          </circle>
        ) : null}
        <text
          className="chart-label"
          x={width / 2}
          y={height - 12}
          textAnchor="middle"
        >
          Gap between traces
        </text>
        <text
          className="chart-label"
          textAnchor="middle"
          transform={`translate(18 ${height / 2}) rotate(-90)`}
        >
          Trace width
        </text>
      </svg>
      <p className="chart-unit-note">Units are mil (mm)</p>
      <div className="chart-hover-readout" aria-live="polite">
        {hoveredPoint ? (
          <>
            <span>
              <strong>Track: </strong>
              {formatMilMm(hoveredPoint.traceWidthMm)}
            </span>
            <span>
              <strong>Gap: </strong>
              {formatMilMm(hoveredPoint.gapMm)}
            </span>
            <span>
              <strong>Band: </strong>+/-{tolerancePercent}%
            </span>
          </>
        ) : (
          <span>No point selected</span>
        )}
      </div>
      <div className="chart-stats">
        <span>{targetOhms.toFixed(0)} ohm target</span>
        <span>+/- {tolerancePercent}% tolerance</span>
        <span>
          {formatMmMil(minGap)} - {formatMmMil(maxGap)} gap
        </span>
        <span>
          {formatMmMil(minTrace)} - {formatMmMil(maxTrace)} width
        </span>
        {currentPoint ? (
          <span
            className={
              currentPointOutOfTolerance
                ? "chart-current-stat outside"
                : "chart-current-stat within"
            }
          >
            track/gap {currentPointStatus}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function createTraceGapSeries(
  input: DifferentialPairInput,
  currentGapMm: number,
  tolerancePercent: number,
): TraceGapSeries {
  const defaultMinimumGap = Math.max(0.05, input.dielectricHeightMm * 0.35);
  const minimumGap = Math.max(
    0.001,
    Math.min(defaultMinimumGap, currentGapMm * 0.75),
  );
  const maximumGap = Math.max(
    minimumGap + 0.12,
    input.dielectricHeightMm * 3.2,
    currentGapMm * 1.2,
  );
  const steps = 13;
  const points: TraceGapPoint[] = [];
  const lowerBand: TraceGapPoint[] = [];
  const upperBand: TraceGapPoint[] = [];
  const toleranceRatio = tolerancePercent / 100;
  const lowerTargetOhms = input.targetDifferentialOhms * (1 - toleranceRatio);
  const upperTargetOhms = input.targetDifferentialOhms * (1 + toleranceRatio);

  for (let index = 0; index < steps; index += 1) {
    const gapMm =
      minimumGap + ((maximumGap - minimumGap) * index) / (steps - 1);
    try {
      points.push(
        estimateTraceWidthForDifferentialGap(
          input.targetDifferentialOhms,
          gapMm,
          input.dielectricHeightMm,
          input.dielectricConstant,
        ),
      );
    } catch {
      continue;
    }

    try {
      lowerBand.push(
        estimateTraceWidthForDifferentialGap(
          lowerTargetOhms,
          gapMm,
          input.dielectricHeightMm,
          input.dielectricConstant,
        ),
      );
      upperBand.push(
        estimateTraceWidthForDifferentialGap(
          upperTargetOhms,
          gapMm,
          input.dielectricHeightMm,
          input.dielectricConstant,
        ),
      );
    } catch {
      continue;
    }
  }

  return { points, lowerBand, upperBand };
}

function ouncesToMicrons(ounces: ThicknessControl["ounces"]): number {
  return Number(ounces) * 34.8;
}

function micronsToOunces(microns: number): number {
  return microns / 34.8;
}

function formatMmMil(valueMm: number): string {
  return `${valueMm.toFixed(3)} mm / ${mmToMils(valueMm).toFixed(1)} mil`;
}

function formatMilMm(valueMm: number): string {
  return `${mmToMils(valueMm).toFixed(1)} (${valueMm.toFixed(3)})`;
}

function formatMicronMil(valueMicrons: number): string {
  const valueMm = valueMicrons / 1000;
  return formatMmMil(valueMm);
}

function isOutsideTolerance(
  calculatedOhms: number | null,
  targetOhms: number,
  tolerancePercent: number,
): boolean {
  if (
    calculatedOhms === null ||
    !Number.isFinite(calculatedOhms) ||
    !Number.isFinite(targetOhms)
  ) {
    return false;
  }

  return (
    Math.abs(calculatedOhms - targetOhms) >
    targetOhms * (tolerancePercent / 100)
  );
}

function trapezoidPoints(
  x: number,
  surfaceY: number,
  bottomWidth: number,
  height: number,
): string {
  const topInset = bottomWidth * 0.07;
  return [
    `${x},${surfaceY}`,
    `${x + bottomWidth},${surfaceY}`,
    `${x + bottomWidth - topInset},${surfaceY - height}`,
    `${x + topInset},${surfaceY - height}`,
  ].join(" ");
}

function createSolderMaskPath(
  traces: Array<{ x: number; width: number }>,
  surfaceY: number,
  traceHeight: number,
): string {
  const clearance = 3;
  const maskSurfaceY = surfaceY - clearance;
  const maskTopY = surfaceY - traceHeight - clearance;
  const left = 76;
  const right = 684;
  const expandedTraces = traces
    .map((trace) => ({
      x: trace.x - 4,
      width: trace.width + 8,
    }))
    .sort((a, b) => a.x - b.x);

  let path = `M ${left} ${maskSurfaceY}`;

  for (const trace of expandedTraces) {
    const topInset = trace.width * 0.07;
    path += ` H ${trace.x}`;
    path += ` L ${trace.x + topInset} ${maskTopY}`;
    path += ` H ${trace.x + trace.width - topInset}`;
    path += ` L ${trace.x + trace.width} ${maskSurfaceY}`;
  }

  path += ` H ${right}`;
  return path;
}

function previewTraceWidth(widthMm: number): number {
  return clamp(widthMm * 160, 48, 138);
}

function previewGapWidth(gapMm: number): number {
  return clamp(gapMm * 190, 28, 120);
}

function scale(
  value: number,
  inputMinimum: number,
  inputMaximum: number,
  outputMinimum: number,
  outputMaximum: number,
): number {
  if (inputMaximum === inputMinimum) {
    return (outputMinimum + outputMaximum) / 2;
  }

  return (
    outputMinimum +
    ((value - inputMinimum) / (inputMaximum - inputMinimum)) *
      (outputMaximum - outputMinimum)
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export default App;
