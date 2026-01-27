import { ValidationError } from "../errors.js";

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
export const MALICIOUS_PATTERNS = [
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
  // eslint-disable-next-line no-control-regex
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
