import { describe, expect, it, vi } from "vitest";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { STORAGE_KEY, createProgress } from "@/lib/quiz/progress";
import {
  createQuizStore,
  STORAGE_NOTICES,
  type ProgressStorage,
} from "@/lib/quiz/store";

function fakeStorage(initial: string | null = null) {
  let raw = initial;
  return {
    getItem: vi.fn((key: string) => {
      expect(key).toBe(STORAGE_KEY);
      return raw;
    }),
    setItem: vi.fn((key: string, value: string) => {
      expect(key).toBe(STORAGE_KEY);
      raw = value;
    }),
    read: () => raw,
  };
}

function answerAll(store: ReturnType<typeof createQuizStore>) {
  for (const question of SELF_QUESTIONS)
    store.actions.chooseAnswer(question.id, "c");
}

describe("browser quiz store", () => {
  it("upgrades a completed old record once, persists the report version and preserves its answers", () => {
    const answers = SELF_QUESTIONS.map((question) => ({ questionId: question.id, optionId: "c" }));
    const storage = fakeStorage(JSON.stringify({ schemaVersion: 1, contentVersion: "hum-1", answers, currentIndex: 19, completed: true }));
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    expect(store.getSnapshot().notice).toBe(STORAGE_NOTICES.migrated);
    expect(store.getSnapshot().restored).toBe(true);
    expect(store.getSnapshot().progress.answers).toEqual(answers);
    expect(store.getSnapshot().progress.completed).toBe(true);
    expect(JSON.parse(storage.read()!)).toEqual(store.getSnapshot().progress);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    const refreshed = createQuizStore(() => storage);
    refreshed.subscribe(() => {});
    expect(refreshed.getSnapshot().progress).toEqual(store.getSnapshot().progress);
    expect(refreshed.getSnapshot().notice).toBe(null);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it("retains partially answered legacy progress at its original question", () => {
    const storage = fakeStorage(JSON.stringify({ schemaVersion: 1, contentVersion: "hum-1", answers: [{questionId:"Q01",optionId:"b"}], currentIndex: 1, completed: false }));
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    expect(store.getSnapshot().progress.currentIndex).toBe(1);
    expect(store.getSnapshot().progress.answers).toEqual([{ questionId: "Q01", optionId: "b" }]);
    expect(store.getSnapshot().progress.completed).toBe(false);
  });

  it("does not lose migrated answers when the upgrade write is blocked", () => {
    const storage = fakeStorage(JSON.stringify({ schemaVersion: 1, contentVersion: "hum-1", answers: [{questionId:"Q01",optionId:"b"}], currentIndex: 1, completed: false }));
    const originalWrite = storage.setItem.getMockImplementation()!;
    storage.setItem.mockImplementation(() => { throw new Error("QuotaExceededError"); });
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    expect(store.getSnapshot().progress.answers).toHaveLength(1);
    expect(store.getSnapshot().persistence).toBe("memory");
    expect(store.getSnapshot().notice).toContain(STORAGE_NOTICES.migrated);
    expect(store.getSnapshot().notice).toContain(STORAGE_NOTICES.writeFailed);
    expect(JSON.parse(storage.read()!).schemaVersion).toBe(1);
    storage.setItem.mockImplementation(originalWrite);
    store.actions.retryPersistence();
    expect(store.getSnapshot().persistence).toBe("saved");
    expect(JSON.parse(storage.read()!).manualVersion).toBe("pm-2");
  });

  it("migrates an empty prior record without implying that answers existed", () => {
    const storage = fakeStorage(JSON.stringify({ schemaVersion: 1, contentVersion: "hum-1", answers: [], currentIndex: 0, completed: false }));
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    expect(store.getSnapshot().notice).toBe(null);
    expect(store.getSnapshot().restored).toBe(false);
    expect(store.getSnapshot().progress).toEqual(createProgress());
  });

  it("does not touch browser storage during construction or server rendering", () => {
    const resolve = vi.fn(() => {
      throw new Error("browser not available");
    });
    const store = createQuizStore(resolve);
    expect(store.getSnapshot().ready).toBe(false);
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
    expect(resolve).not.toHaveBeenCalled();
    store.subscribe(() => {});
    expect(store.getSnapshot().ready).toBe(true);
    expect(store.getSnapshot().persistence).toBe("memory");
    expect(store.getServerSnapshot().ready).toBe(false);
  });

  it("reads once at subscription and retains the same ready snapshot between actions", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    const unsubscribe = store.subscribe(() => {});
    const snapshot = store.getSnapshot();
    unsubscribe();
    store.subscribe(() => {});
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(snapshot);
  });

  it("persists the latest selection and current index before the action returns", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    store.actions.chooseAnswer("Q01", "c");
    expect(JSON.parse(storage.read()!).answers).toEqual([
      { questionId: "Q01", optionId: "c" },
    ]);
    store.actions.goToQuestion(1);
    expect(JSON.parse(storage.read()!).currentIndex).toBe(1);
    const refreshed = createQuizStore(() => storage);
    refreshed.subscribe(() => {});
    expect(refreshed.getSnapshot().progress).toEqual(
      store.getSnapshot().progress,
    );
    expect(refreshed.getSnapshot().restored).toBe(true);
  });

  it("retains answers through previous navigation and restores edits after reload", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    store.actions.chooseAnswer("Q01", "c");
    store.actions.goToQuestion(1);
    store.actions.chooseAnswer("Q02", "a");
    store.actions.goToQuestion(0);
    expect(store.getSnapshot().progress.answers[0].optionId).toBe("c");
    store.actions.chooseAnswer("Q01", "b");
    const refreshed = createQuizStore(() => storage);
    refreshed.subscribe(() => {});
    expect(refreshed.getSnapshot().progress.answers).toEqual([
      { questionId: "Q01", optionId: "b" },
      { questionId: "Q02", optionId: "a" },
    ]);
    expect(refreshed.getSnapshot().progress.currentIndex).toBe(0);
  });

  it("does not write or mutate state when incomplete finish fails", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    store.actions.chooseAnswer("Q01", "a");
    const before = store.getSnapshot();
    storage.setItem.mockClear();
    expect(() => store.actions.finishQuiz()).toThrow();
    expect(store.getSnapshot()).toBe(before);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("completes with the real score and invalidates the completion on an answer edit", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    answerAll(store);
    const result = store.actions.finishQuiz();
    expect(result.scores).toEqual({
      energy: 75,
      expression: 60,
      navigation: 45,
      connection: 40,
    });
    expect(store.getSnapshot().progress.completed).toBe(true);
    expect(Object.keys(JSON.parse(storage.read()!)).sort()).toEqual([
      "answers",
      "completed",
      "contentVersion",
      "currentIndex",
      "manualVersion",
      "schemaVersion",
    ]);
    const refreshed = createQuizStore(() => storage);
    refreshed.subscribe(() => {});
    expect(refreshed.actions.finishQuiz()).toEqual(result);
    refreshed.actions.goToQuestion(0);
    expect(refreshed.getSnapshot().progress.completed).toBe(true);
    refreshed.actions.chooseAnswer("Q01", "b");
    expect(refreshed.getSnapshot().progress.completed).toBe(false);
    expect(refreshed.actions.finishQuiz().fingerprint).toBe("hum-1-6621f9fe");
  });

  it("restarts persistently and cannot resurrect a completed record on refresh", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    answerAll(store);
    store.actions.finishQuiz();
    store.actions.restartQuiz();
    expect(store.getSnapshot().progress).toEqual(createProgress());
    expect(store.getSnapshot().restored).toBe(false);
    const refreshed = createQuizStore(() => storage);
    refreshed.subscribe(() => {});
    expect(refreshed.getSnapshot().progress).toEqual(createProgress());
    expect(refreshed.getSnapshot().restored).toBe(false);
  });

  it.each([
    ["{bad json", STORAGE_NOTICES.invalid],
    [
      JSON.stringify({ ...createProgress(), schemaVersion: 3 }),
      STORAGE_NOTICES.incompatible,
    ],
    [
      JSON.stringify({ ...createProgress(), completed: true }),
      STORAGE_NOTICES.invalid,
    ],
  ])("recovers unsafe storage with an explicit message: %s", (raw, notice) => {
    const storage = fakeStorage(raw);
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    expect(store.getSnapshot().notice).toBe(notice);
    expect(store.getSnapshot().progress).toEqual(createProgress());
    expect(store.getSnapshot().restored).toBe(false);
    store.actions.chooseAnswer("Q01", "b");
    expect(store.getSnapshot().notice).toBe(null);
    expect(JSON.parse(storage.read()!).answers).toHaveLength(1);
  });

  it("finishes all twenty questions in memory when localStorage access itself throws", () => {
    const store = createQuizStore(() => {
      throw new Error("SecurityError");
    });
    store.subscribe(() => {});
    expect(store.getSnapshot().notice).toBe(STORAGE_NOTICES.readFailed);
    answerAll(store);
    expect(store.getSnapshot().persistence).toBe("memory");
    expect(store.getSnapshot().notice).toBe(STORAGE_NOTICES.writeFailed);
    expect(store.actions.finishQuiz().scores.energy).toBe(75);
    expect(store.getSnapshot().progress.completed).toBe(true);
    store.actions.restartQuiz();
    expect(store.getSnapshot().progress.answers).toHaveLength(0);
    expect(store.getSnapshot().persistence).toBe("memory");
  });

  it("handles getItem errors and supports a later successful explicit save retry", () => {
    const storage = fakeStorage();
    storage.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const store = createQuizStore(() => storage);
    store.subscribe(() => {});
    expect(store.getSnapshot().persistence).toBe("memory");
    store.actions.retryPersistence();
    expect(store.getSnapshot().persistence).toBe("saved");
    expect(store.getSnapshot().notice).toBe(null);
    expect(JSON.parse(storage.read()!)).toEqual(createProgress());
  });

  it("keeps a quota-failed edit in memory and saves that exact answer on retry", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    store.actions.chooseAnswer("Q01", "c");
    const savedWrite = storage.setItem.getMockImplementation()!;
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    store.actions.chooseAnswer("Q01", "b");
    expect(store.getSnapshot().progress.answers[0].optionId).toBe("b");
    expect(JSON.parse(storage.read()!).answers[0].optionId).toBe("c");
    expect(store.getSnapshot().notice).toContain("刷新可能恢复上次保存的记录");
    storage.setItem.mockImplementation(savedWrite);
    store.actions.retryPersistence();
    expect(JSON.parse(storage.read()!).answers[0].optionId).toBe("b");
    expect(store.getSnapshot().persistence).toBe("saved");
  });

  it("does not falsely claim a persisted reset if storage becomes unwritable", () => {
    const storage = fakeStorage();
    const store = createQuizStore(() => storage);
    answerAll(store);
    store.actions.finishQuiz();
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    store.actions.restartQuiz();
    expect(store.getSnapshot().progress).toEqual(createProgress());
    expect(store.getSnapshot().persistence).toBe("memory");
    expect(store.getSnapshot().notice).toContain("刷新可能恢复上次保存的记录");
    expect(JSON.parse(storage.read()!).completed).toBe(true);
  });

  it("keeps stable action references and stops notifying removed listeners", () => {
    const storage: ProgressStorage = fakeStorage();
    const store = createQuizStore(() => storage);
    const actions = store.actions;
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    listener.mockClear();
    store.actions.chooseAnswer("Q01", "a");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.actions).toBe(actions);
    unsubscribe();
    store.actions.goToQuestion(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
