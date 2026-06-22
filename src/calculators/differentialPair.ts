export type Geometry = "microstrip";

export interface DifferentialPairInput {
  dielectricHeightMm: number;
  dielectricConstant: number;
  copperThicknessUm: number;
  targetDifferentialOhms: number;
  targetSingleEndedOhms: number;
  geometry: Geometry;
}

export interface DifferentialPairEstimate {
  traceWidthMm: number;
  gapMm: number;
  singleEndedOhms: number;
  differentialOhms: number;
  effectiveDielectricConstant: number;
  notes: string[];
}

export interface TraceGapPoint {
  gapMm: number;
  traceWidthMm: number;
  differentialOhms: number;
}

const MILS_PER_MM = 39.3700787402;

export function estimateDifferentialPair(input: DifferentialPairInput): DifferentialPairEstimate {
  validateInput(input);

  const heightMm = input.dielectricHeightMm;
  const widthMm = solveTraceWidthForImpedance(
    input.targetSingleEndedOhms,
    heightMm,
    input.dielectricConstant,
  );
  const singleEndedOhms = microstripImpedanceOhms(widthMm, heightMm, input.dielectricConstant);
  const gapMm = solveGapForDifferentialImpedance(
    input.targetDifferentialOhms,
    singleEndedOhms,
    heightMm,
  );
  const differentialOhms = differentialImpedanceOhms(singleEndedOhms, gapMm, heightMm);

  return {
    traceWidthMm: widthMm,
    gapMm,
    singleEndedOhms,
    differentialOhms,
    effectiveDielectricConstant: effectiveDielectricConstant(
      widthMm,
      heightMm,
      input.dielectricConstant,
    ),
    notes: [
      "Edge-coupled external microstrip approximation.",
      "Copper thickness is captured for future correction but is not yet applied to the estimate.",
      "Use fabricator impedance tools or field solving before release to manufacture.",
    ],
  };
}

export function microstripImpedanceOhms(
  traceWidthMm: number,
  dielectricHeightMm: number,
  dielectricConstant: number,
): number {
  if (traceWidthMm <= 0 || dielectricHeightMm <= 0 || dielectricConstant <= 1) {
    throw new Error("Microstrip impedance inputs must be positive and Dk must be greater than 1.");
  }

  const widthHeightRatio = traceWidthMm / dielectricHeightMm;
  const effectiveDk = effectiveDielectricConstant(
    traceWidthMm,
    dielectricHeightMm,
    dielectricConstant,
  );

  if (widthHeightRatio <= 1) {
    return (
      (60 / Math.sqrt(effectiveDk)) *
      Math.log(8 / widthHeightRatio + widthHeightRatio / 4)
    );
  }

  return (
    (120 * Math.PI) /
    (Math.sqrt(effectiveDk) *
      (widthHeightRatio + 1.393 + 0.667 * Math.log(widthHeightRatio + 1.444)))
  );
}

export function differentialImpedanceOhms(
  singleEndedOhms: number,
  gapMm: number,
  dielectricHeightMm: number,
): number {
  if (singleEndedOhms <= 0 || gapMm <= 0 || dielectricHeightMm <= 0) {
    throw new Error("Differential impedance inputs must be positive.");
  }

  return 2 * singleEndedOhms * (1 - 0.48 * Math.exp((-0.96 * gapMm) / dielectricHeightMm));
}

export function mmToMils(valueMm: number): number {
  return valueMm * MILS_PER_MM;
}

export function estimateTraceWidthForDifferentialGap(
  targetDifferentialOhms: number,
  gapMm: number,
  dielectricHeightMm: number,
  dielectricConstant: number,
): TraceGapPoint {
  validatePositive("target differential impedance", targetDifferentialOhms);
  validatePositive("gap", gapMm);
  validatePositive("dielectric height", dielectricHeightMm);

  if (dielectricConstant <= 1) {
    throw new Error("Dielectric constant must be greater than 1.");
  }

  let low = dielectricHeightMm * 0.02;
  let high = dielectricHeightMm * 20;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const singleEndedOhms = microstripImpedanceOhms(mid, dielectricHeightMm, dielectricConstant);
    const differentialOhms = differentialImpedanceOhms(singleEndedOhms, gapMm, dielectricHeightMm);

    if (differentialOhms > targetDifferentialOhms) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const traceWidthMm = (low + high) / 2;
  const differentialOhms = differentialImpedanceOhms(
    microstripImpedanceOhms(traceWidthMm, dielectricHeightMm, dielectricConstant),
    gapMm,
    dielectricHeightMm,
  );

  return {
    gapMm,
    traceWidthMm,
    differentialOhms,
  };
}

function effectiveDielectricConstant(
  traceWidthMm: number,
  dielectricHeightMm: number,
  dielectricConstant: number,
): number {
  const widthHeightRatio = traceWidthMm / dielectricHeightMm;
  return (
    (dielectricConstant + 1) / 2 +
    ((dielectricConstant - 1) / 2) * (1 / Math.sqrt(1 + 12 / widthHeightRatio))
  );
}

function solveTraceWidthForImpedance(
  targetOhms: number,
  dielectricHeightMm: number,
  dielectricConstant: number,
): number {
  let low = dielectricHeightMm * 0.02;
  let high = dielectricHeightMm * 20;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const impedance = microstripImpedanceOhms(mid, dielectricHeightMm, dielectricConstant);

    if (impedance > targetOhms) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

function solveGapForDifferentialImpedance(
  targetOhms: number,
  singleEndedOhms: number,
  dielectricHeightMm: number,
): number {
  const minimumDifferential = differentialImpedanceOhms(
    singleEndedOhms,
    dielectricHeightMm * 0.01,
    dielectricHeightMm,
  );
  const maximumDifferential = 2 * singleEndedOhms;

  if (targetOhms <= minimumDifferential || targetOhms >= maximumDifferential) {
    throw new Error(
      `Target differential impedance must be between ${minimumDifferential.toFixed(
        1,
      )} and ${maximumDifferential.toFixed(1)} ohms for these inputs.`,
    );
  }

  let low = dielectricHeightMm * 0.01;
  let high = dielectricHeightMm * 20;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const impedance = differentialImpedanceOhms(singleEndedOhms, mid, dielectricHeightMm);

    if (impedance < targetOhms) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

function validateInput(input: DifferentialPairInput): void {
  const checks: Array<[string, number]> = [
    ["dielectric height", input.dielectricHeightMm],
    ["dielectric constant", input.dielectricConstant],
    ["copper thickness", input.copperThicknessUm],
    ["target differential impedance", input.targetDifferentialOhms],
    ["target single-ended impedance", input.targetSingleEndedOhms],
  ];

  for (const [label, value] of checks) {
    if (!Number.isFinite(value) || value <= 0) {
      validatePositive(label, value);
    }
  }

  if (input.dielectricConstant <= 1) {
    throw new Error("Dielectric constant must be greater than 1.");
  }
}

function validatePositive(label: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number.`);
  }
}
