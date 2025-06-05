/**
 * Standardized error handling utilities for the Todoist MCP server
 */

import {
  TodoistAPIError,
  ValidationError,
  TaskNotFoundError,
  LabelNotFoundError,
  AuthenticationError,
} from "../errors.js";

/**
 * Standard error context interface for providing additional error information
 */
export interface ErrorContext {
  operation: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  timestamp?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Error severity levels for logging and monitoring
 */
/* eslint-disable no-unused-vars */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}
/* eslint-enable no-unused-vars */

// Enum values available as ErrorSeverity.LOW, etc.

/**
 * Enhanced error information for structured error handling
 */
export interface EnhancedError {
  originalError: Error;
  context: ErrorContext;
  severity: ErrorSeverity;
  isRetryable: boolean;
  errorCode: string;
}

/**
 * Centralized error handler class for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handles API-related errors with context and throws appropriate error types
   *
   * @param operation - Description of the operation that failed
   * @param error - The original error that occurred
   * @param context - Additional context about the operation
   * @throws TodoistAPIError with enhanced error information
   */
  static handleAPIError(
    operation: string,
    error: unknown,
    // eslint-disable-next-line no-unused-vars
    _context: Partial<ErrorContext> = {}
  ): never {
    // Enhanced context for potential future use
    // const enhancedContext: ErrorContext = {
    //   operation,
    //   timestamp: new Date().toISOString(),
    //   ...context,
    // };

    if (error instanceof Error) {
      // Check for authentication errors
      if (this.isAuthenticationError(error)) {
        throw new AuthenticationError();
      }

      // Check for validation errors
      if (this.isValidationError(error)) {
        throw new ValidationError(
          `Validation failed during ${operation}: ${error.message}`
        );
      }

      throw new TodoistAPIError(`Failed to ${operation}`, error);
    }

    throw new TodoistAPIError(
      `Failed to ${operation}`,
      new Error(String(error))
    );
  }

  /**
   * Handles task search errors with specific error types
   *
   * @param taskName - Name of the task that wasn't found
   * @param operation - The operation that was attempted
   * @param context - Additional context
   * @throws TaskNotFoundError
   */
  static handleTaskNotFound(
    taskName: string,
    // eslint-disable-next-line no-unused-vars
    _operation: string,
    // eslint-disable-next-line no-unused-vars
    _context: Partial<ErrorContext> = {}
  ): never {
    // Enhanced context for potential future use
    // const enhancedContext: ErrorContext = {
    //   operation,
    //   entityType: "task",
    //   entityId: taskName,
    //   timestamp: new Date().toISOString(),
    //   ...context,
    // };

    throw new TaskNotFoundError(taskName);
  }

  /**
   * Handles label search errors with specific error types
   *
   * @param labelIdentifier - Name or ID of the label that wasn't found
   * @param operation - The operation that was attempted
   * @param context - Additional context
   * @throws LabelNotFoundError
   */
  static handleLabelNotFound(
    labelIdentifier: string,
    // eslint-disable-next-line no-unused-vars
    _operation: string,
    // eslint-disable-next-line no-unused-vars
    _context: Partial<ErrorContext> = {}
  ): never {
    // Enhanced context for potential future use
    // const enhancedContext: ErrorContext = {
    //   operation,
    //   entityType: "label",
    //   entityId: labelIdentifier,
    //   timestamp: new Date().toISOString(),
    //   ...context,
    // };

    throw new LabelNotFoundError(labelIdentifier);
  }

  /**
   * Handles validation errors with detailed context
   *
   * @param field - The field that failed validation
   * @param value - The invalid value
   * @param operation - The operation that was attempted
   * @param validationRule - Description of the validation rule that was violated
   * @throws ValidationError
   */
  static handleValidationError(
    field: string,
    value: unknown,
    operation: string,
    validationRule: string
  ): never {
    const message = `Validation failed for field '${field}' during ${operation}: ${validationRule}. Received: ${String(value)}`;
    throw new ValidationError(message);
  }

  /**
   * Wraps async operations with standardized error handling
   *
   * @param operation - Description of the operation
   * @param asyncFn - The async function to execute
   * @param context - Additional context for error handling
   * @returns Promise that resolves to the operation result
   */
  static async wrapAsync<T>(
    operation: string,
    asyncFn: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handleAPIError(operation, error, context);
    }
  }

  /**
   * Creates an enhanced error object with additional metadata
   *
   * @param error - The original error
   * @param context - Error context
   * @param severity - Error severity level
   * @param isRetryable - Whether the operation can be retried
   * @returns Enhanced error object
   */
  static createEnhancedError(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isRetryable = false
  ): EnhancedError {
    return {
      originalError: error,
      context,
      severity,
      isRetryable,
      errorCode: this.generateErrorCode(error, context),
    };
  }

  /**
   * Determines if an error is an authentication error based on its properties
   *
   * @param error - The error to check
   * @returns boolean indicating if it's an authentication error
   */
  private static isAuthenticationError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("invalid token") ||
      message.includes("forbidden") ||
      message.includes("401") ||
      message.includes("403")
    );
  }

  /**
   * Determines if an error is a validation error based on its properties
   *
   * @param error - The error to check
   * @returns boolean indicating if it's a validation error
   */
  private static isValidationError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("validation") ||
      message.includes("invalid input") ||
      message.includes("bad request") ||
      message.includes("400")
    );
  }

  /**
   * Generates a unique error code for tracking and debugging
   *
   * @param error - The original error
   * @param context - Error context
   * @returns Generated error code
   */
  private static generateErrorCode(
    error: Error,
    context: ErrorContext
  ): string {
    const timestamp = context.timestamp || new Date().toISOString();
    const operation = context.operation.replace(/\s+/g, "_").toUpperCase();
    const errorType = error.constructor.name.toUpperCase();
    const hash = Math.abs(
      (error.message + timestamp).split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
    )
      .toString(16)
      .substring(0, 6);

    return `${errorType}_${operation}_${hash}`;
  }
}

/**
 * Decorator function for automatic error handling in async methods
 *
 * @param operation - Description of the operation
 * @param context - Additional context for error handling
 * @returns Method decorator
 */
export function withErrorHandling(
  operation: string,
  context: Partial<ErrorContext> = {}
): (
  // eslint-disable-next-line no-unused-vars
  target: unknown,
  // eslint-disable-next-line no-unused-vars
  propertyName: string,
  descriptor: PropertyDescriptor
) => void {
  return function (
    // eslint-disable-next-line no-unused-vars
    _target: unknown,
    // eslint-disable-next-line no-unused-vars
    _propertyName: string,
    descriptor: PropertyDescriptor
  ): void {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      try {
        return await method.apply(this, args);
      } catch (error) {
        ErrorHandler.handleAPIError(operation, error, context);
      }
    };
  };
}

/**
 * Utility function to safely execute operations with error handling
 *
 * @param operation - Description of the operation
 * @param fn - Function to execute
 * @param defaultValue - Default value to return on error
 * @returns Result of the function or default value
 */
export async function safeExecute<T>(
  operation: string,
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Safe execution failed for ${operation}:`, error);
    return defaultValue;
  }
}
