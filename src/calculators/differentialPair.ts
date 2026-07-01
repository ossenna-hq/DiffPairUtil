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
  dielectricHeightMm: number;
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

export interface DimensionLocks {
  dielectricHeight: boolean;
  traceWidth: boolean;
  gap: boolean;
}

export interface ConstrainedDifferentialPairInput extends DifferentialPairInput {
  traceWidthMm: number;
  gapMm: number;
  locks: DimensionLocks;
}

const MILS_PER_MM = 39.3700787402;

export function estimateDifferentialPair(
  input: DifferentialPairInput,
): DifferentialPairEstimate {
  validateInput(input);

  const heightMm = input.dielectricHeightMm;
  const widthMm = solveTraceWidthForImpedance(
    input.targetSingleEndedOhms,
    heightMm,
    input.dielectricConstant,
  );
  const singleEndedOhms = microstripImpedanceOhms(
    widthMm,
    heightMm,
    input.dielectricConstant,
  );
  const gapMm = solveGapForDifferentialImpedance(
    input.targetDifferentialOhms,
    singleEndedOhms,
    heightMm,
  );
  const differentialOhms = differentialImpedanceOhms(
    singleEndedOhms,
    gapMm,
    heightMm,
  );

  return {
    dielectricHeightMm: heightMm,
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

export function estimateConstrainedDifferentialPair(
  input: ConstrainedDifferentialPairInput,
): DifferentialPairEstimate {
  validateInput(input);
  validatePositive("trace width", input.traceWidthMm);
  validatePositive("gap", input.gapMm);

  let heightMm = input.dielectricHeightMm;
  let widthMm = input.traceWidthMm;
  let gapMm = input.gapMm;
  const notes: string[] = [
    "Edge-coupled external microstrip approximation.",
    "Copper thickness is captured for future correction but is not yet applied to the estimate.",
    "Use fabricator impedance tools or field solving before release to manufacture.",
  ];

  if (!input.locks.dielectricHeight && input.locks.traceWidth) {
    heightMm = solveDielectricHeightForSingleEndedImpedance(
      input.targetSingleEndedOhms,
      widthMm,
      input.dielectricConstant,
    );
  }

  if (!input.locks.traceWidth) {
    widthMm = solveTraceWidthForImpedance(
      input.targetSingleEndedOhms,
      heightMm,
      input.dielectricConstant,
    );
  }

  const singleEndedOhms = microstripImpedanceOhms(
    widthMm,
    heightMm,
    input.dielectricConstant,
  );

  if (!input.locks.gap) {
    gapMm = solveGapForDifferentialImpedance(
      input.targetDifferentialOhms,
      singleEndedOhms,
      heightMm,
    );
  }

  const differentialOhms = differentialImpedanceOhms(
    singleEndedOhms,
    gapMm,
    heightMm,
  );

  if (
    input.locks.traceWidth &&
    Math.abs(singleEndedOhms - input.targetSingleEndedOhms) > 0.5
  ) {
    notes.push(
      "Locked track width prevents matching the single-ended target exactly.",
    );
  }

  if (
    !input.locks.gap &&
    Math.abs(differentialOhms - input.targetDifferentialOhms) > 0.5
  ) {
    notes.push(
      "The closest achievable gap is outside the differential target.",
    );
  } else if (
    input.locks.gap &&
    Math.abs(differentialOhms - input.targetDifferentialOhms) > 0.5
  ) {
    notes.push("Locked gap prevents matching the differential target exactly.");
  }

  return {
    dielectricHeightMm: heightMm,
    traceWidthMm: widthMm,
    gapMm,
    singleEndedOhms,
    differentialOhms,
    effectiveDielectricConstant: effectiveDielectricConstant(
      widthMm,
      heightMm,
      input.dielectricConstant,
    ),
    notes,
  };
}

export function microstripImpedanceOhms(
  traceWidthMm: number,
  dielectricHeightMm: number,
  dielectricConstant: number,
): number {
  if (traceWidthMm <= 0 || dielectricHeightMm <= 0 || dielectricConstant <= 1) {
    throw new Error(
      "Microstrip impedance inputs must be positive and Dk must be greater than 1.",
    );
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

  return (
    2 *
    singleEndedOhms *
    (1 - 0.48 * Math.exp((-0.96 * gapMm) / dielectricHeightMm))
  );
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
    const singleEndedOhms = microstripImpedanceOhms(
      mid,
      dielectricHeightMm,
      dielectricConstant,
    );
    const differentialOhms = differentialImpedanceOhms(
      singleEndedOhms,
      gapMm,
      dielectricHeightMm,
    );

    if (differentialOhms > targetDifferentialOhms) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const traceWidthMm = (low + high) / 2;
  const differentialOhms = differentialImpedanceOhms(
    microstripImpedanceOhms(
      traceWidthMm,
      dielectricHeightMm,
      dielectricConstant,
    ),
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
    const impedance = microstripImpedanceOhms(
      mid,
      dielectricHeightMm,
      dielectricConstant,
    );

    if (impedance > targetOhms) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

function solveDielectricHeightForSingleEndedImpedance(
  targetOhms: number,
  traceWidthMm: number,
  dielectricConstant: number,
): number {
  let low = traceWidthMm * 0.02;
  let high = traceWidthMm * 20;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const impedance = microstripImpedanceOhms(
      traceWidthMm,
      mid,
      dielectricConstant,
    );

    if (impedance < targetOhms) {
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
  const minimumGapMm = dielectricHeightMm * 0.01;
  const maximumGapMm = dielectricHeightMm * 20;
  const minimumDifferential = differentialImpedanceOhms(
    singleEndedOhms,
    minimumGapMm,
    dielectricHeightMm,
  );
  const maximumDifferential = differentialImpedanceOhms(
    singleEndedOhms,
    maximumGapMm,
    dielectricHeightMm,
  );

  if (targetOhms <= minimumDifferential) {
    return minimumGapMm;
  }

  if (targetOhms >= maximumDifferential) {
    return maximumGapMm;
  }

  let low = minimumGapMm;
  let high = maximumGapMm;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const impedance = differentialImpedanceOhms(
      singleEndedOhms,
      mid,
      dielectricHeightMm,
    );

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
