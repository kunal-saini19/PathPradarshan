import { NextRequest, NextResponse } from "next/server";
import { mockTasks, mockTestCases } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");

    let filteredTasks = [...mockTasks];

    if (difficulty) {
      filteredTasks = filteredTasks.filter((task) => task.difficulty === difficulty);
    }

    if (category) {
      filteredTasks = filteredTasks.filter((task) => task.category === category);
    }

    const tasksWithMetadata = filteredTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      category: task.category,
      rewardTokens: task.rewardTokens,
      timeLimit: task.timeLimit,
      language: task.language,
      supportedLanguages: task.supportedLanguages,
      testCasesCount: mockTestCases[task.id as keyof typeof mockTestCases]?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: tasksWithMetadata,
    });
  } catch (error) {
    console.error("Tasks API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
