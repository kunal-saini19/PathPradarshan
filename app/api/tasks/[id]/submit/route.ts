import { NextRequest, NextResponse } from "next/server";
import { mockTasks, mockTestCases, SupportedLanguage } from "@/lib/db";
import { parseAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mintTokensToWallet } from "@/lib/blockchain";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import ts from "typescript";
import { WEB3_NETWORK_NAME } from "@/lib/tokenomics";

interface SubmissionRequest {
  code: string;
  language?: SupportedLanguage;
  finalSubmit?: boolean;
}

type CaseResult = { test: string; passed: boolean; expected: string; actual: string };

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

function toNumericTaskId(taskId: string) {
  const numeric = Number(taskId.replace(/\D/g, ""));
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function stringifyValue(value: unknown) {
  return JSON.stringify(value);
}

async function runJsOrTsCase(
  code: string,
  functionName: string,
  args: unknown[],
  language: SupportedLanguage
) {
  const vm = await import("node:vm");
  const compiled = language === "typescript"
    ? ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
    : code;

  const context = vm.createContext({});
  const runner = `${compiled}\n;globalThis.__judge_result = ${functionName}(...${JSON.stringify(args)});`;
  new vm.Script(runner).runInContext(context, { timeout: 1500 });
  return (context as { __judge_result?: unknown }).__judge_result;
}

function runPythonCases(code: string, functionName: string, cases: { args: unknown[] }[]) {
  return new Promise<unknown[]>((resolve, reject) => {
    const payload = Buffer.from(JSON.stringify(cases), "utf8").toString("base64");
    const tempFile = join(tmpdir(), `judge-${randomUUID()}.py`);

    const harness = `${code}\n\nimport json, base64\n\n_cases = json.loads(base64.b64decode(\"${payload}\").decode(\"utf-8\"))\n_results = []\n\nfor _case in _cases:\n    try:\n        _res = ${functionName}(*_case[\"args\"])\n        _results.append({\"ok\": True, \"result\": _res})\n    except Exception as e:\n        _results.append({\"ok\": False, \"error\": str(e)})\n\nprint(json.dumps(_results))\n`;

    fs.writeFile(tempFile, harness, "utf8")
      .then(() => {
        const child = spawn("python", [tempFile], { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";

        const killTimer = setTimeout(() => child.kill(), 3000);

        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });

        child.on("close", async (codeValue) => {
          clearTimeout(killTimer);
          await fs.unlink(tempFile).catch(() => undefined);

          if (codeValue !== 0) {
            reject(new Error(stderr || "Python execution failed. Ensure Python is installed and available in PATH."));
            return;
          }

          try {
            resolve(JSON.parse(stdout.trim()));
          } catch {
            reject(new Error("Invalid Python runner output."));
          }
        });
      })
      .catch((err) => reject(err));
  });
}

async function validateTests(code: string, taskId: string, language: SupportedLanguage, functionName: string) {
  const testCases = mockTestCases[taskId as keyof typeof mockTestCases] || [];
  const results: CaseResult[] = [];
  let passed = 0;

  if (language === "python") {
    const pyResults = await runPythonCases(
      code,
      functionName,
      testCases.map((testCase) => ({ args: testCase.args }))
    );

    testCases.forEach((testCase, index) => {
      const pyResult = pyResults[index] as { ok?: boolean; result?: unknown; error?: string };
      const actualValue = pyResult?.ok ? pyResult.result : `Error: ${pyResult?.error ?? "Execution failed"}`;
      const isPass = pyResult?.ok && stringifyValue(pyResult.result) === stringifyValue(testCase.expected);
      if (isPass) passed += 1;

      results.push({
        test: testCase.description,
        passed: Boolean(isPass),
        expected: stringifyValue(testCase.expected),
        actual: stringifyValue(actualValue),
      });
    });
  } else {
    for (const testCase of testCases) {
      try {
        const actual = await runJsOrTsCase(code, functionName, testCase.args, language);
        const isPass = stringifyValue(actual) === stringifyValue(testCase.expected);
        if (isPass) passed += 1;

        results.push({
          test: testCase.description,
          passed: isPass,
          expected: stringifyValue(testCase.expected),
          actual: stringifyValue(actual),
        });
      } catch (error) {
        results.push({
          test: testCase.description,
          passed: false,
          expected: stringifyValue(testCase.expected),
          actual: stringifyValue(`Error: ${error instanceof Error ? error.message : "Execution failed"}`),
        });
      }
    }
  }

  return { passed, total: testCases.length, results, allPassed: passed === testCases.length && testCases.length > 0 };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = id;
    const body: SubmissionRequest = await request.json();
    const { code, language, finalSubmit } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Code cannot be empty" },
        { status: 400 }
      );
    }

    const task = mockTasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const selectedLanguage = language && task.supportedLanguages.includes(language)
      ? language
      : task.language;

    if (!task.supportedLanguages.includes(selectedLanguage)) {
      return NextResponse.json(
        { success: false, error: "Selected language is not supported for this task" },
        { status: 400 }
      );
    }

    if (selectedLanguage === "java") {
      return NextResponse.json(
        { success: false, error: "Java execution is not enabled in this build yet. Use JavaScript, TypeScript, or Python." },
        { status: 400 }
      );
    }

    const validation = await validateTests(code, taskId, selectedLanguage, task.functionName);

    const isFinalSubmit = Boolean(finalSubmit);
    let reward = 0;
    let alreadyRewarded = false;

    let mintedOnChain = false;

    if (isFinalSubmit && validation.allPassed) {
      const token = getBearerToken(request);
      const userId = parseAccessToken(token);

      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Please sign in to submit and claim rewards" },
          { status: 401 }
        );
      }

      const numericTaskId = toNumericTaskId(taskId);
      if (!numericTaskId) {
        return NextResponse.json(
          { success: false, error: "Invalid task id for reward processing" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      reward = task.rewardTokens;

      const alreadyClaimed = await prisma.tokenTransaction.findFirst({
        where: {
          userId,
          jobId: null,
          proposalId: null,
          type: "TASK_REWARD_CREDIT",
          network: `${WEB3_NETWORK_NAME}:task:${numericTaskId}`,
          status: "CONFIRMED",
        },
        select: { id: true },
      });

      if (alreadyClaimed) {
        alreadyRewarded = true;
        reward = 0;
      }

      if (reward > 0 && user.walletAddress) {
        try {
          await mintTokensToWallet({ walletAddress: user.walletAddress, tokenAmount: reward });
          mintedOnChain = true;
        } catch {
          mintedOnChain = false;
        }
      }

      if (reward > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: { tokens: { increment: reward } },
          });

          await tx.tokenTransaction.create({
            data: {
              txHash: `task-${userId}-${numericTaskId}-${Date.now()}`,
              userId,
              type: "TASK_REWARD_CREDIT",
              tokenAmount: reward,
              tokenPriceInr: 0,
              totalInr: 0,
              status: "CONFIRMED",
              network: `${WEB3_NETWORK_NAME}:task:${numericTaskId}`,
            },
          });
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        submitted: true,
        testResults: validation.results,
        passedTests: validation.passed,
        totalTests: validation.total,
        allPassed: validation.allPassed,
        tokensEarned: reward,
        alreadyRewarded,
        mintedOnChain,
        mode: isFinalSubmit ? "submit" : "run",
        language: selectedLanguage,
        message: !validation.allPassed
          ? `${validation.passed}/${validation.total} tests passed. Keep trying!`
          : isFinalSubmit
            ? mintedOnChain
              ? `Congratulations! All tests passed. ${reward} tokens were added to your wallet.`
              : `Congratulations! All tests passed. ${reward} tokens were added to your in-app wallet.`
            : "All tests passed. Click Submit Solution to claim rewards.",
      },
    });
  } catch (error) {
    console.error("Task Submission Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process submission",
      },
      { status: 500 }
    );
  }
}
