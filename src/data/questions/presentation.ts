import type { Question } from "@/lib/domain";

/** Text/display revision only. hum-1 and friend-1 scoring remain unchanged. */
export const QUESTION_COPY_REVISION = "plain-2";

/** Display an ordered scale without mutating source order (used by saved serials). */
export function orderedQuestionOptions(question: Question) {
  return [...question.options].sort((left, right) => left.value - right.value);
}
