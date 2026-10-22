import { SELF_QUESTIONS } from "../../data/questions/self";
import {
  CONTENT_VERSION,
  DIMENSION_IDS,
  type Answer,
  type DimensionId,
  type DimensionReading,
  type Scores,
  type ScoredResult,
  type TypeKey,
} from "../domain";

export class ScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Runtime validation is intentional: a TypeScript type cannot validate URL/storage data. */
export function validateScores(scores: Scores): void {
  if (!isRecord(scores)) throw new ScoringError("维度分数必须是对象。");
  const keys = Object.keys(scores);
  if (
    keys.length !== DIMENSION_IDS.length ||
    keys.some((key) => !DIMENSION_IDS.includes(key as DimensionId))
  ) {
    throw new ScoringError("必须且只能包含四个已知维度。");
  }
  for (const id of DIMENSION_IDS) {
    const value = scores[id];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    ) {
      throw new ScoringError(`维度 ${id} 的分数必须是 0 到 100 的有限数字。`);
    }
  }
}

/** Bits are an internal catalogue index, never a four-letter public personality label. */
export function classifyScores(scores: Scores): TypeKey {
  validateScores(scores);
  return DIMENSION_IDS.map((id) => (scores[id] < 50 ? "0" : "1")).join(
    "",
  ) as TypeKey;
}

export function readScores(
  scores: Scores,
): Record<DimensionId, DimensionReading> {
  validateScores(scores);
  return Object.fromEntries(
    DIMENSION_IDS.map((id) => {
      const score = scores[id];
      const band = score < 40 ? "low" : score > 60 ? "high" : "middle";
      return [
        id,
        {
          score,
          band,
          dominant: band === "middle" ? "balanced" : band,
          intensity: Math.abs(score - 50) * 2,
        } satisfies DimensionReading,
      ];
    }),
  ) as Record<DimensionId, DimensionReading>;
}

function canonicalAnswers(answers: readonly Answer[]): Answer[] {
  if (!Array.isArray(answers)) throw new ScoringError("答案必须是数组。");
  if (answers.length !== SELF_QUESTIONS.length) {
    throw new ScoringError(`需要完整的 ${SELF_QUESTIONS.length} 道答案。`);
  }
  const byId = new Map<string, Answer>();
  for (const answer of answers) {
    if (
      !isRecord(answer) ||
      Object.keys(answer).length !== 2 ||
      typeof answer.questionId !== "string" ||
      typeof answer.optionId !== "string"
    ) {
      throw new ScoringError("每份答案必须且只能包含题目编号和选项编号。");
    }
    const question = SELF_QUESTIONS.find(
      (item) => item.id === answer.questionId,
    );
    if (!question)
      throw new ScoringError(`无法识别题目：${answer.questionId}。`);
    if (byId.has(answer.questionId))
      throw new ScoringError(`题目 ${answer.questionId} 被重复回答。`);
    if (!question.options.some((option) => option.id === answer.optionId)) {
      throw new ScoringError(`题目 ${answer.questionId} 的选项无效。`);
    }
    byId.set(answer.questionId, {
      questionId: answer.questionId,
      optionId: answer.optionId,
    });
  }
  return SELF_QUESTIONS.map((question) => {
    const answer = byId.get(question.id);
    if (!answer) throw new ScoringError(`缺少题目 ${question.id} 的答案。`);
    return answer;
  });
}

function fingerprintCanonical(answers: readonly Answer[]): string {
  const source = JSON.stringify([
    CONTENT_VERSION,
    answers.map(({ questionId, optionId }) => [questionId, optionId]),
  ]);
  // FNV-1a: a stable content seed, not authentication, encryption, or a unique identity.
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index++) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 0x01000193);
  }
  return `${CONTENT_VERSION}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function fingerprintAnswers(answers: readonly Answer[]): string {
  return fingerprintCanonical(canonicalAnswers(answers));
}

export function scoreAnswers(answers: readonly Answer[]): ScoredResult {
  const canonical = canonicalAnswers(answers);
  const scores: Scores = {
    energy: 0,
    expression: 0,
    navigation: 0,
    connection: 0,
  };
  for (let index = 0; index < SELF_QUESTIONS.length; index++) {
    const question = SELF_QUESTIONS[index];
    // The canonicalization above guarantees this option exists.
    const option = question.options.find(
      (item) => item.id === canonical[index].optionId,
    )!;
    scores[question.dimension] += question.reverse
      ? 4 - option.value
      : option.value;
  }
  // Five equal-weight questions × four points = 20. Multiplying by five is exact.
  for (const id of DIMENSION_IDS) scores[id] *= 5;
  return {
    version: CONTENT_VERSION,
    scores,
    typeKey: classifyScores(scores),
    readings: readScores(scores),
    fingerprint: fingerprintCanonical(canonical),
  };
}
