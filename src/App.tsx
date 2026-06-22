import { useMemo, useState, type MouseEvent } from "react";
import {
  estimateDifferentialPair,
  estimateTraceWidthForDifferentialGap,
  mmToMils,
  type DifferentialPairInput,
  type TraceGapPoint,
} from "./calculators/differentialPair";
import "./App.css";

type CouplingMode = "coplanar" | "non-coplanar";
type SignalMode = "differential" | "single-ended";
type SolderMaskMode = "with-mask" | "without-mask";
type ThicknessUnit = "oz" | "um";

interface ThicknessControl {
  unit: ThicknessUnit;
  ounces: "0.5" | "1";
  microns: number;
}

interface ImpedanceConfiguration {
  coupling: CouplingMode;
  signal: SignalMode;
  solderMask: SolderMaskMode;
}

const initialInput: DifferentialPairInput = {
  dielectricHeightMm: 0.18,
  dielectricConstant: 4.2,
  copperThicknessUm: 35,
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
  unit: "oz",
  ounces: "1",
  microns: 35,
};

function App() {
  const [input, setInput] = useState<DifferentialPairInput>(initialInput);
  const [configuration, setConfiguration] = useState<ImpedanceConfiguration>(initialConfiguration);
  const [signalThickness, setSignalThickness] = useState<ThicknessControl>(initialThickness);
  const [planeThickness, setPlaneThickness] = useState<ThicknessControl>(initialThickness);
  const [tolerancePercent, setTolerancePercent] = useState(8);

  const estimate = useMemo(() => {
    try {
      return { value: estimateDifferentialPair(input), error: null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Invalid inputs." };
    }
  }, [input]);

  const traceGapSeries = useMemo(() => {
    if (configuration.signal !== "differential") {
      return [];
    }

    return createTraceGapSeries(input);
  }, [configuration.signal, input]);

  function updateNumber(field: keyof DifferentialPairInput, value: string) {
    setInput((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  function updateSignalThickness(next: ThicknessControl) {
    const microns = thicknessToMicrons(next);
    setSignalThickness({ ...next, microns });
    setInput((current) => ({
      ...current,
      copperThicknessUm: microns,
    }));
  }

  function updatePlaneThickness(next: ThicknessControl) {
    setPlaneThickness({ ...next, microns: thicknessToMicrons(next) });
  }

  return (
    <main className="shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Ossenna PCB Utilities</p>
          <h1 id="page-title">Impedance Geometry Estimator</h1>
          <p>
            Explore signal geometry, material assumptions, and planning dimensions for early PCB
            stackup decisions.
          </p>
        </div>

        <div className="layout-grid">
          <form className="panel visual-panel primary-panel">
            <div className="panel-heading">
              <h2>Cross Section</h2>
              <span>{configuration.coupling === "coplanar" ? "Coplanar" : "Microstrip"}</span>
            </div>

            <div className="cross-section-workbench">
              <div className="geometry-frame">
                <div className="graphic-toggles" aria-label="Cross section options">
                  <label className="check-control">
                    <input
                      checked={configuration.signal === "differential"}
                      type="checkbox"
                      onChange={(event) =>
                        setConfiguration((current) => ({
                          ...current,
                          signal: event.target.checked ? "differential" : "single-ended",
                        }))
                      }
                    />
                    Differential
                  </label>
                  <label className="check-control">
                    <input
                      checked={configuration.coupling === "coplanar"}
                      type="checkbox"
                      onChange={(event) =>
                        setConfiguration((current) => ({
                          ...current,
                          coupling: event.target.checked ? "coplanar" : "non-coplanar",
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
                          solderMask: event.target.checked ? "with-mask" : "without-mask",
                        }))
                      }
                    />
                    Mask
                  </label>
                </div>
                <GeometryGraphic
                  configuration={configuration}
                  estimate={estimate.value}
                  dielectricHeightMm={input.dielectricHeightMm}
                  planeThicknessUm={planeThickness.microns}
                  signalThicknessUm={signalThickness.microns}
                />
              </div>

              <div className="surface-controls material-controls">
                <div className="input-row">
                  <label>
                    Prepreg / core
                    <span className="field-unit">{formatMmMil(input.dielectricHeightMm)}</span>
                    <input
                      min="0.05"
                      max="0.6"
                      step="0.01"
                      type="range"
                      value={input.dielectricHeightMm}
                      onChange={(event) => updateNumber("dielectricHeightMm", event.target.value)}
                    />
                  </label>

                  <label>
                    Dk
                    <span className="field-unit">dielectric constant</span>
                    <input
                      min="1.01"
                      step="0.05"
                      type="number"
                      value={input.dielectricConstant}
                      onChange={(event) => updateNumber("dielectricConstant", event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="surface-controls copper-controls">
                <div className="input-row">
                  <ThicknessField
                    label="Signal copper"
                    value={signalThickness}
                    onChange={updateSignalThickness}
                  />
                  <ThicknessField
                    label="Plane copper"
                    value={planeThickness}
                    onChange={updatePlaneThickness}
                  />
                </div>

                <div className="input-row">
                  <label>
                    Single-ended target
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

                  <label>
                    Differential target
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
                </div>
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
                    imperial={configuration.signal === "differential" ? "calculated" : "single ended"}
                  />
                  <ResultMetric
                    label="Signal copper"
                    metric={formatMicronMil(signalThickness.microns)}
                    imperial={`${micronsToOunces(signalThickness.microns).toFixed(2)} oz copper`}
                  />
                  <ResultMetric
                    label="Effective Dk"
                    metric={estimate.value.effectiveDielectricConstant.toFixed(2)}
                    imperial="calculated"
                  />
                </div>

                <div className="notes">
                  <h3>Assumptions</h3>
                  <ul>
                    {estimate.value.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                    <li>Coplanar, solder mask, and copper thickness corrections are visual controls only.</li>
                  </ul>
                </div>
              </>
            ) : null}
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading">
              <h2>Width vs Gap</h2>
              <span>
                {configuration.signal === "differential" ? `+/- ${tolerancePercent}%` : "Hidden"}
              </span>
            </div>
            {configuration.signal === "differential" ? (
              <>
                <label className="tolerance-control">
                  Tolerance band
                  <span className="field-unit">+/- {tolerancePercent}%</span>
                  <input
                    min="0"
                    max="20"
                    step="1"
                    type="range"
                    value={tolerancePercent}
                    onChange={(event) => setTolerancePercent(Number(event.target.value))}
                  />
                </label>
                <TraceGapChart
                  points={traceGapSeries}
                  targetOhms={input.targetDifferentialOhms}
                  tolerancePercent={tolerancePercent}
                />
              </>
            ) : (
              <div className="empty-state">Select Differential Pair to inspect trace width versus gap.</div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

interface SegmentButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function SegmentButton({ active, label, onClick }: SegmentButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={active ? "segment active" : "segment"}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface ThicknessFieldProps {
  label: string;
  value: ThicknessControl;
  onChange: (value: ThicknessControl) => void;
}

function ThicknessField({ label, value, onChange }: ThicknessFieldProps) {
  return (
    <fieldset className="thickness-field">
      <legend>{label}</legend>
      <span className="field-unit">{formatMicronMil(value.microns)}</span>
      <div className="segmented compact">
        <SegmentButton
          active={value.unit === "oz"}
          label="Copper oz"
          onClick={() => onChange({ ...value, unit: "oz" })}
        />
        <SegmentButton
          active={value.unit === "um"}
          label="Microns"
          onClick={() => onChange({ ...value, unit: "um" })}
        />
      </div>
      {value.unit === "oz" ? (
        <select
          value={value.ounces}
          onChange={(event) =>
            onChange({ ...value, ounces: event.target.value as ThicknessControl["ounces"] })
          }
        >
          <option value="0.5">0.5 oz copper</option>
          <option value="1">1 oz copper</option>
        </select>
      ) : (
        <input
          min="1"
          step="1"
          type="number"
          value={value.microns}
          onChange={(event) => onChange({ ...value, microns: Number(event.target.value) })}
        />
      )}
    </fieldset>
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
  const boardBottomY = 330;
  const dielectricVisualHeight = scale(dielectricHeightMm, 0.05, 0.6, 72, 182);
  const surfaceY = boardBottomY - dielectricVisualHeight;
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
  const maskPath = createSolderMaskPath([...coplanarShapes, ...traceShapes], surfaceY, traceHeight);

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
      <line className="svg-measure" x1="704" y1={surfaceY} x2="704" y2={boardBottomY} />
      <text className="svg-label" x="690" y={(surfaceY + boardBottomY) / 2} textAnchor="end">
        {formatMmMil(dielectricHeightMm)} dielectric
      </text>
      <text className="svg-label dark" x="380" y="382" textAnchor="middle">
        {isCoplanar ? "coplanar reference copper plus plane" : "reference plane"}
      </text>
    </svg>
  );
}

interface TraceGapChartProps {
  points: TraceGapPoint[];
  targetOhms: number;
  tolerancePercent: number;
}

function TraceGapChart({ points, targetOhms, tolerancePercent }: TraceGapChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TraceGapPoint | null>(null);

  if (points.length < 2) {
    return <div className="empty-state">Current inputs do not produce a usable sweep.</div>;
  }

  const width = 640;
  const height = 300;
  const plotLeft = 112;
  const plotRight = width - 46;
  const plotTop = 46;
  const plotBottom = height - 66;
  const minGap = Math.min(...points.map((point) => point.gapMm));
  const maxGap = Math.max(...points.map((point) => point.gapMm));
  const toleranceRatio = tolerancePercent / 100;
  const lowerBand = points.map((point) => ({
    ...point,
    traceWidthMm: point.traceWidthMm * (1 - toleranceRatio),
  }));
  const upperBand = points.map((point) => ({
    ...point,
    traceWidthMm: point.traceWidthMm * (1 + toleranceRatio),
  }));
  const traceValues = [...lowerBand, ...points, ...upperBand].map((point) => point.traceWidthMm);
  const minTrace = Math.min(...traceValues);
  const maxTrace = Math.max(...traceValues);
  const path = points
    .map((point, index) => {
      const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const y = scale(point.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const upperPath = upperBand
    .map((point, index) => {
      const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const y = scale(point.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const lowerPath = lowerBand
    .map((point) => {
      const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const y = scale(point.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop);
      return `L ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .reverse()
    .join(" ");
  const bandPath = `${upperPath} ${lowerPath} Z`;
  const activePoint = hoveredPoint ?? points[Math.floor(points.length / 2)];
  const activeX = scale(activePoint.gapMm, minGap, maxGap, plotLeft, plotRight);
  const activeY = scale(activePoint.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop);

  function handleChartMove(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const xInSvg = ((event.clientX - bounds.left) / bounds.width) * width;
    const nearest = points.reduce((best, point) => {
      const pointX = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
      const bestX = scale(best.gapMm, minGap, maxGap, plotLeft, plotRight);
      return Math.abs(pointX - xInSvg) < Math.abs(bestX - xInSvg) ? point : best;
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
        <line className="axis" x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} />
        <line className="axis" x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} />
        <text className="chart-tick" x={plotLeft} y={height - 29} textAnchor="start">
          {formatMmMil(minGap)}
        </text>
        <text className="chart-tick" x={plotRight} y={height - 29} textAnchor="end">
          {formatMmMil(maxGap)}
        </text>
        <text className="chart-tick" x={plotLeft + 8} y={plotBottom - 7} textAnchor="start">
          {formatMmMil(minTrace)}
        </text>
        <text className="chart-tick" x={plotLeft + 8} y={plotTop + 13} textAnchor="start">
          {formatMmMil(maxTrace)}
        </text>
        {tolerancePercent > 0 ? <path className="chart-band" d={bandPath} /> : null}
        <path className="chart-line" d={path} />
        {points.map((point) => {
          const x = scale(point.gapMm, minGap, maxGap, plotLeft, plotRight);
          const y = scale(point.traceWidthMm, minTrace, maxTrace, plotBottom, plotTop);
          return <circle key={point.gapMm} className="chart-dot" cx={x} cy={y} r="3.5" />;
        })}
        <line className="crosshair" x1={activeX} y1={plotTop} x2={activeX} y2={plotBottom} />
        <line className="crosshair" x1={plotLeft} y1={activeY} x2={plotRight} y2={activeY} />
        <circle className="chart-active-dot" cx={activeX} cy={activeY} r="6" />
        <g transform={`translate(${Math.min(activeX + 14, width - 190)} ${Math.max(activeY - 58, 18)})`}>
          <rect
            className="chart-tooltip"
            width="170"
            height={tolerancePercent > 0 ? "66" : "48"}
            rx="7"
          />
          <text className="chart-tooltip-text" x="10" y="19">
            gap {formatMmMil(activePoint.gapMm)}
          </text>
          <text className="chart-tooltip-text" x="10" y="37">
            width {formatMmMil(activePoint.traceWidthMm)}
          </text>
          {tolerancePercent > 0 ? (
            <text className="chart-tooltip-text subtle" x="10" y="55">
              band +/- {tolerancePercent}%
            </text>
          ) : null}
        </g>
        <text className="chart-label" x={width / 2} y={height - 12} textAnchor="middle">
          Gap between traces (mm / mil)
        </text>
        <text
          className="chart-label"
          textAnchor="middle"
          transform={`translate(18 ${height / 2}) rotate(-90)`}
        >
          Trace width (mm / mil)
        </text>
      </svg>
      <div className="chart-stats">
        <span>{targetOhms.toFixed(0)} ohm target</span>
        <span>+/- {tolerancePercent}% tolerance</span>
        <span>
          {formatMmMil(minGap)} - {formatMmMil(maxGap)} gap
        </span>
        <span>
          {formatMmMil(minTrace)} - {formatMmMil(maxTrace)} width
        </span>
      </div>
    </div>
  );
}

function createTraceGapSeries(input: DifferentialPairInput): TraceGapPoint[] {
  const minimumGap = Math.max(0.05, input.dielectricHeightMm * 0.35);
  const maximumGap = Math.max(minimumGap + 0.12, input.dielectricHeightMm * 3.2);
  const steps = 13;
  const points: TraceGapPoint[] = [];

  for (let index = 0; index < steps; index += 1) {
    const gapMm = minimumGap + ((maximumGap - minimumGap) * index) / (steps - 1);
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
  }

  return points;
}

function thicknessToMicrons(thickness: ThicknessControl): number {
  if (thickness.unit === "oz") {
    return Number(thickness.ounces) * 34.8;
  }

  return thickness.microns;
}

function micronsToOunces(microns: number): number {
  return microns / 34.8;
}

function formatMmMil(valueMm: number): string {
  return `${valueMm.toFixed(3)} mm / ${mmToMils(valueMm).toFixed(1)} mil`;
}

function formatMicronMil(valueMicrons: number): string {
  const valueMm = valueMicrons / 1000;
  return formatMmMil(valueMm);
}

function trapezoidPoints(x: number, surfaceY: number, bottomWidth: number, height: number): string {
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
    ((value - inputMinimum) / (inputMaximum - inputMinimum)) * (outputMaximum - outputMinimum)
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export default App;
