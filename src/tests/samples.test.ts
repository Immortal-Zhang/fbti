import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "../data/questions/self";
import { DIMENSION_IDS, type Scores, type TypeKey } from "../lib/domain";
import { sampleAnswers, sampleScores } from "../lib/results/samples";
import { scoreAnswers } from "../lib/scoring";

const fillScores = (value: number): Scores => ({
  energy: value,
  expression: value,
  navigation: value,
  connection: value,
});
const typeKeys = Array.from(
  { length: 16 },
  (_, index) => index.toString(2).padStart(4, "0") as TypeKey,
);

describe("fictional catalogue samples use the real scoring contract", () => {
  it.each(typeKeys)(
    "round-trips catalogue preset %s through twenty genuine answers",
    (key) => {
      const scores = sampleScores(key);
      const answers = sampleAnswers(scores);
      expect(answers).toHaveLength(20);
      expect(answers.map(({ questionId }) => questionId)).toEqual(
        SELF_QUESTIONS.map(({ id }) => id),
      );
      const scored = scoreAnswers(answers);
      expect(scored.scores).toEqual(scores);
      expect(scored.typeKey).toBe(key);
      DIMENSION_IDS.forEach((dimension, index) => {
        expect(scores[dimension]).toBe(key[index] === "0" ? 25 : 75);
      });
    },
  );

  it.each(DIMENSION_IDS)(
    "round-trips every 0..100 five-point step on %s",
    (dimension) => {
      for (let value = 0; value <= 100; value += 5) {
        const scores = { ...fillScores(50), [dimension]: value };
        const answers = sampleAnswers(scores);
        expect(scoreAnswers(answers).scores).toEqual(scores);
        expect(sampleAnswers(scores)).toEqual(answers);
      }
    },
  );

  it("round-trips mixed dimensions including both extrema and middle boundaries", () => {
    const values = [0, 40, 50, 60, 100];
    for (const energy of values)
      for (const expression of values) {
        for (const navigation of values)
          for (const connection of values) {
            const scores = { energy, expression, navigation, connection };
            expect(scoreAnswers(sampleAnswers(scores)).scores).toEqual(scores);
          }
      }
  });

  it("leaves frozen scores unchanged and creates independent answer arrays", () => {
    const scores = Object.freeze({
      energy: 5,
      expression: 45,
      navigation: 60,
      connection: 95,
    });
    const first = sampleAnswers(scores);
    const second = sampleAnswers(scores);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(scoreAnswers(first).scores).toEqual(scores);
  });

  it.each(DIMENSION_IDS)(
    "rejects every non-five-point score on %s",
    (dimension) => {
      for (let value = 1; value < 100; value++) {
        if (value % 5 !== 0) {
          expect(() =>
            sampleAnswers({ ...fillScores(50), [dimension]: value }),
          ).toThrow("5 的倍数");
        }
      }
      for (const value of [0.1, 2.5, 39.99, 60.01, 99.999]) {
        expect(() =>
          sampleAnswers({ ...fillScores(50), [dimension]: value }),
        ).toThrow("5 的倍数");
      }
    },
  );

  it.each([
    null,
    [],
    {},
    { ...fillScores(50), extra: 0 },
    { energy: 50, expression: 50, navigation: 50 },
    { ...fillScores(50), energy: -5 },
    { ...fillScores(50), energy: 105 },
    { ...fillScores(50), energy: Infinity },
    { ...fillScores(50), energy: NaN },
    { ...fillScores(50), energy: "50" },
  ])("rejects malformed score input %#", (scores) => {
    expect(() => sampleAnswers(scores as Scores)).toThrow();
  });
});
