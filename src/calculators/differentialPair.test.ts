import { describe, expect, it } from "vitest";
import {
  differentialImpedanceOhms,
  estimateConstrainedDifferentialPair,
  estimateDifferentialPair,
  estimateTraceWidthForDifferentialGap,
  microstripImpedanceOhms,
  mmToMils,
} from "./differentialPair";

describe("differential pair estimator", () => {
  it("estimates practical dimensions for a common FR-4 microstrip case", () => {
    const result = estimateDifferentialPair({
      dielectricHeightMm: 0.18,
      dielectricConstant: 4.2,
      copperThicknessUm: 35,
      targetDifferentialOhms: 90,
      targetSingleEndedOhms: 50,
      geometry: "microstrip",
    });

    expect(result.traceWidthMm).toBeGreaterThan(0.2);
    expect(result.traceWidthMm).toBeLessThan(0.5);
    expect(result.gapMm).toBeGreaterThan(0.05);
    expect(result.differentialOhms).toBeCloseTo(90, 1);
    expect(result.singleEndedOhms).toBeCloseTo(50, 1);
  });

  it("lowers differential impedance as pair spacing gets tighter", () => {
    const loose = differentialImpedanceOhms(50, 0.5, 0.18);
    const tight = differentialImpedanceOhms(50, 0.1, 0.18);

    expect(tight).toBeLessThan(loose);
  });

  it("lowers single-ended impedance as trace width increases", () => {
    const narrow = microstripImpedanceOhms(0.15, 0.18, 4.2);
    const wide = microstripImpedanceOhms(0.35, 0.18, 4.2);

    expect(wide).toBeLessThan(narrow);
  });

  it("converts millimeters to mils", () => {
    expect(mmToMils(1)).toBeCloseTo(39.3701, 4);
  });

  it("estimates trace width for a fixed differential gap", () => {
    const point = estimateTraceWidthForDifferentialGap(90, 0.25, 0.18, 4.2);

    expect(point.gapMm).toBe(0.25);
    expect(point.traceWidthMm).toBeGreaterThan(0.2);
    expect(point.traceWidthMm).toBeLessThan(0.6);
    expect(point.differentialOhms).toBeCloseTo(90, 1);
  });

  it("keeps locked gap fixed while solving unlocked trace width", () => {
    const result = estimateConstrainedDifferentialPair({
      dielectricHeightMm: 0.18,
      dielectricConstant: 4.2,
      copperThicknessUm: 35,
      targetDifferentialOhms: 90,
      targetSingleEndedOhms: 50,
      geometry: "microstrip",
      traceWidthMm: 0.2,
      gapMm: 0.2,
      locks: {
        dielectricHeight: true,
        traceWidth: false,
        gap: true,
      },
    });

    expect(result.gapMm).toBe(0.2);
    expect(result.singleEndedOhms).toBeCloseTo(50, 1);
    expect(result.notes).toContain("Locked gap prevents matching the differential target exactly.");
  });

  it("adjusts unlocked dielectric height when trace width is locked", () => {
    const result = estimateConstrainedDifferentialPair({
      dielectricHeightMm: 0.18,
      dielectricConstant: 4.2,
      copperThicknessUm: 35,
      targetDifferentialOhms: 90,
      targetSingleEndedOhms: 50,
      geometry: "microstrip",
      traceWidthMm: 0.3,
      gapMm: 0.25,
      locks: {
        dielectricHeight: false,
        traceWidth: true,
        gap: false,
      },
    });

    expect(result.dielectricHeightMm).not.toBe(0.18);
    expect(result.traceWidthMm).toBe(0.3);
    expect(result.singleEndedOhms).toBeCloseTo(50, 1);
    expect(result.differentialOhms).toBeCloseTo(90, 1);
  });
});
