/**
 * Utility Router - Routes todoist_utility actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleTestConnection,
  handleTestAllFeatures,
  handleTestPerformance,
} from "../test-handlers.js";
import {
  handleFindDuplicates,
  handleMergeDuplicates,
} from "../duplicate-handlers.js";
import { FindDuplicatesArgs, MergeDuplicatesArgs } from "../../types.js";

export async function handleUtilityAction(
  api: TodoistApi,
  args: Record<string, unknown>,
  apiToken?: string
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "test_connection": {
      const result = await handleTestConnection(api);
      return `Connection Status: ${result.status}\nMessage: ${result.message}${result.responseTime ? `\nResponse Time: ${result.responseTime}ms` : ""}${result.error ? `\nError: ${result.error}` : ""}`;
    }
    case "test_all_features": {
      const mode = args.mode as "basic" | "enhanced" | undefined;
      const result = await handleTestAllFeatures(api, { mode }, apiToken);
      if (
        typeof result === "object" &&
        result !== null &&
        "overallStatus" in result
      ) {
        const testResult = result as {
          overallStatus: string;
          totalTests: number;
          passed: number;
          failed: number;
          totalResponseTime: number;
          timestamp: string;
          features: Array<{
            feature: string;
            status: string;
            message: string;
            responseTime: number;
          }>;
        };
        let output = `Test Results: ${testResult.overallStatus.toUpperCase()}\n`;
        output += `Total: ${testResult.totalTests}, Passed: ${testResult.passed}, Failed: ${testResult.failed}\n`;
        output += `Total Response Time: ${testResult.totalResponseTime}ms\n`;
        output += `Timestamp: ${testResult.timestamp}\n\n`;
        output += "Feature Tests:\n";
        for (const feature of testResult.features) {
          output += `- ${feature.feature}: ${feature.status} (${feature.responseTime}ms)\n  ${feature.message}\n`;
        }
        return output;
      }
      return JSON.stringify(result, null, 2);
    }
    case "test_performance": {
      const iterations = args.iterations as number | undefined;
      const result = await handleTestPerformance(api, { iterations });
      let output = `Performance Test Results:\n`;
      output += `Iterations: ${result.iterations}\n`;
      output += `Average Response Time: ${result.averageResponseTime.toFixed(2)}ms\n`;
      output += `Min Response Time: ${result.minResponseTime}ms\n`;
      output += `Max Response Time: ${result.maxResponseTime}ms\n\n`;
      output += "Individual Results:\n";
      for (const r of result.results) {
        output += `- ${r.operation}: ${r.time}ms\n`;
      }
      return output;
    }
    case "find_duplicates":
      return handleFindDuplicates(api, args as unknown as FindDuplicatesArgs);
    case "merge_duplicates":
      return handleMergeDuplicates(api, args as unknown as MergeDuplicatesArgs);
    default:
      throw new ValidationError(`Unknown utility action: ${action}`);
  }
}
