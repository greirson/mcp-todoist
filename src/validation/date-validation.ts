import { ValidationError } from "../errors.js";

export function validateDateString(
  dateString?: string,
  fieldName = "date"
): void {
  if (dateString !== undefined) {
    if (typeof dateString !== "string") {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }

    // Basic validation for YYYY-MM-DD format
    if (fieldName === "deadline" && dateString) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        throw new ValidationError(
          "Deadline must be in YYYY-MM-DD format",
          fieldName
        );
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new ValidationError("Invalid date format", fieldName);
      }
    }
  }
}

/**
 * Validates ISO 8601 datetime strings for Sync API parameters.
 * Accepts both date-only (YYYY-MM-DD) and datetime formats with optional timezone:
 * - YYYY-MM-DD
 * - YYYY-MM-DDTHH:MM:SS
 * - YYYY-MM-DDTHH:MM:SSZ
 * - YYYY-MM-DDTHH:MM:SS+00:00
 * - YYYY-MM-DDTHH:MM:SS.sssZ (milliseconds)
 *
 * @param datetime - The datetime string to validate
 * @param fieldName - Field name for error messages (default: "datetime")
 */
export function validateIsoDatetime(
  datetime?: string,
  fieldName = "datetime"
): void {
  if (datetime !== undefined) {
    if (typeof datetime !== "string") {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }

    // ISO 8601 format with optional timezone:
    // - YYYY-MM-DD (date only)
    // - YYYY-MM-DDTHH:MM:SS (datetime, seconds optional)
    // - YYYY-MM-DDTHH:MM:SS.sss (with milliseconds)
    // - YYYY-MM-DDTHH:MM:SSZ (UTC timezone)
    // - YYYY-MM-DDTHH:MM:SS+HH:MM or -HH:MM (timezone offset)
    const isoRegex =
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (!isoRegex.test(datetime)) {
      throw new ValidationError(
        `${fieldName} must be in ISO 8601 format (e.g., YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, or with timezone like 2024-01-01T00:00:00Z)`,
        fieldName
      );
    }

    // Also validate that it's a valid date
    const date = new Date(datetime);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${fieldName} is not a valid date`, fieldName);
    }
  }
}
