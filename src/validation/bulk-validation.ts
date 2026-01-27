import { ValidationError } from "../errors.js";
import type {
  CreateLabelArgs,
  UpdateLabelArgs,
  CreateFilterArgs,
  UpdateFilterArgs,
} from "../types.js";
import { validateProjectId } from "./id-validation.js";
import { validatePriority } from "./task-validation.js";
import { validateDateString } from "./date-validation.js";
import {
  validateAndSanitizeContent,
  detectSuspiciousPatterns,
} from "./sanitization.js";
import {
  validateLabelName,
  validateLabelColor,
  validateLabelOrder,
} from "./content-validation.js";

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

// Filter validation constants
export const FILTER_VALIDATION_LIMITS = {
  FILTER_NAME_MAX: 100,
  FILTER_QUERY_MAX: 500,
} as const;

/**
 * Validates filter name
 */
export function validateFilterName(name: string): string {
  return validateAndSanitizeContent(name, "name", {
    maxLength: FILTER_VALIDATION_LIMITS.FILTER_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

/**
 * Validates filter query
 */
export function validateFilterQuery(query: string): string {
  if (!query || typeof query !== "string") {
    throw new ValidationError(
      "Filter query is required and must be a string",
      "query"
    );
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Filter query cannot be empty", "query");
  }

  if (trimmed.length > FILTER_VALIDATION_LIMITS.FILTER_QUERY_MAX) {
    throw new ValidationError(
      `Filter query must be ${FILTER_VALIDATION_LIMITS.FILTER_QUERY_MAX} characters or less`,
      "query"
    );
  }

  // Check for suspicious patterns in query (XSS prevention)
  const suspiciousPatterns = detectSuspiciousPatterns(trimmed);
  if (suspiciousPatterns.length > 0) {
    throw new ValidationError(
      "Filter query contains potentially malicious content",
      "query"
    );
  }

  return trimmed;
}

/**
 * Validates filter order
 */
export function validateFilterOrder(order?: number): void {
  if (order !== undefined) {
    if (!Number.isInteger(order) || order < 0) {
      throw new ValidationError(
        "Filter order must be a non-negative integer",
        "item_order"
      );
    }
  }
}

/**
 * Validates filter color (same as label color)
 */
export function validateFilterColor(color?: string): void {
  // Filters use the same color scheme as labels
  validateLabelColor(color);
}

/**
 * Validates and sanitizes filter creation data
 */
export function validateFilterData(data: CreateFilterArgs): CreateFilterArgs {
  const sanitizedName = validateFilterName(data.name);
  const sanitizedQuery = validateFilterQuery(data.query);
  validateFilterColor(data.color);
  validateFilterOrder(data.item_order);

  return {
    name: sanitizedName,
    query: sanitizedQuery,
    color: data.color,
    item_order: data.item_order,
    is_favorite: data.is_favorite,
  };
}

/**
 * Validates and sanitizes filter update data
 */
export function validateFilterUpdate(data: UpdateFilterArgs): UpdateFilterArgs {
  const updates: UpdateFilterArgs = {};

  if (data.name !== undefined) {
    updates.name = validateFilterName(data.name);
  }

  if (data.query !== undefined) {
    updates.query = validateFilterQuery(data.query);
  }

  if (data.color !== undefined) {
    validateFilterColor(data.color);
    updates.color = data.color;
  }

  if (data.item_order !== undefined) {
    validateFilterOrder(data.item_order);
    updates.item_order = data.item_order;
  }

  if (data.is_favorite !== undefined) {
    updates.is_favorite = data.is_favorite;
  }

  return updates;
}
