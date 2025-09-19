import { describe, expect, test } from "@jest/globals";
import { toApiPriority, fromApiPriority } from "../utils/priority-mapper";

describe("priority mapper", () => {
  test("maps user priority to Todoist API scale", () => {
    expect(toApiPriority(1)).toBe(4);
    expect(toApiPriority(2)).toBe(3);
    expect(toApiPriority(3)).toBe(2);
    expect(toApiPriority(4)).toBe(1);
  });

  test("maps Todoist API priority back to user scale", () => {
    expect(fromApiPriority(4)).toBe(1);
    expect(fromApiPriority(3)).toBe(2);
    expect(fromApiPriority(2)).toBe(3);
    expect(fromApiPriority(1)).toBe(4);
  });

  test("returns undefined for out-of-range values", () => {
    expect(toApiPriority(0)).toBeUndefined();
    expect(toApiPriority(5)).toBeUndefined();
    expect(fromApiPriority(0)).toBeUndefined();
    expect(fromApiPriority(5)).toBeUndefined();
  });
});
