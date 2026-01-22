/**
 * Shared formatting utilities for task display
 */

import type { TaskHierarchy, TaskNode } from "../types.js";

/**
 * Format a task hierarchy into a readable tree structure
 *
 * @param hierarchy - The task hierarchy to format
 * @returns Formatted string representation of the hierarchy
 */
export function formatTaskHierarchy(hierarchy: TaskHierarchy): string {
  const lines: string[] = [];
  lines.push(`Task Hierarchy (${hierarchy.overallCompletion}% complete)`);
  lines.push(
    `Total: ${hierarchy.totalTasks} tasks, Completed: ${hierarchy.completedTasks}`
  );
  lines.push("");

  function formatNode(node: TaskNode, prefix: string = ""): void {
    const marker = node.isOriginalTask ? ">>>" : "";
    const status = node.task.isCompleted ? "[x]" : "[ ]";
    const completion =
      node.children.length > 0 ? ` (${node.completionPercentage}%)` : "";
    lines.push(
      `${prefix}${status} ${node.task.content}${completion} ${marker}`
    );

    node.children.forEach((child, index) => {
      const isLast = index === node.children.length - 1;
      const connector = isLast ? "\\-- " : "|-- ";
      formatNode(child, prefix + connector.substring(0, 4));
    });
  }

  formatNode(hierarchy.root);
  return lines.join("\n");
}
