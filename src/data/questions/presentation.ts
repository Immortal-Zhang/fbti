import type { Question } from "@/lib/domain";
import { THREE_CHOICE_TEXT } from "./three-choice-text";

/** Three visible choices; the five-value scoring/storage contract stays readable. */
export const QUESTION_COPY_REVISION = "clear-3";

/** Keep original IDs/values and source order, which saved report serials depend on. */
export function orderedQuestionOptions(question: Question) {
  return question.options
    .filter((option) => option.value === 0 || option.value === 2 || option.value === 4)
    .sort((left, right) => left.value - right.value)
    .map((option) => ({
      ...option,
      text: THREE_CHOICE_TEXT[question.id][option.value / 2],
    }));
}

/** Preserve an old in-between answer without silently rounding it to a new choice. */
export function retainedQuestionOption(question: Question, selected?: string) {
  return question.options.find(
    (option) => option.id === selected && (option.value === 1 || option.value === 3),
  );
}
