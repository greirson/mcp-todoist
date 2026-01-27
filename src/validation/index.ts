// Re-export all validation utilities from domain-specific modules

// Sanitization and security patterns
export {
  VALIDATION_LIMITS,
  MALICIOUS_PATTERNS,
  sanitizeInput,
  validateAndSanitizeURL,
  detectSuspiciousPatterns,
  validateAndSanitizeContent,
} from "./sanitization.js";

// Task validation
export {
  validateTaskContent,
  validateDuration,
  validateDurationUnit,
  hasTimeComponent,
  validateDurationPair,
  validatePriority,
  validateTaskName,
  validateProjectName,
  validateSectionName,
  validateLimit,
  validateOffset,
} from "./task-validation.js";

// Date validation
export { validateDateString, validateIsoDatetime } from "./date-validation.js";

// ID validation
export {
  validateProjectId,
  validateSectionId,
  validateTaskIdentifier,
} from "./id-validation.js";

// Content validation
export {
  validateLabelName,
  validateLabelColor,
  validateLabelOrder,
  validateDescription,
  validateCommentContent,
  validateFileAttachment,
  validateLabels,
  validateOperationFrequency,
} from "./content-validation.js";

// Bulk validation and filter validation
export {
  validateBulkSearchCriteria,
  validateLabelData,
  validateLabelUpdate,
  FILTER_VALIDATION_LIMITS,
  validateFilterName,
  validateFilterQuery,
  validateFilterOrder,
  validateFilterColor,
  validateFilterData,
  validateFilterUpdate,
} from "./bulk-validation.js";
