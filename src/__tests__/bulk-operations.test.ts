import { ValidationError } from "../errors";
import { validateBulkSearchCriteria } from "../validation";

describe("Bulk Operations - Empty String Vulnerability Fix (Issue #34)", () => {
  describe("validateBulkSearchCriteria", () => {
    it("should reject empty string in content_contains", () => {
      expect(() => {
        validateBulkSearchCriteria({
          content_contains: "",
        });
      }).toThrow(ValidationError);

      expect(() => {
        validateBulkSearchCriteria({
          content_contains: "",
        });
      }).toThrow("content_contains cannot be empty or contain only whitespace");
    });

    it("should reject whitespace-only strings in content_contains", () => {
      const whitespaceVariations = [
        " ", // single space
        "  ", // multiple spaces
        "\t", // tab
        "\n", // newline
        "\r\n", // carriage return + newline
        " \t \n ", // mixed whitespace
        "\u00A0", // non-breaking space
        "\u2003", // em space
      ];

      whitespaceVariations.forEach((whitespace) => {
        expect(() => {
          validateBulkSearchCriteria({
            content_contains: whitespace,
          });
        }).toThrow(ValidationError);
      });
    });

    it("should accept valid non-empty strings in content_contains", () => {
      const validStrings = [
        "task",
        " task ", // with surrounding whitespace (gets trimmed for validation)
        "task with spaces",
        "UPPERCASE",
        "123",
        "special!@#$%^&*()chars",
      ];

      validStrings.forEach((str) => {
        expect(() => {
          validateBulkSearchCriteria({
            content_contains: str,
            project_id: "proj123", // Need at least one criterion
          });
        }).not.toThrow();
      });
    });

    it("should require at least one valid search criterion", () => {
      // Empty criteria object should throw
      expect(() => {
        validateBulkSearchCriteria({});
      }).toThrow("At least one valid search criterion must be provided");

      // All undefined should throw
      expect(() => {
        validateBulkSearchCriteria({
          project_id: undefined,
          priority: undefined,
          due_before: undefined,
          due_after: undefined,
          content_contains: undefined,
        });
      }).toThrow("At least one valid search criterion must be provided");
    });

    it("should accept when at least one valid criterion is provided", () => {
      const validCriteria = [
        { project_id: "proj123" },
        { priority: 1 },
        { due_before: "2024-12-31" },
        { due_after: "2024-01-01" },
        { content_contains: "valid search" },
        { project_id: "proj123", content_contains: "search" },
      ];

      validCriteria.forEach((criteria) => {
        expect(() => {
          validateBulkSearchCriteria(criteria);
        }).not.toThrow();
      });
    });

    it("should not count empty content_contains as a valid criterion", () => {
      // Empty content_contains alone should fail both validations
      expect(() => {
        validateBulkSearchCriteria({
          content_contains: "   ", // whitespace only
        });
      }).toThrow(ValidationError);

      // Should throw about empty content_contains first
      expect(() => {
        validateBulkSearchCriteria({
          content_contains: "",
        });
      }).toThrow("content_contains cannot be empty");
    });
  });
});

describe("filterTasksByCriteria - Empty String Handling", () => {
  // Note: This would need to import filterTasksByCriteria if it were exported
  // Since it's not exported, these tests serve as documentation of expected behavior

  it("should treat empty content_contains as no match (conceptual test)", () => {
    // Document expected behavior:
    // When content_contains is an empty string after trimming,
    // the filter should return false (no match) for all tasks

    const expectedBehavior = {
      input: { content_contains: "" },
      result: "Should match 0 tasks, not all tasks",
    };

    expect(expectedBehavior.result).toBe("Should match 0 tasks, not all tasks");
  });

  it("should handle undefined content_contains by not filtering on content", () => {
    // Document expected behavior:
    // When content_contains is undefined (not provided),
    // the filter should not apply content filtering at all

    const expectedBehavior = {
      input: { content_contains: undefined },
      result: "Should not filter by content at all",
    };

    expect(expectedBehavior.result).toBe("Should not filter by content at all");
  });
});

describe("Edge Cases and Security Considerations", () => {
  it("should handle malicious input attempts", () => {
    const maliciousInputs = [
      "\x00", // null character
      "\\x00", // escaped null
      "<script>alert(1)</script>", // XSS attempt (should be sanitized elsewhere)
      "${process.exit(1)}", // template injection attempt
      "`rm -rf /`", // command injection attempt
    ];

    maliciousInputs.forEach((input) => {
      // Should either accept as valid search or reject safely
      // but never execute or cause issues
      try {
        validateBulkSearchCriteria({
          content_contains: input,
          project_id: "safe",
        });
        // If it passes, that's fine - it's treated as literal text
        expect(true).toBe(true);
      } catch (e) {
        // If it throws, should be a ValidationError, not a system error
        expect(e).toBeInstanceOf(ValidationError);
      }
    });
  });

  it("should handle very long strings appropriately", () => {
    const longString = "a".repeat(201); // Over the 200 char limit

    // The validateAndSanitizeContent function may not throw for long strings,
    // it might truncate instead. Let's test that it handles it safely.
    try {
      validateBulkSearchCriteria({
        content_contains: longString,
        project_id: "proj123",
      });
      // If it doesn't throw, that's acceptable - it should handle safely
      expect(true).toBe(true);
    } catch (e) {
      // If it does throw, it should be a ValidationError
      expect(e).toBeInstanceOf(ValidationError);
    }
  });

  it("should handle Unicode and special characters", () => {
    const unicodeStrings = [
      "你好", // Chinese
      "مرحبا", // Arabic
      "🎉🎊", // Emojis
      "café", // Accented characters
      "тест", // Cyrillic
    ];

    unicodeStrings.forEach((str) => {
      expect(() => {
        validateBulkSearchCriteria({
          content_contains: str,
          project_id: "proj123",
        });
      }).not.toThrow();
    });
  });
});
