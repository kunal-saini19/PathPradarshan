import { NextRequest, NextResponse } from "next/server";
import { getStarterCode, mockTasks, mockTestCases, SupportedLanguage } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = id;
    const languageParam = request.nextUrl.searchParams.get("language") as SupportedLanguage | null;
    const task = mockTasks.find((t) => t.id === taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const selectedLanguage = languageParam && task.supportedLanguages.includes(languageParam)
      ? languageParam
      : task.language;

    const testCases = (mockTestCases[taskId as keyof typeof mockTestCases] || [])
      .filter((testCase) => !testCase.hidden)
      .map((testCase) => ({
        description: testCase.description,
        input: JSON.stringify(testCase.args),
        expectedOutput: JSON.stringify(testCase.expected),
      }));

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        difficulty: task.difficulty,
        category: task.category,
        rewardTokens: task.rewardTokens,
        timeLimit: task.timeLimit,
        functionName: task.functionName,
        language: selectedLanguage,
        supportedLanguages: task.supportedLanguages,
        starterCode: getStarterCode(task, selectedLanguage),
        testCases,
      },
    });
  } catch (error) {
    console.error("Task Detail API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}
