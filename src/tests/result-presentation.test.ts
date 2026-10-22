import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import {
  getCompletedReport,
  getResultIntroduction,
  BASIC_SECTIONS,
} from "@/features/result/presentation";

describe("formal result boundary", () => {
  const answers = sampleAnswers(sampleScores("0000"));

  it("does not turn a full but unconfirmed draft into a formal report", () => {
    expect(getCompletedReport({ completed: false, answers })).toBeNull();
  });

  it("does not trust a completed flag with incomplete or invalid answers", () => {
    expect(
      getCompletedReport({ completed: true, answers: answers.slice(0, 19) }),
    ).toBeNull();
    expect(
      getCompletedReport({
        completed: true,
        answers: [
          ...answers.slice(0, 19),
          { questionId: "Q20", optionId: "unknown" },
        ],
      }),
    ).toBeNull();
  });

  it.each(PERSONALITY_TYPES)(
    "reconstructs $id from real question responses",
    (device) => {
      const report = getCompletedReport({
        completed: true,
        answers: sampleAnswers(sampleScores(device.key)),
      });
      expect(report?.manual.device.id).toBe(device.id);
      expect(report?.result.scores).toEqual(sampleScores(device.key));
      expect(report?.manual.sections).toHaveLength(10);
      expect(
        BASIC_SECTIONS.every((id) =>
          report?.manual.sections.some((section) => section.id === id),
        ),
      ).toBe(true);
      const copy = getResultIntroduction(report!.result, device);
      expect(copy.description).toBe(device.description);
      expect(copy.tags).toEqual([...device.tags]);
    },
  );

  it("recalculates a changed answer instead of retaining the prior result", () => {
    const before = getCompletedReport({ completed: true, answers })!;
    const first = SELF_QUESTIONS[0];
    const previous = answers[0];
    const different = first.options.find(
      (option) => option.id !== previous.optionId,
    )!;
    const after = getCompletedReport({
      completed: true,
      answers: [
        { questionId: first.id, optionId: different.id },
        ...answers.slice(1),
      ],
    })!;
    expect(after.result.fingerprint).not.toBe(before.result.fingerprint);
    expect(after.result.scores.energy).not.toBe(before.result.scores.energy);
  });

  it("keeps all-middle results distinct from an extreme catalogue description", () => {
    const report = getCompletedReport({
      completed: true,
      answers: sampleAnswers({
        energy: 50,
        expression: 50,
        navigation: 50,
        connection: 50,
      }),
    })!;
    const copy = getResultIntroduction(report.result, report.manual.device);
    expect(copy.balanced).toBe(true);
    expect(copy.description).toContain("中间带");
    expect(copy.description).not.toBe(report.manual.device.description);
    expect(copy.tags).toHaveLength(3);
    expect(new Set(copy.tags).size).toBe(3);
    expect(copy.tags).not.toEqual([...report.manual.device.tags]);
  });

  it("keeps actual strong tendencies when only one axis is in the middle", () => {
    const report = getCompletedReport({
      completed: true,
      answers: sampleAnswers({
        energy: 0,
        expression: 100,
        navigation: 50,
        connection: 25,
      }),
    })!;
    const copy = getResultIntroduction(report.result, report.manual.device);
    expect(copy.description).toContain("行动导航");
    expect(copy.tags).toEqual(["独处回血", "实时表达", "弹性模式"]);
  });
});
