import {
  validateDuration,
  validateDurationUnit,
  validateDurationPair,
} from "../validation";
import { ValidationError } from "../errors";

describe("Duration Validation", () => {
  describe("validateDuration", () => {
    it("should accept valid duration values", () => {
      expect(() => validateDuration(1)).not.toThrow();
      expect(() => validateDuration(30)).not.toThrow();
      expect(() => validateDuration(60)).not.toThrow();
      expect(() => validateDuration(1440)).not.toThrow();
    });

    it("should accept undefined duration", () => {
      expect(() => validateDuration(undefined)).not.toThrow();
    });

    it("should reject non-integer durations", () => {
      expect(() => validateDuration(1.5)).toThrow(ValidationError);
      expect(() => validateDuration(30.7)).toThrow(ValidationError);
    });

    it("should reject durations less than 1", () => {
      expect(() => validateDuration(0)).toThrow(ValidationError);
      expect(() => validateDuration(-1)).toThrow(ValidationError);
      expect(() => validateDuration(-100)).toThrow(ValidationError);
    });

    it("should reject durations greater than 1440", () => {
      expect(() => validateDuration(1441)).toThrow(ValidationError);
      expect(() => validateDuration(10000)).toThrow(ValidationError);
    });

    it("should reject non-finite numbers", () => {
      expect(() => validateDuration(Infinity)).toThrow(ValidationError);
      expect(() => validateDuration(-Infinity)).toThrow(ValidationError);
      expect(() => validateDuration(NaN)).toThrow(ValidationError);
    });

    it("should reject non-number types", () => {
      expect(() => validateDuration("30" as unknown as number)).toThrow(
        ValidationError
      );
    });
  });

  describe("validateDurationUnit", () => {
    it("should accept valid duration units", () => {
      expect(() => validateDurationUnit("minute")).not.toThrow();
      expect(() => validateDurationUnit("day")).not.toThrow();
    });

    it("should accept undefined duration unit", () => {
      expect(() => validateDurationUnit(undefined)).not.toThrow();
    });

    it("should reject invalid duration units", () => {
      expect(() => validateDurationUnit("hour")).toThrow(ValidationError);
      expect(() => validateDurationUnit("week")).toThrow(ValidationError);
      expect(() => validateDurationUnit("MINUTE")).toThrow(ValidationError);
      expect(() => validateDurationUnit("DAY")).toThrow(ValidationError);
    });

    it("should reject non-string types", () => {
      expect(() => validateDurationUnit(60 as unknown as string)).toThrow(
        ValidationError
      );
    });
  });

  describe("validateDurationPair", () => {
    it("should accept valid duration and unit pairs", () => {
      expect(() => validateDurationPair(30, "minute")).not.toThrow();
      expect(() => validateDurationPair(60, "minute")).not.toThrow();
      expect(() => validateDurationPair(2, "day")).not.toThrow();
      expect(() => validateDurationPair(7, "day")).not.toThrow();
    });

    it("should accept duration without unit (defaults to minute)", () => {
      expect(() => validateDurationPair(30, undefined)).not.toThrow();
      expect(() => validateDurationPair(60, undefined)).not.toThrow();
    });

    it("should accept undefined for both values", () => {
      expect(() => validateDurationPair(undefined, undefined)).not.toThrow();
    });

    it("should reject unit without duration", () => {
      expect(() => validateDurationPair(undefined, "minute")).toThrow(
        ValidationError
      );
      expect(() => validateDurationPair(undefined, "day")).toThrow(
        ValidationError
      );
    });

    it("should reject invalid duration values", () => {
      expect(() => validateDurationPair(0, "minute")).toThrow(ValidationError);
      expect(() => validateDurationPair(-1, "day")).toThrow(ValidationError);
      expect(() => validateDurationPair(1441, "minute")).toThrow(
        ValidationError
      );
    });

    it("should reject invalid unit values", () => {
      expect(() => validateDurationPair(30, "hour")).toThrow(ValidationError);
      expect(() => validateDurationPair(30, "week")).toThrow(ValidationError);
    });
  });
});
