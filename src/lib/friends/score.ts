import { FRIEND_QUESTIONS, FRIEND_VERSION } from "@/data/questions/friend";
import { DIMENSION_IDS, type Answer, type Scores } from "@/lib/domain";
import { classifyScores, readScores } from "@/lib/scoring";

export function validateFriendAnswers(
  input: unknown,
  partial = false,
): Answer[] {
  if (
    !Array.isArray(input) ||
    input.length > 8 ||
    (!partial && input.length !== 8)
  )
    throw new Error("需要完整的8道朋友观察。");
  const seen = new Set<string>();
  for (const answer of input) {
    if (
      !answer ||
      typeof answer !== "object" ||
      Array.isArray(answer) ||
      Object.keys(answer).sort().join(",") !== "optionId,questionId"
    )
      throw new Error("朋友观察记录格式不正确。");
    const question = FRIEND_QUESTIONS.find((q) => q.id === answer.questionId);
    if (
      !question ||
      seen.has(answer.questionId) ||
      !question.options.some((o) => o.id === answer.optionId)
    )
      throw new Error("朋友观察中有重复题目或无效选项。");
    seen.add(answer.questionId);
  }
  return FRIEND_QUESTIONS.flatMap((q) => {
    const answer = input.find((a) => a.questionId === q.id);
    return answer ? [{ questionId: q.id, optionId: answer.optionId }] : [];
  });
}
export function scoreFriendAnswers(input: readonly Answer[]) {
  const answers = validateFriendAnswers(input);
  const scores: Scores = {
    energy: 0,
    expression: 0,
    navigation: 0,
    connection: 0,
  };
  FRIEND_QUESTIONS.forEach((q, i) => {
    const option = q.options.find((o) => o.id === answers[i].optionId)!;
    scores[q.dimension] += q.reverse ? 4 - option.value : option.value;
  });
  // Two equally weighted observations × 4 raw points, normalized to the existing 0–100 axes.
  for (const id of DIMENSION_IDS) scores[id] *= 12.5;
  return {
    version: FRIEND_VERSION,
    scores,
    typeKey: classifyScores(scores),
    readings: readScores(scores),
  };
}
