import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "../data/questions/self";
import {
  DIMENSION_IDS,
  type Answer,
  type Scores,
  type TypeKey,
} from "../lib/domain";
import {
  classifyScores,
  fingerprintAnswers,
  readScores,
  scoreAnswers,
  ScoringError,
  validateScores,
} from "../lib/scoring";

const fillScores = (value: number): Scores => ({
  energy: value,
  expression: value,
  navigation: value,
  connection: value,
});

/** Choose answers by effective score; this is independent of displayed option order. */
function answersAt(values: Scores): Answer[] {
  return SELF_QUESTIONS.map((question) => {
    const effective = values[question.dimension];
    const raw = question.reverse ? 4 - effective : effective;
    const option = question.options.find((item) => item.value === raw)!;
    return { questionId: question.id, optionId: option.id };
  });
}

describe("scoreAnswers", () => {
  it.each([0, 1, 2, 3, 4])(
    "normalizes all effective %i answers exactly",
    (value) => {
      expect(scoreAnswers(answersAt(fillScores(value))).scores).toEqual(
        fillScores(value * 25),
      );
    },
  );

  it.each(DIMENSION_IDS)(
    "maps every 5-point position on %s without rounding drift",
    (dimension) => {
      for (let rawTotal = 0; rawTotal <= 20; rawTotal++) {
        let remaining = rawTotal;
        const answers = SELF_QUESTIONS.map((question) => {
          const effective =
            question.dimension === dimension ? Math.min(4, remaining) : 2;
          if (question.dimension === dimension) remaining -= effective;
          const raw = question.reverse ? 4 - effective : effective;
          return {
            questionId: question.id,
            optionId: question.options.find((option) => option.value === raw)!
              .id,
          };
        });
        expect(scoreAnswers(answers).scores[dimension]).toBe(rawTotal * 5);
      }
    },
  );

  it("uses both forward and reverse item scoring exactly once", () => {
    const rawZeroAnswers = SELF_QUESTIONS.map((question) => ({
      questionId: question.id,
      optionId: question.options.find((option) => option.value === 0)!.id,
    }));
    const scored = scoreAnswers(rawZeroAnswers);
    for (const dimension of DIMENSION_IDS) {
      const reversedCount = SELF_QUESTIONS.filter(
        (question) => question.dimension === dimension && question.reverse,
      ).length;
      expect(scored.scores[dimension]).toBe(reversedCount * 20);
    }
  });

  it("is invariant to answer order and repeated calls", () => {
    const answers = answersAt({
      energy: 1,
      expression: 3,
      navigation: 0,
      connection: 4,
    });
    const expected = scoreAnswers(answers);
    expect(scoreAnswers([...answers].reverse())).toEqual(expected);
    expect(scoreAnswers(answers)).toEqual(expected);
    expect(fingerprintAnswers([...answers].reverse())).toBe(
      expected.fingerprint,
    );
  });

  it("does not mutate the supplied answers", () => {
    const answers = Object.freeze(
      answersAt(fillScores(2)).map((answer) => Object.freeze(answer)),
    );
    expect(() => scoreAnswers(answers)).not.toThrow();
  });

  it("preserves response-level variation when scores are identical", () => {
    const original = answersAt(fillScores(2));
    const altered = original.map((answer) => ({ ...answer }));
    const firstTwoEnergy = SELF_QUESTIONS.filter(
      (question) => question.dimension === "energy",
    ).slice(0, 2);
    firstTwoEnergy.forEach((question, index) => {
      const effective = index === 0 ? 1 : 3;
      const value = question.reverse ? 4 - effective : effective;
      altered.find((answer) => answer.questionId === question.id)!.optionId =
        question.options.find((option) => option.value === value)!.id;
    });
    expect(scoreAnswers(altered).scores).toEqual(scoreAnswers(original).scores);
    expect(scoreAnswers(altered).fingerprint).not.toBe(
      scoreAnswers(original).fingerprint,
    );
  });

  const typeKeys = Array.from(
    { length: 16 },
    (_, index) => index.toString(2).padStart(4, "0") as TypeKey,
  );
  it.each(typeKeys)("can reach type %s using valid answers", (key) => {
    const values = Object.fromEntries(
      DIMENSION_IDS.map((dimension, index) => [
        dimension,
        key[index] === "0" ? 0 : 4,
      ]),
    ) as Scores;
    expect(scoreAnswers(answersAt(values)).typeKey).toBe(key);
  });

  it.each([
    ["null", null],
    ["object", {}],
    ["string", "not-answers"],
    ["empty array", []],
    ["missing answer", answersAt(fillScores(2)).slice(1)],
    [
      "extra answer",
      [...answersAt(fillScores(2)), answersAt(fillScores(2))[0]],
    ],
    [
      "duplicate question",
      answersAt(fillScores(2)).map((answer, index, all) =>
        index === 1 ? all[0] : answer,
      ),
    ],
    [
      "unknown question",
      answersAt(fillScores(2)).map((answer, index) =>
        index === 0 ? { ...answer, questionId: "alien-question" } : answer,
      ),
    ],
    [
      "unknown option",
      answersAt(fillScores(2)).map((answer, index) =>
        index === 0 ? { ...answer, optionId: "alien-option" } : answer,
      ),
    ],
    [
      "numeric option",
      answersAt(fillScores(2)).map((answer, index) =>
        index === 0 ? { ...answer, optionId: 2 } : answer,
      ),
    ],
    [
      "null item",
      answersAt(fillScores(2)).map((answer, index) =>
        index === 0 ? null : answer,
      ),
    ],
    [
      "extra answer field",
      answersAt(fillScores(2)).map((answer, index) =>
        index === 0 ? { ...answer, injected: true } : answer,
      ),
    ],
  ])("rejects malformed answers: %s", (_, value) => {
    expect(() => scoreAnswers(value as readonly Answer[])).toThrow(
      ScoringError,
    );
    expect(() => fingerprintAnswers(value as readonly Answer[])).toThrow(
      ScoringError,
    );
  });
});

describe("score classification and display readings", () => {
  it.each([
    [0, "low", "low", "0000"],
    [39.99, "low", "low", "0000"],
    [40, "middle", "balanced", "0000"],
    [49.99, "middle", "balanced", "0000"],
    [50, "middle", "balanced", "1111"],
    [60, "middle", "balanced", "1111"],
    [60.01, "high", "high", "1111"],
    [100, "high", "high", "1111"],
  ])(
    "classifies %s with middle-band honesty",
    (score, band, dominant, typeKey) => {
      const scores = fillScores(score as number);
      expect(classifyScores(scores)).toBe(typeKey);
      expect(readScores(scores).energy).toEqual({
        score,
        band,
        dominant,
        intensity: Math.abs((score as number) - 50) * 2,
      });
    },
  );

  it.each([
    null,
    [],
    {},
    { ...fillScores(50), injected: 1 },
    { energy: 50, expression: 50, navigation: 50 },
    { ...fillScores(50), energy: NaN },
    { ...fillScores(50), energy: Infinity },
    { ...fillScores(50), energy: -1 },
    { ...fillScores(50), energy: 101 },
    { ...fillScores(50), energy: "50" },
    { ...fillScores(50), energy: true },
    new Date(0),
  ])("rejects invalid score payload %#", (scores) => {
    expect(() => validateScores(scores as Scores)).toThrow(ScoringError);
    expect(() => classifyScores(scores as Scores)).toThrow(ScoringError);
    expect(() => readScores(scores as Scores)).toThrow(ScoringError);
  });
});
