import { TodoistApi } from "@doist/todoist-api-typescript";

interface ApiResponse {
  results?: unknown[];
  data?: unknown[];
}

function extractArrayFromResponse(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  const apiResponse = response as ApiResponse;
  return apiResponse?.results || apiResponse?.data || [];
}

interface TestResult {
  status: "success" | "error";
  message: string;
  responseTime?: number;
  apiVersion?: string;
  error?: string;
}

interface FeatureTestResult {
  feature: string;
  status: "success" | "error";
  message: string;
  responseTime: number;
  details?: Record<string, unknown>;
}

interface ComprehensiveTestResult {
  overallStatus: "success" | "partial" | "error";
  totalTests: number;
  passed: number;
  failed: number;
  features: FeatureTestResult[];
  totalResponseTime: number;
  timestamp: string;
}

export async function handleTestConnection(
  todoistClient: TodoistApi
): Promise<TestResult> {
  try {
    const startTime = Date.now();
    await todoistClient.getProjects();
    const responseTime = Date.now() - startTime;

    return {
      status: "success",
      message: "Connection successful",
      responseTime,
      apiVersion: "v2",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testTaskOperations(
  todoistClient: TodoistApi
): Promise<FeatureTestResult> {
  const startTime = Date.now();
  try {
    // Test task retrieval
    const result = await todoistClient.getTasks();
    // Handle various API response formats
    const taskArray = extractArrayFromResponse(result);

    return {
      feature: "Task Operations",
      status: "success",
      message: `Successfully retrieved ${taskArray.length} tasks`,
      responseTime: Date.now() - startTime,
      details: {
        taskCount: taskArray.length,
        sampleTask:
          (taskArray[0] as { content?: string })?.content || "No tasks found",
      },
    };
  } catch (error) {
    return {
      feature: "Task Operations",
      status: "error",
      message:
        error instanceof Error ? error.message : "Task operations failed",
      responseTime: Date.now() - startTime,
    };
  }
}

async function testProjectOperations(
  todoistClient: TodoistApi
): Promise<FeatureTestResult> {
  const startTime = Date.now();
  try {
    const result = await todoistClient.getProjects();
    // Handle various API response formats
    const projectArray = extractArrayFromResponse(result);

    return {
      feature: "Project Operations",
      status: "success",
      message: `Successfully retrieved ${projectArray.length} projects`,
      responseTime: Date.now() - startTime,
      details: {
        projectCount: projectArray.length,
        sampleProject:
          (projectArray[0] as { name?: string })?.name || "No projects found",
      },
    };
  } catch (error) {
    return {
      feature: "Project Operations",
      status: "error",
      message:
        error instanceof Error ? error.message : "Project operations failed",
      responseTime: Date.now() - startTime,
    };
  }
}

async function testLabelOperations(
  todoistClient: TodoistApi
): Promise<FeatureTestResult> {
  const startTime = Date.now();
  try {
    const result = await todoistClient.getLabels();
    // Handle various API response formats
    const labelArray = extractArrayFromResponse(result);

    return {
      feature: "Label Operations",
      status: "success",
      message: `Successfully retrieved ${labelArray.length} labels`,
      responseTime: Date.now() - startTime,
      details: {
        labelCount: labelArray.length,
        sampleLabel:
          (labelArray[0] as { name?: string })?.name || "No labels found",
      },
    };
  } catch (error) {
    return {
      feature: "Label Operations",
      status: "error",
      message:
        error instanceof Error ? error.message : "Label operations failed",
      responseTime: Date.now() - startTime,
    };
  }
}

async function testSectionOperations(
  todoistClient: TodoistApi
): Promise<FeatureTestResult> {
  const startTime = Date.now();
  try {
    // Get projects first to test sections
    const result = await todoistClient.getProjects();
    // Handle various API response formats
    const projectArray = extractArrayFromResponse(result);

    if (projectArray.length === 0) {
      return {
        feature: "Section Operations",
        status: "success",
        message: "No projects available to test sections",
        responseTime: Date.now() - startTime,
      };
    }

    const sectionsResult = await todoistClient.getSections(
      { project_id: (projectArray[0] as { id: string }).id } as unknown as Parameters<typeof todoistClient.getSections>[0]
    );
    // Handle various API response formats
    const sectionArray = extractArrayFromResponse(sectionsResult);

    return {
      feature: "Section Operations",
      status: "success",
      message: `Successfully retrieved ${sectionArray.length} sections`,
      responseTime: Date.now() - startTime,
      details: {
        sectionCount: sectionArray.length,
        projectId: (projectArray[0] as { id: string }).id,
      },
    };
  } catch (error) {
    return {
      feature: "Section Operations",
      status: "error",
      message:
        error instanceof Error ? error.message : "Section operations failed",
      responseTime: Date.now() - startTime,
    };
  }
}

async function testCommentOperations(
  todoistClient: TodoistApi
): Promise<FeatureTestResult> {
  const startTime = Date.now();
  try {
    // Get a task to test comments
    const result = await todoistClient.getTasks();
    // Handle various API response formats
    const taskArray = extractArrayFromResponse(result);

    if (taskArray.length === 0) {
      return {
        feature: "Comment Operations",
        status: "success",
        message: "No tasks available to test comments",
        responseTime: Date.now() - startTime,
      };
    }

    const commentsResult = await todoistClient.getComments({
      taskId: (taskArray[0] as { id: string }).id,
    });
    // Handle various API response formats
    const commentArray = extractArrayFromResponse(commentsResult);

    return {
      feature: "Comment Operations",
      status: "success",
      message: `Successfully retrieved comments for task`,
      responseTime: Date.now() - startTime,
      details: {
        commentCount: commentArray.length,
        taskId: (taskArray[0] as { id: string }).id,
      },
    };
  } catch (error) {
    return {
      feature: "Comment Operations",
      status: "error",
      message:
        error instanceof Error ? error.message : "Comment operations failed",
      responseTime: Date.now() - startTime,
    };
  }
}

function formatTestResults(
  results: FeatureTestResult[]
): ComprehensiveTestResult {
  const passed = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "error").length;
  const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);

  return {
    overallStatus: failed === 0 ? "success" : passed > 0 ? "partial" : "error",
    totalTests: results.length,
    passed,
    failed,
    features: results,
    totalResponseTime,
    timestamp: new Date().toISOString(),
  };
}

export async function handleTestAllFeatures(
  todoistClient: TodoistApi,
  args?: { mode?: "basic" | "enhanced" }
): Promise<ComprehensiveTestResult | unknown> {
  // Use enhanced testing if requested
  if (args?.mode === "enhanced") {
    const { handleTestAllFeaturesEnhanced } = await import(
      "./test-handlers-enhanced/index.js"
    );
    return handleTestAllFeaturesEnhanced(todoistClient);
  }

  // Default to basic testing
  const results: FeatureTestResult[] = [];

  // Test each feature
  results.push(await testTaskOperations(todoistClient));
  results.push(await testProjectOperations(todoistClient));
  results.push(await testLabelOperations(todoistClient));
  results.push(await testSectionOperations(todoistClient));
  results.push(await testCommentOperations(todoistClient));

  return formatTestResults(results);
}

export async function handleTestPerformance(
  todoistClient: TodoistApi,
  args?: { iterations?: number }
): Promise<{
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  iterations: number;
  results: Array<{ operation: string; time: number }>;
}> {
  const iterations = args?.iterations || 5;
  const results: Array<{ operation: string; time: number }> = [];

  for (let i = 0; i < iterations; i++) {
    // Test project retrieval
    const projectStart = Date.now();
    await todoistClient.getProjects();
    results.push({ operation: "getProjects", time: Date.now() - projectStart });

    // Test task retrieval
    const taskStart = Date.now();
    await todoistClient.getTasks();
    results.push({ operation: "getTasks", time: Date.now() - taskStart });
  }

  const times = results.map((r) => r.time);
  const averageResponseTime =
    times.reduce((sum, t) => sum + t, 0) / times.length;
  const minResponseTime = Math.min(...times);
  const maxResponseTime = Math.max(...times);

  return {
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    iterations,
    results,
  };
}
