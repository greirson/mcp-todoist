import { ValidationError } from "../errors.js";
import {
  VALIDATION_LIMITS,
  validateAndSanitizeContent,
  validateAndSanitizeURL,
} from "./sanitization.js";

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
