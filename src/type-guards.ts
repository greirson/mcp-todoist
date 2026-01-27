/**
 * Re-export all type guards for backwards compatibility
 *
 * This file maintains backwards compatibility by re-exporting all type guards
 * from the modularized src/type-guards/ directory structure.
 *
 * For new code, prefer importing directly from specific type guard modules:
 *   import { isCreateTaskArgs } from './type-guards/task-guards.js';
 *
 * Or from the centralized index:
 *   import { isCreateTaskArgs } from './type-guards/index.js';
 */
export * from "./type-guards/index.js";
