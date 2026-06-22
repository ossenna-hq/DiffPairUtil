import { useMemo, useState } from "react";
import {
  estimateDifferentialPair,
  mmToMils,
  type DifferentialPairInput,
} from "./calculators/differentialPair";
import { materials } from "./data/materials";
import { jlcpcbStackups } from "./data/suppliers/jlcpcb";
import { pcbwayStackups, type SupplierStackup } from "./data/suppliers/pcbway";
import "./App.css";

const supplierStackups: SupplierStackup[] = [...pcbwayStackups, ...jlcpcbStackups];

const initialInput: DifferentialPairInput = {
  dielectricHeightMm: 0.18,
  dielectricConstant: 4.2,
  copperThicknessUm: 35,
  targetDifferentialOhms: 90,
  targetSingleEndedOhms: 50,
  geometry: "microstrip",
};

function App() {
  const [input, setInput] = useState<DifferentialPairInput>(initialInput);
  const [selectedMaterial, setSelectedMaterial] = useState("fr4-generic");
  const [selectedStackup, setSelectedStackup] = useState("manual");

  const estimate = useMemo(() => {
    try {
      return { value: estimateDifferentialPair(input), error: null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Invalid inputs." };
    }
  }, [input]);

  function updateNumber(field: keyof DifferentialPairInput, value: string) {
    setInput((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  function applyMaterial(materialId: string) {
    setSelectedMaterial(materialId);
    const material = materials.find((candidate) => candidate.id === materialId);
    if (material) {
      setInput((current) => ({
        ...current,
        dielectricConstant: material.dielectricConstant,
      }));
    }
  }

  function applyStackup(stackupId: string) {
    setSelectedStackup(stackupId);
    const stackup = supplierStackups.find((candidate) => candidate.id === stackupId);
    if (stackup) {
      setInput((current) => ({
        ...current,
        dielectricHeightMm: stackup.dielectricHeightMm,
        dielectricConstant: stackup.dielectricConstant,
        copperThicknessUm: stackup.copperThicknessUm,
      }));
    }
  }

  return (
    <main className="shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Ossenna PCB Utilities</p>
          <h1 id="page-title">Differential Pair Width and Gap Estimator</h1>
          <p>
            Estimate edge-coupled microstrip dimensions from dielectric height, Dk, copper
            thickness, and target impedance before checking the result with your fabricator.
          </p>
        </div>

        <div className="tool-grid">
          <form className="panel input-panel">
            <div className="panel-heading">
              <h2>Inputs</h2>
              <span>Microstrip</span>
            </div>

            <label>
              Supplier preset
              <select value={selectedStackup} onChange={(event) => applyStackup(event.target.value)}>
                <option value="manual">Manual inputs</option>
                {supplierStackups.map((stackup) => (
                  <option key={stackup.id} value={stackup.id}>
                    {stackup.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Material
              <select value={selectedMaterial} onChange={(event) => applyMaterial(event.target.value)}>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} - Dk {material.dielectricConstant}
                  </option>
                ))}
              </select>
            </label>

            <div className="input-row">
              <label>
                Dielectric height
                <span className="field-unit">mm</span>
                <input
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={input.dielectricHeightMm}
                  onChange={(event) => updateNumber("dielectricHeightMm", event.target.value)}
                />
              </label>

              <label>
                Dielectric constant
                <span className="field-unit">Dk</span>
                <input
                  min="1.01"
                  step="0.05"
                  type="number"
                  value={input.dielectricConstant}
                  onChange={(event) => updateNumber("dielectricConstant", event.target.value)}
                />
              </label>
            </div>

            <div className="input-row">
              <label>
                Copper thickness
                <span className="field-unit">um</span>
                <input
                  min="1"
                  step="1"
                  type="number"
                  value={input.copperThicknessUm}
                  onChange={(event) => updateNumber("copperThicknessUm", event.target.value)}
                />
              </label>

              <label>
                Single-ended target
                <span className="field-unit">ohms</span>
                <input
                  min="20"
                  step="1"
                  type="number"
                  value={input.targetSingleEndedOhms}
                  onChange={(event) => updateNumber("targetSingleEndedOhms", event.target.value)}
                />
              </label>
            </div>

            <label>
              Differential target
              <span className="field-unit">ohms</span>
              <input
                min="40"
                step="1"
                type="number"
                value={input.targetDifferentialOhms}
                onChange={(event) => updateNumber("targetDifferentialOhms", event.target.value)}
              />
            </label>
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
                    metric={`${estimate.value.traceWidthMm.toFixed(3)} mm`}
                    imperial={`${mmToMils(estimate.value.traceWidthMm).toFixed(1)} mil`}
                  />
                  <ResultMetric
                    label="Pair gap"
                    metric={`${estimate.value.gapMm.toFixed(3)} mm`}
                    imperial={`${mmToMils(estimate.value.gapMm).toFixed(1)} mil`}
                  />
                  <ResultMetric
                    label="Single-ended"
                    metric={`${estimate.value.singleEndedOhms.toFixed(1)} ohms`}
                    imperial="calculated"
                  />
                  <ResultMetric
                    label="Differential"
                    metric={`${estimate.value.differentialOhms.toFixed(1)} ohms`}
                    imperial="calculated"
                  />
                </div>

                <div className="stack-preview" aria-label="Differential pair preview">
                  <div
                    className="trace"
                    style={{ width: `${previewTraceWidth(estimate.value.traceWidthMm)}%` }}
                  />
                  <div
                    className="gap"
                    style={{ width: `${previewGapWidth(estimate.value.gapMm)}%` }}
                  />
                  <div
                    className="trace"
                    style={{ width: `${previewTraceWidth(estimate.value.traceWidthMm)}%` }}
                  />
                </div>

                <div className="notes">
                  <h3>Assumptions</h3>
                  <ul>
                    {estimate.value.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </section>
    </main>
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

function previewTraceWidth(widthMm: number): number {
  return clamp(widthMm * 80, 14, 34);
}

function previewGapWidth(gapMm: number): number {
  return clamp(gapMm * 90, 8, 32);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export default App;
