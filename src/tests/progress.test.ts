import { describe, expect, it } from "vitest";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { scoreAnswers } from "@/lib/scoring";
import {
  MAX_PROGRESS_LENGTH,
  completeProgress,
  createProgress,
  decodeProgress,
  validateProgress,
  withAnswer,
  withQuestionIndex,
} from "@/lib/quiz/progress";

function filled() {
  let progress = createProgress();
  for (const question of SELF_QUESTIONS)
    progress = withAnswer(progress, question.id, "c");
  return progress;
}

describe("versioned quiz progress", () => {
  it("starts with an empty non-result record", () => {
    expect(createProgress()).toEqual({
      schemaVersion: 2,
      contentVersion: "hum-1",
      manualVersion: "pm-2",
      answers: [],
      currentIndex: 0,
      completed: false,
    });
    expect(decodeProgress(null).kind).toBe("empty");
    expect(() => completeProgress(createProgress())).toThrow();
  });

  it("round-trips partial answers and the exact current question", () => {
    const first = withAnswer(createProgress(), "Q01", "b");
    const progress = withQuestionIndex(first, 1);
    expect(decodeProgress(JSON.stringify(progress))).toEqual({
      kind: "valid",
      progress,
    });
    expect(progress.answers).toEqual([{ questionId: "Q01", optionId: "b" }]);
    expect(first.currentIndex).toBe(0);
  });

  it.each([false, true])("explicitly migrates valid schema-one records without changing answers (completed=%s)", (completed) => {
    const progress = completed ? completeProgress(filled()).progress : withQuestionIndex(withAnswer(createProgress(), "Q01", "b"), 1);
    const legacy = {
      schemaVersion: 1, contentVersion: "hum-1", answers: progress.answers,
      currentIndex: progress.currentIndex, completed,
    };
    const migrated = decodeProgress(JSON.stringify(legacy));
    expect(migrated.kind).toBe("migrated");
    expect(migrated.progress).toEqual(progress);
    expect(migrated.progress.manualVersion).toBe("pm-2");
    expect(migrated.progress.schemaVersion).toBe(2);
    expect(decodeProgress(JSON.stringify(migrated.progress))).toEqual({ kind: "valid", progress });
  });

  it.each([
    { completed: true },
    { answers: [{ questionId: "Q01", optionId: "z" }] },
    { scores: { energy: 100 } },
    { manualVersion: "pm-2" },
    { currentIndex: -1 },
  ])("does not launder invalid legacy records through migration: %j", (override) => {
    const legacy = { schemaVersion: 1, contentVersion: "hum-1", answers: [], currentIndex: 0, completed: false, ...override };
    expect(decodeProgress(JSON.stringify(legacy)).kind).toBe("invalid");
  });

  it("rejects legacy records from a different scoring version", () => {
    const legacy = { schemaVersion: 1, contentVersion: "hum-old", answers: [], currentIndex: 0, completed: false };
    expect(decodeProgress(JSON.stringify(legacy)).kind).toBe("incompatible");
  });

  it("retains selection while moving backwards and replaces one answer without duplication", () => {
    let progress = withAnswer(createProgress(), "Q01", "c");
    progress = withQuestionIndex(progress, 1);
    progress = withAnswer(progress, "Q02", "a");
    progress = withQuestionIndex(progress, 0);
    expect(progress.answers[0].optionId).toBe("c");
    progress = withAnswer(progress, "Q01", "b");
    expect(progress.answers).toEqual([
      { questionId: "Q01", optionId: "b" },
      { questionId: "Q02", optionId: "a" },
    ]);
  });

  it("uses the unchanged phase-one engine when all twenty answers are explicitly completed", () => {
    const progress = filled();
    expect(progress.completed).toBe(false);
    const completion = completeProgress(progress);
    expect(completion.progress.completed).toBe(true);
    expect(completion.progress.currentIndex).toBe(19);
    expect(completion.result).toEqual(scoreAnswers(progress.answers));
    expect(decodeProgress(JSON.stringify(completion.progress))).toEqual({
      kind: "valid",
      progress: completion.progress,
    });
  });

  it("invalidates a completed result after editing and recomputes the known fixture", () => {
    const completion = completeProgress(filled());
    const revisiting = withQuestionIndex(completion.progress, 0);
    expect(revisiting.completed).toBe(true);
    const edited = withAnswer(revisiting, "Q01", "b");
    expect(edited.completed).toBe(false);
    expect(edited.answers).toHaveLength(20);
    const updated = completeProgress(edited);
    expect(updated.result.scores).toEqual({
      energy: 55,
      expression: 60,
      navigation: 45,
      connection: 40,
    });
    expect(updated.result.typeKey).toBe("1100");
    expect(updated.result.fingerprint).toBe("hum-1-6621f9fe");
  });

  it("does not invalidate an existing result when the same option is selected again", () => {
    const completed = completeProgress(filled()).progress;
    expect(withAnswer(completed, "Q01", "c").completed).toBe(true);
  });

  it("canonicalizes answer ordering without mutating the supplied data", () => {
    const progress = filled();
    const reversed = { ...progress, answers: [...progress.answers].reverse() };
    expect(validateProgress(reversed)).toEqual(progress);
    expect(reversed.answers[0].questionId).toBe("Q20");
  });

  it("owns the returned answer objects rather than retaining storage object references", () => {
    const progress = withAnswer(createProgress(), "Q01", "c");
    const validated = validateProgress(progress);
    validated.answers[0].optionId = "a";
    expect(progress.answers[0].optionId).toBe("c");
  });

  it.each([
    "",
    "{",
    "null",
    "[]",
    '"text"',
    "1",
    "true",
    "x".repeat(MAX_PROGRESS_LENGTH + 1),
  ])(
    "recovers malformed serialized input without a formal result (%s)",
    (raw) => {
      const decoded = decodeProgress(raw);
      expect(decoded.kind).toBe("invalid");
      expect(decoded.progress).toEqual(createProgress());
    },
  );

  it.each([
    { schemaVersion: 0 },
    { schemaVersion: 3 },
    { schemaVersion: "2" },
    { manualVersion: "pm-unknown" },
    { contentVersion: "hum-2" },
    { contentVersion: null },
  ])(
    "rejects unsupported format/content versions without silently migrating %j",
    (override) => {
      const decoded = decodeProgress(
        JSON.stringify({ ...createProgress(), ...override }),
      );
      expect(decoded.kind).toBe("incompatible");
      expect(decoded.progress.answers).toEqual([]);
    },
  );

  it.each([
    { currentIndex: -1 },
    { currentIndex: 20 },
    { currentIndex: 0.5 },
    { currentIndex: "1" },
    { currentIndex: null },
    { completed: "true" },
    { completed: true },
    { completed: 1 },
    { answers: null },
    { answers: {} },
    { answers: [{ questionId: "Q01", optionId: "z" }] },
    { answers: [{ questionId: "Q99", optionId: "a" }] },
    { answers: [{ questionId: "Q01", optionId: "a", value: 0 }] },
    { answers: [{ questionId: "Q01" }] },
    { answers: [null] },
    {
      answers: [
        { questionId: "Q01", optionId: "a" },
        { questionId: "Q01", optionId: "b" },
      ],
    },
    { scores: { energy: 100 } },
    { result: { typeKey: "1111" } },
  ])(
    "rejects corrupted progress instead of synthesizing a result %j",
    (override) => {
      const decoded = decodeProgress(
        JSON.stringify({ ...createProgress(), ...override }),
      );
      expect(decoded.kind).toBe("invalid");
      expect(decoded.progress.completed).toBe(false);
      expect(decoded.progress.answers).toEqual([]);
    },
  );

  it("rejects excess answers and runtime-only nonfinite/sparse inputs", () => {
    const progress = filled();
    expect(() =>
      validateProgress({
        ...progress,
        answers: [...progress.answers, progress.answers[0]],
      }),
    ).toThrow();
    expect(() =>
      validateProgress({ ...progress, currentIndex: Number.NaN }),
    ).toThrow();
    expect(() =>
      validateProgress({ ...progress, currentIndex: Infinity }),
    ).toThrow();
    expect(() =>
      validateProgress({ ...progress, answers: Array(2) }),
    ).toThrow();
    expect(() => validateProgress(new Date())).toThrow();
  });

  it.each([-1, 20, 1.5, Infinity, Number.NaN])(
    "blocks an invalid question index: %s",
    (index) => {
      expect(() => withQuestionIndex(createProgress(), index)).toThrow();
    },
  );

  it("does not allow a missing answer to be treated as a completed neutral response", () => {
    const progress = filled();
    progress.answers.pop();
    expect(() => completeProgress(progress)).toThrow();
    expect(
      decodeProgress(JSON.stringify({ ...progress, completed: true })).kind,
    ).toBe("invalid");
  });

  it("rejects invalid explicit answer actions", () => {
    expect(() => withAnswer(createProgress(), "Q01", "z")).toThrow();
    expect(() => withAnswer(createProgress(), "Q00", "a")).toThrow();
  });
});
