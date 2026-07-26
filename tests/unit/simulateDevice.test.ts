import { describe, expect, it } from "vitest";
import {
  buildReading,
  classify,
  worstCondition,
} from "../../scripts/simulate-device";

describe("device reading classification", () => {
  it("treats a value inside its thresholds as Normal", () => {
    expect(classify(45, 0, 100, 350)).toBe("Normal");
  });

  it("escalates past the max threshold to Warning", () => {
    expect(classify(120, 0, 100, 350)).toBe("Warning");
  });

  it("escalates past the danger threshold to Danger", () => {
    expect(classify(380, 0, 100, 350)).toBe("Danger");
  });

  it("treats a reading below the minimum as Danger, not Normal", () => {
    // A sensor reading under its floor is a fault, not a healthy value.
    expect(classify(-5, 0, 100, 350)).toBe("Danger");
  });

  it("takes the worst sensor as the overall condition", () => {
    expect(worstCondition(["Normal", "Warning", "Normal"])).toBe("Warning");
    expect(worstCondition(["Normal", "Warning", "Danger"])).toBe("Danger");
    expect(worstCondition(["Normal", "Normal"])).toBe("Normal");
  });

  it("derives conditions from the values it sends, not from the requested band", () => {
    const reading = buildReading("Danger", 1, 1_700_000_000);
    expect(reading.overallCondition).toBe("Danger");
    expect(reading.radonValue).toBeGreaterThan(reading.radonMaxThreshold);
    expect(reading.isLandslide).toBe(1);
  });

  it("emits a schema-complete payload with min below max on every sensor", () => {
    const r = buildReading("Normal", 2, 1_700_000_000);
    expect(r.radonMinThreshold).toBeLessThan(r.radonMaxThreshold);
    expect(r.soilMoistureMinThreshold).toBeLessThan(r.soilMoistureMaxThreshold);
    expect(r.gyroMinThreshold).toBeLessThan(r.gyroMaxThreshold);
    expect(r.rainfallMinThreshold).toBeLessThan(r.rainfallMaxThreshold);
    expect(r.overallCondition).toBe("Normal");
    expect(r.isLandslide).toBe(0);
  });
});
