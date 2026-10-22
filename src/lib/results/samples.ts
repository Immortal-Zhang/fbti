import { SELF_QUESTIONS } from "@/data/questions/self";
import {
  DIMENSION_IDS,
  type Answer,
  type Scores,
  type TypeKey,
} from "@/lib/domain";
import { validateScores } from "@/lib/scoring";

/** Explicitly fictional catalogue fixtures, scored through the real engine. */
export function sampleAnswers(scores: Scores): Answer[] {
  validateScores(scores);
  for (const id of DIMENSION_IDS) {
    if (scores[id] % 5 !== 0) throw new Error("样本分数必须是 5 的倍数。");
  }
  const seen = { energy: 0, expression: 0, navigation: 0, connection: 0 };
  return SELF_QUESTIONS.map((question) => {
    const total = scores[question.dimension] / 5;
    const value =
      Math.floor(total / 5) + (seen[question.dimension]++ < total % 5 ? 1 : 0);
    const rawValue = question.reverse ? 4 - value : value;
    const option = question.options.find((item) => item.value === rawValue);
    if (!option) throw new Error("题库选项不完整。");
    return { questionId: question.id, optionId: option.id };
  });
}

export function sampleScores(key: TypeKey): Scores {
  return Object.fromEntries(
    DIMENSION_IDS.map((id, i) => [id, key[i] === "0" ? 25 : 75]),
  ) as Scores;
}
