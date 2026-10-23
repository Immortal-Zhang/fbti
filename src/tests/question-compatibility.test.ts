import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { FRIEND_QUESTIONS } from "@/data/questions/friend";
import { orderedQuestionOptions, retainedQuestionOption } from "@/data/questions/presentation";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import { DIMENSION_IDS, type Question } from "@/lib/domain";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { scoreAnswers } from "@/lib/scoring";
import { scoreFriendAnswers } from "@/lib/friends/score";
import { createProgress, decodeProgress, withAnswer } from "@/lib/quiz/progress";
import { createFriendProgress, decodeFriendProgress } from "@/lib/friends/progress";
import { encodePacket, publicSelfFromAnswers } from "@/lib/sharing/snapshot";
import original from "./fixtures/question-contract.json";

const contract = (questions: readonly Question[]) =>
  questions.map(({ id, dimension, reverse, options }) => ({
    id,
    dimension,
    reverse,
    options: options.map(({ id, value }) => ({ id, value })),
  }));

describe("clear-3 choices and legacy compatibility", () => {
  it("retains every original stored answer ID, score, direction and serial position", () => {
    expect(contract(SELF_QUESTIONS)).toEqual(original.self);
    expect(contract(FRIEND_QUESTIONS)).toEqual(original.friend);
  });
  it("shows exactly three distinct choices without altering legacy answers or reports", () => {
    const answers = sampleAnswers(sampleScores("0101"));
    const before = generatePersonalManual(answers);
    for (const question of [...SELF_QUESTIONS, ...FRIEND_QUESTIONS]) {
      const sourceOrder = question.options.map(({ id }) => id);
      const shown = orderedQuestionOptions(question);
      expect(shown.map(({ value }) => value)).toEqual([0, 2, 4]);
      expect(new Set(shown.map(({ text }) => text)).size).toBe(3);
      for (const option of shown) {
        expect(option.text.trim().length).toBeGreaterThan(0);
        expect(question.options.find(({ id }) => id === option.id)?.value).toBe(option.value);
      }
      expect(question.options.map(({ id }) => id)).toEqual(sourceOrder);
    }
    expect(generatePersonalManual(answers)).toStrictEqual(before);
  });
  it("keeps both scoring directions and all sixteen models reachable with three choices", () => {
    for (const [questions, score] of [
      [SELF_QUESTIONS, scoreAnswers],
      [FRIEND_QUESTIONS, scoreFriendAnswers],
    ] as const) {
      for (const device of PERSONALITY_TYPES) {
        const answers = questions.map((q) => {
          const high = device.key[DIMENSION_IDS.indexOf(q.dimension)] === "1";
          const position = high !== q.reverse ? 2 : 0;
          return { questionId: q.id, optionId: orderedQuestionOptions(q)[position].id };
        });
        expect(score(answers).typeKey).toBe(device.key);
        expect(Object.values(score(answers).scores)).toEqual([...device.key].map((bit) => bit === "1" ? 100 : 0));
      }
      const middle = questions.map((q) => ({ questionId: q.id, optionId: orderedQuestionOptions(q)[1].id }));
      expect(Object.values(score(middle).scores)).toEqual([50, 50, 50, 50]);
    }
  });
  it("preserves omitted old choices on restore and only replaces an explicitly changed answer", () => {
    for (const q of [...SELF_QUESTIONS, ...FRIEND_QUESTIONS]) {
      for (const option of q.options) {
        expect(retainedQuestionOption(q, option.id)).toEqual(
          option.value === 1 || option.value === 3 ? option : undefined,
        );
      }
      expect(retainedQuestionOption(q)).toBeUndefined();
    }
    const answers = sampleAnswers(sampleScores("0000"));
    const old = { ...createProgress(), answers, currentIndex: 19, completed: true };
    const restored = decodeProgress(JSON.stringify(old)).progress;
    expect(restored).toEqual(old);
    expect(generatePersonalManual(restored.answers)).toEqual(generatePersonalManual(answers));
    const choice = orderedQuestionOptions(SELF_QUESTIONS[0])[1];
    const edited = withAnswer(restored, "Q01", choice.id);
    expect(edited.answers[0].optionId).toBe(choice.id);
    expect(edited.answers.slice(1)).toEqual(answers.slice(1));
    expect(edited.completed).toBe(false);
    expect(retainedQuestionOption(SELF_QUESTIONS[0], choice.id)).toBeUndefined();
    expect(scoreAnswers(edited.answers).scores).toEqual({ energy: 30, expression: 25, navigation: 25, connection: 25 });
    const invitation = encodePacket({ kind: "invite", self: publicSelfFromAnswers(answers), invitationId: "0303030303030303" });
    const observation = {
      ...createFriendProgress(invitation),
      answers: FRIEND_QUESTIONS.map((q) => ({ questionId: q.id, optionId: q.options.find((o) => o.value === 1)!.id })),
      currentIndex: 7,
      completed: true,
    };
    expect(decodeFriendProgress(JSON.stringify(observation), invitation)).toEqual({ invalid: false, progress: observation });
  });
});
