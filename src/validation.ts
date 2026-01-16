import { ValidationError } from "./errors.js";

/**
 * Security and validation constants
 */
export const VALIDATION_LIMITS = {
  TASK_CONTENT_MAX: 500,
  TASK_NAME_MAX: 200,
  PROJECT_NAME_MAX: 120,
  SECTION_NAME_MAX: 120,
  LABEL_NAME_MAX: 100,
  DESCRIPTION_MAX: 16384, // 16KB
  COMMENT_MAX: 10000,
  LABELS_MAX_COUNT: 10,
  QUERY_LIMIT_MAX: 100,
  SYNC_API_LIMIT_MAX: 200, // Sync API supports higher limit than REST API
  URL_MAX: 2048,
  PRIORITY_MIN: 1,
  PRIORITY_MAX: 4,
} as const;

/**
 * Patterns for detecting potentially malicious content
 */
const MALICIOUS_PATTERNS = [
  // Script tags and javascript
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload
  // HTML injection
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<form[^>]*>/gi,
  // Data URLs with potential scripts
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  // Suspicious protocols
  /vbscript:/gi,
  /file:/gi,
  // SQL injection patterns
  /union\s+select/gi,
  /'\s*(or|and)\s*'/gi,
  /;\s*(drop|delete|insert|update)\s/gi,
];

/**
 * Sanitizes user input by removing potentially dangerous content
 *
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeInput(
  input: string,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    trimWhitespace?: boolean;
  } = {}
): string {
  if (typeof input !== "string") {
    throw new ValidationError("Input must be a string");
  }

  let sanitized = input;

  // Trim whitespace by default
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // If HTML is not allowed, escape it
  if (!options.allowHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  } else {
    // Even if HTML is allowed, remove dangerous patterns
    for (const pattern of MALICIOUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, "");
    }
  }

  // Apply length limit if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Validates and sanitizes URL inputs
 *
 * @param url - URL to validate
 * @param fieldName - Field name for error reporting
 * @returns Sanitized URL
 */
export function validateAndSanitizeURL(url: string, fieldName = "url"): string {
  if (typeof url !== "string") {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  const sanitized = sanitizeInput(url, {
    allowHtml: false,
    maxLength: VALIDATION_LIMITS.URL_MAX,
  });

  // Check URL format
  try {
    const urlObj = new URL(sanitized);

    // Only allow safe protocols
    const allowedProtocols = ["http:", "https:"];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new ValidationError(
        `${fieldName} must use http or https protocol`,
        fieldName
      );
    }

    return sanitized;
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`, fieldName);
  }
}

/**
 * Detects suspicious patterns that might indicate malicious intent
 *
 * @param input - Input to check
 * @returns Array of detected suspicious patterns
 */
export function detectSuspiciousPatterns(input: string): string[] {
  const detected: string[] = [];

  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      detected.push(pattern.toString());
    }
  }

  return detected;
}

/**
 * Enhanced content validation with sanitization
 *
 * @param content - Content to validate
 * @param fieldName - Field name for error reporting
 * @param options - Validation options
 * @returns Sanitized content
 */
export function validateAndSanitizeContent(
  content: string,
  fieldName = "content",
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    required?: boolean;
  } = {}
): string {
  const {
    maxLength = VALIDATION_LIMITS.TASK_CONTENT_MAX,
    allowHtml = false,
    required = true,
  } = options;

  if (!content || typeof content !== "string") {
    if (required) {
      throw new ValidationError(
        `${fieldName} is required and must be a string`,
        fieldName
      );
    }
    return "";
  }

  // Sanitize the input
  const sanitized = sanitizeInput(content, {
    allowHtml,
    maxLength,
    trimWhitespace: true,
  });

  if (required && sanitized.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }

  if (sanitized.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be ${maxLength} characters or less`,
      fieldName
    );
  }

  // Check for suspicious patterns
  const suspiciousPatterns = detectSuspiciousPatterns(sanitized);
  if (suspiciousPatterns.length > 0) {
    throw new ValidationError(
      `${fieldName} contains potentially malicious content`,
      fieldName
    );
  }

  return sanitized;
}

export function validateTaskContent(content: string): string {
  return validateAndSanitizeContent(content, "content", {
    maxLength: VALIDATION_LIMITS.TASK_CONTENT_MAX,
    allowHtml: false,
    required: true,
  });
}

/**
 * Validates task duration amount
 * @param duration - Duration amount in minutes or days
 */
export function validateDuration(duration?: number): void {
  if (duration !== undefined) {
    if (typeof duration !== "number" || !Number.isFinite(duration)) {
      throw new ValidationError(
        "Duration must be a finite number",
        "duration"
      );
    }

    if (!Number.isInteger(duration)) {
      throw new ValidationError(
        "Duration must be an integer",
        "duration"
      );
    }

    if (duration < 1) {
      throw new ValidationError(
        "Duration must be at least 1",
        "duration"
      );
    }

    // Todoist allows up to 24 hours (1440 minutes) or 365 days
    if (duration > 1440) {
      throw new ValidationError(
        "Duration cannot exceed 1440 (24 hours in minutes or 365 days)",
        "duration"
      );
    }
  }
}

/**
 * Validates task duration unit
 * @param unit - Duration unit ('minute' or 'day')
 */
export function validateDurationUnit(unit?: string): void {
  if (unit !== undefined) {
    if (typeof unit !== "string") {
      throw new ValidationError(
        "Duration unit must be a string",
        "duration_unit"
      );
    }

    const validUnits = ["minute", "day"];
    if (!validUnits.includes(unit)) {
      throw new ValidationError(
        `Duration unit must be one of: ${validUnits.join(", ")}`,
        "duration_unit"
      );
    }
  }
}

/**
 * Validates duration and duration_unit together
 * If one is provided, the other must also be provided (or use defaults)
 */
export function validateDurationPair(duration?: number, durationUnit?: string): void {
  validateDuration(duration);
  validateDurationUnit(durationUnit);

  // If duration is provided without unit, we'll default to 'minute' in the handler
  // If unit is provided without duration, it's invalid
  if (durationUnit !== undefined && duration === undefined) {
    throw new ValidationError(
      "Duration unit requires a duration amount to be specified",
      "duration_unit"
    );
  }
}

export function validatePriority(priority?: number): void {
  if (priority !== undefined) {
    if (!Number.isInteger(priority) || priority < 1 || priority > 4) {
      throw new ValidationError(
        "Priority must be an integer between 1 and 4",
        "priority"
      );
    }
  }
}

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

export function validateLabels(labels?: string[]): void {
  if (labels !== undefined) {
    if (!Array.isArray(labels)) {
      throw new ValidationError("Labels must be an array", "labels");
    }

    for (const label of labels) {
      if (typeof label !== "string") {
        throw new ValidationError("All labels must be strings", "labels");
      }

      if (label.trim().length === 0) {
        throw new ValidationError("Labels cannot be empty", "labels");
      }

      if (label.length > 100) {
        throw new ValidationError(
          "Each label must be 100 characters or less",
          "labels"
        );
      }
    }

    if (labels.length > 10) {
      throw new ValidationError("Maximum 10 labels allowed", "labels");
    }
  }
}

export function validateProjectId(projectId?: string): void {
  if (projectId !== undefined) {
    if (typeof projectId !== "string") {
      throw new ValidationError("Project ID must be a string", "project_id");
    }

    if (projectId.trim().length === 0) {
      throw new ValidationError("Project ID cannot be empty", "project_id");
    }
  }
}

export function validateSectionId(sectionId?: string): void {
  if (sectionId !== undefined) {
    if (typeof sectionId !== "string") {
      throw new ValidationError("Section ID must be a string", "section_id");
    }

    if (sectionId.trim().length === 0) {
      throw new ValidationError("Section ID cannot be empty", "section_id");
    }
  }
}

export function validateTaskName(taskName: string): string {
  return validateAndSanitizeContent(taskName, "task_name", {
    maxLength: VALIDATION_LIMITS.TASK_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateProjectName(name: string): string {
  return validateAndSanitizeContent(name, "name", {
    maxLength: VALIDATION_LIMITS.PROJECT_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateSectionName(name: string): string {
  return validateAndSanitizeContent(name, "name", {
    maxLength: VALIDATION_LIMITS.SECTION_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateLimit(limit?: number, max: number = 100): void {
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > max) {
      throw new ValidationError(
        `Limit must be an integer between 1 and ${max}`,
        "limit"
      );
    }
  }
}

export function validateOffset(offset?: number): void {
  if (offset !== undefined) {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError(
        "Offset must be a non-negative integer",
        "offset"
      );
    }
  }
}

export function validateTaskIdentifier(
  taskId?: string,
  taskName?: string
): void {
  if (!taskId && !taskName) {
    throw new ValidationError("Either task_id or task_name must be provided");
  }
}

export function validateLabelName(name: string): string {
  return validateAndSanitizeContent(name, "name", {
    maxLength: VALIDATION_LIMITS.LABEL_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateLabelColor(color?: string): void {
  if (color !== undefined) {
    if (typeof color !== "string") {
      throw new ValidationError("Label color must be a string", "color");
    }

    // Todoist supports specific color names or hex codes
    const validColors = [
      "berry_red",
      "red",
      "orange",
      "yellow",
      "olive_green",
      "lime_green",
      "green",
      "mint_green",
      "teal",
      "sky_blue",
      "light_blue",
      "blue",
      "grape",
      "violet",
      "lavender",
      "magenta",
      "salmon",
      "charcoal",
      "grey",
      "taupe",
    ];

    if (!validColors.includes(color) && !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new ValidationError(
        "Label color must be a valid Todoist color name or hex code",
        "color"
      );
    }
  }
}

export function validateLabelOrder(order?: number): void {
  if (order !== undefined) {
    if (!Number.isInteger(order) || order < 0) {
      throw new ValidationError(
        "Label order must be a non-negative integer",
        "order"
      );
    }
  }
}

/**
 * Validates and sanitizes task descriptions
 */
export function validateDescription(description?: string): string | undefined {
  if (description === undefined || description === null) {
    return undefined;
  }

  return validateAndSanitizeContent(description, "description", {
    maxLength: VALIDATION_LIMITS.DESCRIPTION_MAX,
    allowHtml: false,
    required: false,
  });
}

/**
 * Validates and sanitizes comment content
 */
export function validateCommentContent(content: string): string {
  return validateAndSanitizeContent(content, "comment_content", {
    maxLength: VALIDATION_LIMITS.COMMENT_MAX,
    allowHtml: false,
    required: true,
  });
}

/**
 * Validates file attachment data
 */
export function validateFileAttachment(attachment: {
  file_name: string;
  file_url: string;
  file_type: string;
}): {
  file_name: string;
  file_url: string;
  file_type: string;
} {
  // Validate and sanitize file name
  const fileName = validateAndSanitizeContent(
    attachment.file_name,
    "file_name",
    {
      maxLength: 255,
      allowHtml: false,
      required: true,
    }
  );

  // Validate file URL
  const fileUrl = validateAndSanitizeURL(attachment.file_url, "file_url");

  // Validate file type
  const fileType = validateAndSanitizeContent(
    attachment.file_type,
    "file_type",
    {
      maxLength: 100,
      allowHtml: false,
      required: true,
    }
  );

  // Check for allowed file types (security measure)
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
  ];

  if (!allowedTypes.includes(fileType.toLowerCase())) {
    throw new ValidationError(
      `File type '${fileType}' is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      "file_type"
    );
  }

  return {
    file_name: fileName,
    file_url: fileUrl,
    file_type: fileType,
  };
}

/**
 * Enhanced validation for bulk operation search criteria
 */
export function validateBulkSearchCriteria(criteria: {
  project_id?: string;
  priority?: number;
  due_before?: string;
  due_after?: string;
  content_contains?: string;
}): void {
  if (criteria.project_id !== undefined) {
    validateProjectId(criteria.project_id);
  }

  if (criteria.priority !== undefined) {
    validatePriority(criteria.priority);
  }

  if (criteria.due_before !== undefined) {
    validateDateString(criteria.due_before, "due_before");
  }

  if (criteria.due_after !== undefined) {
    validateDateString(criteria.due_after, "due_after");
  }

  // Fix for issue #34: Reject empty or whitespace-only content_contains
  if (criteria.content_contains !== undefined) {
    const trimmed = criteria.content_contains.trim();
    if (trimmed === "") {
      throw new ValidationError(
        "content_contains cannot be empty or contain only whitespace. Remove this field to match all tasks, or provide specific search text.",
        "content_contains"
      );
    }
    validateAndSanitizeContent(criteria.content_contains, "content_contains", {
      maxLength: 200,
      allowHtml: false,
      required: false,
    });
  }

  // Ensure at least one valid search criterion is provided
  const hasValidCriteria =
    criteria.project_id !== undefined ||
    criteria.priority !== undefined ||
    criteria.due_before !== undefined ||
    criteria.due_after !== undefined ||
    (criteria.content_contains !== undefined &&
      criteria.content_contains.trim() !== "");

  if (!hasValidCriteria) {
    throw new ValidationError(
      "At least one valid search criterion must be provided for bulk operations. Valid criteria: project_id, priority, due_before, due_after, or non-empty content_contains.",
      "search_criteria"
    );
  }
}

/**
 * Rate limiting validation helper
 */
export function validateOperationFrequency(
  operationKey: string,
  maxOperationsPerMinute = 60
): void {
  // This is a placeholder for rate limiting logic
  // In a real implementation, you'd track operations in memory or a cache
  // const now = Date.now();
  // const windowStart = now - 60000; // 1 minute window

  // For now, just validate the parameters
  if (!operationKey || typeof operationKey !== "string") {
    throw new ValidationError(
      "Operation key is required for rate limiting",
      "operation"
    );
  }

  if (maxOperationsPerMinute < 1 || maxOperationsPerMinute > 1000) {
    throw new ValidationError("Invalid rate limit configuration", "rate_limit");
  }
}

import type { CreateLabelArgs, UpdateLabelArgs } from "./types.js";

export function validateLabelData(data: CreateLabelArgs): CreateLabelArgs {
  const sanitizedName = validateLabelName(data.name);
  validateLabelColor(data.color);
  validateLabelOrder(data.order);

  return {
    name: sanitizedName,
    color: data.color,
    is_favorite: data.is_favorite,
    order: data.order,
  };
}

export function validateLabelUpdate(data: UpdateLabelArgs): UpdateLabelArgs {
  const updates: UpdateLabelArgs = {};

  if (data.name !== undefined) {
    updates.name = validateLabelName(data.name);
  }

  if (data.color !== undefined) {
    validateLabelColor(data.color);
    updates.color = data.color;
  }

  if (data.order !== undefined) {
    validateLabelOrder(data.order);
    updates.order = data.order;
  }

  if (data.is_favorite !== undefined) {
    updates.is_favorite = data.is_favorite;
  }

  return updates;
}
