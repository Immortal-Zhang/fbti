import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { FRIEND_QUESTIONS } from "@/data/questions/friend";
import { orderedQuestionOptions } from "@/data/questions/presentation";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import type { Question } from "@/lib/domain";
import original from "./fixtures/question-contract.json";

const contract = (questions: readonly Question[]) =>
  questions.map(({ id, dimension, reverse, options }) => ({
    id,
    dimension,
    reverse,
    options: options.map(({ id, value }) => ({ id, value })),
  }));

describe("plain-2 wording compatibility", () => {
  it("retains every original stored answer ID, score, direction and serial position", () => {
    expect(contract(SELF_QUESTIONS)).toEqual(original.self);
    expect(contract(FRIEND_QUESTIONS)).toEqual(original.friend);
  });
  it("display ordering cannot alter saved answers or the resulting report", () => {
    const answers = sampleAnswers(sampleScores("0101"));
    const before = generatePersonalManual(answers);
    for (const question of [...SELF_QUESTIONS, ...FRIEND_QUESTIONS]) {
      const sourceOrder = question.options.map(({ id }) => id);
      const shown = orderedQuestionOptions(question);
      expect(shown.map(({ value }) => value)).toEqual([0, 1, 2, 3, 4]);
      expect(new Set(shown.map(({ id }) => id))).toEqual(new Set(sourceOrder));
      expect(question.options.map(({ id }) => id)).toEqual(sourceOrder);
    }
    expect(generatePersonalManual(answers)).toStrictEqual(before);
  });
});
