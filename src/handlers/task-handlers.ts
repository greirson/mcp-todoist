/**
 * Task Handlers - Re-export Module
 *
 * This file maintains backwards compatibility by re-exporting all task handlers
 * from the modularized src/handlers/task/ directory structure.
 *
 * For new code, prefer importing directly from specific modules:
 *   import { handleCreateTask } from './task/crud.js';
 *
 * Or from the centralized index:
 *   import { handleCreateTask } from './task/index.js';
 */
export * from "./task/index.js";
