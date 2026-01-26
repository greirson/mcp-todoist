import {
  validateDuration,
  validateDurationUnit,
  validateDurationPair,
  hasTimeComponent,
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
    it("should accept valid duration, unit, and due_string with time", () => {
      expect(() =>
        validateDurationPair(30, "minute", "tomorrow at 2pm")
      ).not.toThrow();
      expect(() =>
        validateDurationPair(60, "minute", "monday 10:00")
      ).not.toThrow();
      expect(() =>
        validateDurationPair(2, "day", "next week at 9am")
      ).not.toThrow();
      expect(() =>
        validateDurationPair(7, "day", "today at 14:00")
      ).not.toThrow();
    });

    it("should accept duration without unit (defaults to minute) with time", () => {
      expect(() =>
        validateDurationPair(30, undefined, "tomorrow at 3pm")
      ).not.toThrow();
      expect(() =>
        validateDurationPair(60, undefined, "monday 10:00")
      ).not.toThrow();
    });

    it("should accept undefined for all values", () => {
      expect(() =>
        validateDurationPair(undefined, undefined, undefined)
      ).not.toThrow();
      expect(() =>
        validateDurationPair(undefined, undefined, "tomorrow")
      ).not.toThrow();
    });

    it("should reject unit without duration", () => {
      expect(() =>
        validateDurationPair(undefined, "minute", "tomorrow at 2pm")
      ).toThrow(ValidationError);
      expect(() =>
        validateDurationPair(undefined, "day", "tomorrow at 2pm")
      ).toThrow(ValidationError);
    });

    it("should reject invalid duration values", () => {
      expect(() =>
        validateDurationPair(0, "minute", "tomorrow at 2pm")
      ).toThrow(ValidationError);
      expect(() => validateDurationPair(-1, "day", "tomorrow at 2pm")).toThrow(
        ValidationError
      );
      expect(() =>
        validateDurationPair(1441, "minute", "tomorrow at 2pm")
      ).toThrow(ValidationError);
    });

    it("should reject invalid unit values", () => {
      expect(() => validateDurationPair(30, "hour", "tomorrow at 2pm")).toThrow(
        ValidationError
      );
      expect(() => validateDurationPair(30, "week", "tomorrow at 2pm")).toThrow(
        ValidationError
      );
    });

    it("should reject duration without due_string", () => {
      expect(() => validateDurationPair(30, "minute", undefined)).toThrow(
        ValidationError
      );
      expect(() => validateDurationPair(60, "minute")).toThrow(ValidationError);
    });

    it("should reject duration with due_string that has no time", () => {
      expect(() => validateDurationPair(30, "minute", "tomorrow")).toThrow(
        ValidationError
      );
      expect(() => validateDurationPair(60, "day", "next monday")).toThrow(
        ValidationError
      );
      expect(() => validateDurationPair(30, "minute", "2024-01-15")).toThrow(
        ValidationError
      );
    });
  });

  describe("hasTimeComponent", () => {
    it("should detect time in various formats", () => {
      expect(hasTimeComponent("tomorrow at 2pm")).toBe(true);
      expect(hasTimeComponent("monday at 10:00")).toBe(true);
      expect(hasTimeComponent("next week 3pm")).toBe(true);
      expect(hasTimeComponent("today at 14:30")).toBe(true);
      expect(hasTimeComponent("2024-01-15T10:00:00")).toBe(true);
      expect(hasTimeComponent("at 9am")).toBe(true);
      expect(hasTimeComponent("10:30am")).toBe(true);
      expect(hasTimeComponent("14:00")).toBe(true);
    });

    it("should not detect time in date-only strings", () => {
      expect(hasTimeComponent("tomorrow")).toBe(false);
      expect(hasTimeComponent("next monday")).toBe(false);
      expect(hasTimeComponent("2024-01-15")).toBe(false);
      expect(hasTimeComponent("next week")).toBe(false);
    });

    it("should handle undefined and empty strings", () => {
      expect(hasTimeComponent(undefined)).toBe(false);
      expect(hasTimeComponent("")).toBe(false);
    });
  });
});
