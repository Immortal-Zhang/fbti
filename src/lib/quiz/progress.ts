import { SELF_QUESTIONS } from "@/data/questions/self";
import { CONTENT_VERSION, type Answer, type ScoredResult } from "@/lib/domain";
import { scoreAnswers } from "@/lib/scoring";
import { PERSONAL_MANUAL_VERSION } from "@/lib/personal-manual/schema";

export const STORAGE_KEY = "hum:quiz-progress";
export const PROGRESS_SCHEMA_VERSION = 2 as const;
export const MAX_PROGRESS_LENGTH = 8192;

export interface QuizProgress {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  contentVersion: typeof CONTENT_VERSION;
  manualVersion: typeof PERSONAL_MANUAL_VERSION;
  answers: Answer[];
  currentIndex: number;
  completed: boolean;
}

export class ProgressError extends Error {
  constructor(
    message: string,
    readonly reason: "invalid" | "incompatible" = "invalid",
  ) {
    super(message);
    this.name = "ProgressError";
  }
}

export function createProgress(): QuizProgress {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    manualVersion: PERSONAL_MANUAL_VERSION,
    answers: [],
    currentIndex: 0,
    completed: false,
  };
}

function record(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function keysEqual(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
}

/** Returns owned, canonical data; storage never supplies a trusted result or score. */
export function validateProgress(value: unknown): QuizProgress {
  if (!record(value)) throw new ProgressError("进度必须是有效对象。");
  if (
    value.schemaVersion !== PROGRESS_SCHEMA_VERSION ||
    value.contentVersion !== CONTENT_VERSION ||
    value.manualVersion !== PERSONAL_MANUAL_VERSION
  ) {
    throw new ProgressError(
      "当前题库无法安全读取此版本的进度。",
      "incompatible",
    );
  }
  if (
    !keysEqual(value, [
      "schemaVersion",
      "contentVersion",
      "manualVersion",
      "answers",
      "currentIndex",
      "completed",
    ]) ||
    !Array.isArray(value.answers) ||
    value.answers.length > SELF_QUESTIONS.length ||
    !Number.isInteger(value.currentIndex) ||
    typeof value.currentIndex !== "number" ||
    value.currentIndex < 0 ||
    value.currentIndex >= SELF_QUESTIONS.length ||
    typeof value.completed !== "boolean"
  ) {
    throw new ProgressError("进度的字段或题目位置不正确。");
  }
  const byId = new Map<string, Answer>();
  for (const answer of value.answers) {
    if (
      !record(answer) ||
      !keysEqual(answer, ["questionId", "optionId"]) ||
      typeof answer.questionId !== "string" ||
      typeof answer.optionId !== "string"
    ) {
      throw new ProgressError("进度中包含无法读取的答案。");
    }
    const question = SELF_QUESTIONS.find(
      (item) => item.id === answer.questionId,
    );
    if (
      !question ||
      byId.has(answer.questionId) ||
      !question.options.some((option) => option.id === answer.optionId)
    ) {
      throw new ProgressError("进度中包含重复题目或未知选项。");
    }
    byId.set(answer.questionId, {
      questionId: answer.questionId,
      optionId: answer.optionId,
    });
  }
  const answers = SELF_QUESTIONS.flatMap((question) => {
    const answer = byId.get(question.id);
    return answer ? [answer] : [];
  });
  if (value.completed) {
    // The real scoring contract is also the completion gate.
    try {
      scoreAnswers(answers);
    } catch {
      throw new ProgressError("未答完所有题目，不能恢复正式结果。");
    }
  }
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    manualVersion: PERSONAL_MANUAL_VERSION,
    answers,
    currentIndex: value.currentIndex,
    completed: value.completed,
  };
}

export type DecodedProgress =
  | { kind: "empty"; progress: QuizProgress }
  | { kind: "valid"; progress: QuizProgress }
  | { kind: "migrated"; progress: QuizProgress }
  | { kind: "invalid" | "incompatible"; progress: QuizProgress };

/** Only the documented phase-two five-field format has an explicit migration. */
function migrateLegacyProgress(value: Record<string, unknown>): QuizProgress {
  if (value.contentVersion !== CONTENT_VERSION) {
    throw new ProgressError("旧进度使用了不同题库，无法迁移。", "incompatible");
  }
  if (!keysEqual(value, ["schemaVersion", "contentVersion", "answers", "currentIndex", "completed"])) {
    throw new ProgressError("旧进度包含未知字段，无法迁移。");
  }
  return validateProgress({
    ...value,
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    manualVersion: PERSONAL_MANUAL_VERSION,
  });
}

/** Unknown formats start a new run; known old answers are validated, never guessed. */
export function decodeProgress(raw: string | null): DecodedProgress {
  if (raw === null) return { kind: "empty", progress: createProgress() };
  if (
    typeof raw !== "string" ||
    raw.length > MAX_PROGRESS_LENGTH ||
    raw.length === 0
  )
    return { kind: "invalid", progress: createProgress() };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (record(parsed) && parsed.schemaVersion === 1) {
      return { kind: "migrated", progress: migrateLegacyProgress(parsed) };
    }
    if (record(parsed) && parsed.schemaVersion === PROGRESS_SCHEMA_VERSION && parsed.manualVersion === "pm-1") {
      // Only the known prior prose version is upgraded. Strict validation still
      // checks fields, hum-1, original answers, position and completion below.
      return { kind: "migrated", progress: validateProgress({ ...parsed, manualVersion: PERSONAL_MANUAL_VERSION }) };
    }
    return { kind: "valid", progress: validateProgress(parsed) };
  } catch (error) {
    return {
      kind: error instanceof ProgressError ? error.reason : "invalid",
      progress: createProgress(),
    };
  }
}

export function withAnswer(
  progress: QuizProgress,
  questionId: string,
  optionId: string,
): QuizProgress {
  const current = validateProgress(progress);
  const question = SELF_QUESTIONS.find((item) => item.id === questionId);
  if (!question?.options.some((option) => option.id === optionId)) {
    throw new ProgressError("请选择当前题库中的有效选项。");
  }
  if (
    current.answers.some(
      (answer) =>
        answer.questionId === questionId && answer.optionId === optionId,
    )
  ) {
    return current;
  }
  return validateProgress({
    ...current,
    answers: [
      ...current.answers.filter((answer) => answer.questionId !== questionId),
      { questionId, optionId },
    ],
    completed: false,
  });
}

export function withQuestionIndex(
  progress: QuizProgress,
  currentIndex: number,
): QuizProgress {
  return validateProgress({ ...validateProgress(progress), currentIndex });
}

export function completeProgress(progress: QuizProgress): {
  progress: QuizProgress;
  result: ScoredResult;
} {
  const current = validateProgress(progress);
  const result = scoreAnswers(current.answers);
  return {
    progress: {
      ...current,
      currentIndex: SELF_QUESTIONS.length - 1,
      completed: true,
    },
    result,
  };
}
