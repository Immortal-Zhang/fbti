import type {
  Answer,
  Manual,
  ScoredResult,
} from "@/lib/domain";
import { generateManual } from "@/lib/results/manual";
import { scoreAnswers } from "@/lib/scoring";

export interface CompletedReport {
  result: ScoredResult;
  manual: Manual;
}

/** No stored score or model name is trusted: always recalculate complete answers. */
export function getCompletedReport(progress: {
  completed: boolean;
  answers: readonly Answer[];
}): CompletedReport | null {
  if (progress.completed !== true) return null;
  try {
    const result = scoreAnswers(progress.answers);
    return { result, manual: generateManual(result) };
  } catch {
    return null;
  }
}

export { getResultIntroduction } from "@/lib/results/introduction";

export const BASIC_SECTIONS = [
  "charging",
  "malfunction",
  "hidden",
  "warranty",
] as const;
