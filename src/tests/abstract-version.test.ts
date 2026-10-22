import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { Answer } from "@/lib/domain";
import type { PersonalManual } from "@/lib/personal-manual/schema";
import { generatePersonalManual, getPersonalManual } from "@/lib/personal-manual/generate";
import { createProgress, decodeProgress, STORAGE_KEY } from "@/lib/quiz/progress";
import { createQuizStore, STORAGE_NOTICES } from "@/lib/quiz/store";

interface SavedFixture {
  fixture: { id: string };
  answers: Answer[];
  manual: PersonalManual;
}

// These are the reviewed, committed-to-disk phase-three outputs, not freshly
// regenerated expectations. Changes to legacy prose must fail this regression.
const fixtureNames = [
  ...Array.from({ length: 16 }, (_, index) => `HUM-${101 + index}`),
  ...[0, 40, 50, 60, 100].map((value) => `boundary-${value}`),
  "trajectory-even",
  "trajectory-varied",
];
const fixtures: SavedFixture[] = fixtureNames.map((name) =>
  JSON.parse(readFileSync(new URL(`../../docs/qa/phase-3/samples/${name}.json`, import.meta.url), "utf8")) as SavedFixture,
);

const fullAnswers = fixtures[0].answers;
function previousRecord(completed: boolean, schemaVersion = 2) {
  return {
    schemaVersion,
    contentVersion: "hum-1",
    ...(schemaVersion === 2 ? { manualVersion: "pm-1" } : {}),
    answers: completed ? fullAnswers : fullAnswers.slice(0, 7),
    currentIndex: completed ? 12 : 5,
    completed,
  };
}

describe("abstract copy versions preserve existing results", () => {
  it("keeps all 23 previously reviewed outputs as immutable regression fixtures", () => {
    expect(fixtures).toHaveLength(23);
    expect(new Set(fixtures.map(({ fixture }) => fixture.id)).size).toBe(23);
    expect(fixtures.every(({ manual }) => manual.version === "pm-1")).toBe(true);
  });

  it.each(fixtures)("fully reproduces the previous pm-1 report for $fixture.id", ({ answers, manual }) => {
    expect(generatePersonalManual(answers, "pm-1")).toStrictEqual(manual);
    expect(generatePersonalManual([...answers].reverse(), "pm-1")).toStrictEqual(manual);
  });

  it.each(fixtures)("upgrades copy without changing scores, identity or serial for $fixture.id", ({ answers, manual: previous }) => {
    const current = generatePersonalManual(answers);
    expect(current.version).toBe("pm-2");
    expect(current).toStrictEqual(generatePersonalManual(answers, "pm-2"));
    expect(current).toStrictEqual(generatePersonalManual([...answers].reverse(), "pm-2"));
    expect(current.result).toStrictEqual(previous.result);
    expect(current.scoringVersion).toBe(previous.scoringVersion);
    expect(current.serial).toBe(previous.serial);
    for (const field of ["id", "key", "name", "color", "ink", "shape"] as const) {
      expect(current.device[field]).toBe(previous.device[field]);
    }
    expect(current.chapters.map(({ id }) => id)).toEqual(previous.chapters.map(({ id }) => id));
    expect(current.chapters.flatMap(({ entries }) => entries.map(({ text }) => text))).not.toEqual(
      previous.chapters.flatMap(({ entries }) => entries.map(({ text }) => text)),
    );
    expect(generatePersonalManual(answers, "pm-1")).toStrictEqual(previous);
  });

  it("rejects unknown report versions rather than silently treating them as pm-2", () => {
    expect(() => generatePersonalManual(fullAnswers, "pm-3")).toThrow("不支持");
    expect(() => generatePersonalManual(fullAnswers, "")).toThrow("不支持");
  });
});

describe("explicit pm-1 to pm-2 progress migration", () => {
  it.each([false, true])("preserves schema-two answers, position and completion (completed=%s)", (completed) => {
    const previous = previousRecord(completed);
    const raw = JSON.stringify(previous);
    const decoded = decodeProgress(raw);
    expect(decoded.kind).toBe("migrated");
    expect(decoded.progress).toStrictEqual({ ...previous, manualVersion: "pm-2" });
    expect(decoded.progress.answers).not.toBe(previous.answers);
    expect(JSON.stringify(previous)).toBe(raw);
    expect(decodeProgress(JSON.stringify(decoded.progress))).toEqual({ kind: "valid", progress: decoded.progress });
    const report = getPersonalManual(decoded.progress);
    if (completed) {
      expect(report).toStrictEqual(generatePersonalManual(fullAnswers, "pm-2"));
      expect(report?.serial).toBe(fixtures[0].manual.serial);
    } else {
      expect(report).toBeNull();
    }
  });

  it.each([false, true])("still migrates the original schema-one format (completed=%s)", (completed) => {
    const previous = previousRecord(completed, 1);
    const decoded = decodeProgress(JSON.stringify(previous));
    expect(decoded.kind).toBe("migrated");
    expect(decoded.progress).toStrictEqual({ ...previous, schemaVersion: 2, manualVersion: "pm-2" });
  });

  it("does not turn a full but unsubmitted old draft into a formal result", () => {
    const previous = { ...previousRecord(true), completed: false };
    const decoded = decodeProgress(JSON.stringify(previous));
    expect(decoded.kind).toBe("migrated");
    expect(decoded.progress.answers).toEqual(fullAnswers);
    expect(decoded.progress.completed).toBe(false);
    expect(getPersonalManual(decoded.progress)).toBeNull();
  });

  it.each([
    { name: "unknown score contract", changes: { contentVersion: "hum-2" }, kind: "incompatible" },
    { name: "unknown schema", changes: { schemaVersion: 3 }, kind: "incompatible" },
    { name: "unknown prose version", changes: { manualVersion: "pm-future" }, kind: "incompatible" },
    { name: "extra result field", changes: { result: { typeKey: "1111" } }, kind: "invalid" },
    { name: "extra score field", changes: { scores: { energy: 100 } }, kind: "invalid" },
    { name: "invalid question", changes: { answers: [{ questionId: "Q99", optionId: "a" }] }, kind: "invalid" },
    { name: "invalid option", changes: { answers: [{ questionId: "Q01", optionId: "z" }] }, kind: "invalid" },
    { name: "duplicate answer", changes: { answers: [fullAnswers[0], fullAnswers[0]] }, kind: "invalid" },
    { name: "answer with extra value", changes: { answers: [{ ...fullAnswers[0], value: 4 }] }, kind: "invalid" },
    { name: "out-of-bounds position", changes: { currentIndex: 20 }, kind: "invalid" },
    { name: "false completion claim", changes: { completed: true }, kind: "invalid" },
  ])("does not launder $name through prose migration", ({ changes, kind }) => {
    const raw = JSON.stringify({ ...previousRecord(false), ...changes });
    const decoded = decodeProgress(raw);
    expect(decoded.kind).toBe(kind);
    expect(decoded.progress).toStrictEqual(createProgress());
    expect(getPersonalManual(decoded.progress)).toBeNull();
    const storage = { getItem: vi.fn(() => raw), setItem: vi.fn() };
    const store = createQuizStore(() => storage);
    const unsubscribe = store.subscribe(() => {});
    expect(store.getSnapshot().notice).toBe(kind === "invalid" ? STORAGE_NOTICES.invalid : STORAGE_NOTICES.incompatible);
    expect(storage.setItem).not.toHaveBeenCalled();
    unsubscribe();
  });

  it.each([false, true])("keeps migrated answers usable when writing the upgrade fails (completed=%s)", (completed) => {
    const previous = previousRecord(completed);
    let raw = JSON.stringify(previous);
    let writable = false;
    const storage = {
      getItem: vi.fn((key: string) => {
        expect(key).toBe(STORAGE_KEY);
        return raw;
      }),
      setItem: vi.fn((key: string, value: string) => {
        expect(key).toBe(STORAGE_KEY);
        if (!writable) throw new Error("QuotaExceededError");
        raw = value;
      }),
    };
    const store = createQuizStore(() => storage);
    const unsubscribe = store.subscribe(() => {});
    const migrated = store.getSnapshot();
    expect(migrated.persistence).toBe("memory");
    expect(migrated.restored).toBe(true);
    expect(migrated.progress).toStrictEqual({ ...previous, manualVersion: "pm-2" });
    expect(migrated.notice).toContain(STORAGE_NOTICES.migrated);
    expect(migrated.notice).toContain(STORAGE_NOTICES.writeFailed);
    expect(JSON.parse(raw)).toStrictEqual(previous);
    expect(getPersonalManual(migrated.progress)).toEqual(completed ? generatePersonalManual(fullAnswers) : null);

    // A denied write cannot erase the old saved copy; another session can
    // validate and migrate it again rather than losing the user's answers.
    const reloadedWhileBlocked = createQuizStore(() => storage);
    const stopReload = reloadedWhileBlocked.subscribe(() => {});
    expect(reloadedWhileBlocked.getSnapshot().progress).toStrictEqual(migrated.progress);
    expect(reloadedWhileBlocked.getSnapshot().persistence).toBe("memory");

    // The retry must save the newest in-memory state, not reload the old copy.
    const alternative = fullAnswers[0].optionId === "a" ? "b" : "a";
    store.actions.chooseAnswer(fullAnswers[0].questionId, alternative);
    store.actions.goToQuestion(0);
    expect(store.getSnapshot().progress.completed).toBe(false);
    expect(store.getSnapshot().progress.answers[0].optionId).toBe(alternative);
    writable = true;
    store.actions.retryPersistence();
    expect(store.getSnapshot().persistence).toBe("saved");
    expect(store.getSnapshot().notice).toBeNull();
    expect(JSON.parse(raw)).toStrictEqual(store.getSnapshot().progress);
    expect(decodeProgress(raw).kind).toBe("valid");
    const refreshed = createQuizStore(() => storage);
    const stopRefresh = refreshed.subscribe(() => {});
    expect(refreshed.getSnapshot().progress).toStrictEqual(store.getSnapshot().progress);
    expect(refreshed.getSnapshot().notice).toBeNull();
    unsubscribe();
    stopReload();
    stopRefresh();
  });
});
