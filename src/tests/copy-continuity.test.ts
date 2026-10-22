import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { QUESTION_FIELD_NOTES, questionFieldNote } from "@/data/creative/question-notes";
import type { Answer } from "@/lib/domain";
import type { PersonalManual } from "@/lib/personal-manual/schema";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { selectShareCopy } from "@/lib/share-copy/select";

const readFixture = (file: string): unknown => JSON.parse(readFileSync(
  new URL(`../../docs/qa/abstract-copy/${file}`, import.meta.url), "utf8",
));

describe("editorial additions preserve previously delivered copy", () => {
  it("replays all 23 pm-2 reports exactly, including prose, rule provenance and serial", () => {
    const names = [
      ...Array.from({ length: 16 }, (_, i) => `HUM-${101 + i}`),
      ...[0, 40, 50, 60, 100].map((value) => `boundary-${value}`),
      "trajectory-even", "trajectory-varied",
    ];
    for (const name of names) {
      const fixture = readFixture(`samples/${name}.json`) as { answers: Answer[]; manual: PersonalManual };
      expect(generatePersonalManual(fixture.answers, "pm-2"), name).toStrictEqual(fixture.manual);
    }
  });

  it("replays all 96 score-dependent share selections without changing their copy or space budgets", () => {
    const fixtures = readFixture("poster-selection.json") as Array<ReturnType<typeof selectShareCopy> & { answers: Answer[]; variant: string }>;
    expect(fixtures).toHaveLength(96);
    for (const { answers, variant, ...expected } of fixtures) {
      expect(selectShareCopy(answers, expected.format), `${expected.device.id}/${variant}/${expected.format}`).toStrictEqual(expected);
    }
  });
});

describe("scene annotations are separate from scored responses", () => {
  it("covers each real question once without adding answer-dependent fields", () => {
    expect(QUESTION_FIELD_NOTES.map(({ questionId }) => questionId)).toEqual(SELF_QUESTIONS.map(({ id }) => id));
    expect(new Set(QUESTION_FIELD_NOTES.map(({ text }) => text)).size).toBe(20);
    for (const note of QUESTION_FIELD_NOTES) {
      expect(Object.keys(note).sort()).toEqual(["questionId", "text"]);
      expect([...note.text].length).toBeLessThanOrEqual(36);
      expect(questionFieldNote(note.questionId)).toBe(note.text);
    }
    expect(questionFieldNote("Q99")).toBeUndefined();
  });
});
