import { describe, expect, it } from "vitest";
import { createQuizStore } from "@/lib/quiz/store";
import { createProgress, withAnswer, STORAGE_KEY } from "@/lib/quiz/progress";
describe("cross-tab self-test coherence", () => {
  it("receives new answers and a confirmed restart without writing stale data back", () => {
    let writes = 0;
    const store = createQuizStore(() => ({
      getItem: () => null,
      setItem: () => {
        writes++;
      },
    }));
    store.subscribe(() => {});
    const updated = withAnswer(createProgress(), "Q01", "b");
    store.receiveExternal(JSON.stringify(updated));
    expect(store.getSnapshot().progress).toEqual(updated);
    store.receiveExternal(JSON.stringify(createProgress()));
    expect(store.getSnapshot().progress.answers).toHaveLength(0);
    expect(writes).toBe(0);
  });
  it("never replaces unsaved answers with an external saved record", () => {
    const store = createQuizStore(() => ({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    }));
    store.subscribe(() => {});
    store.actions.chooseAnswer("Q01", "b");
    store.receiveExternal(JSON.stringify(createProgress()));
    expect(store.getSnapshot().progress.answers).toEqual([
      { questionId: "Q01", optionId: "b" },
    ]);
    expect(store.getSnapshot().notice).toContain("未保存的回答仍然保留");
  });
  it("preserves valid local answers when a different tab writes malformed data", () => {
    const initial = withAnswer(createProgress(), "Q01", "b");
    const store = createQuizStore(() => ({
      getItem: (key) => (key === STORAGE_KEY ? JSON.stringify(initial) : null),
      setItem: () => {},
    }));
    store.subscribe(() => {});
    store.receiveExternal("{bad");
    expect(store.getSnapshot().progress).toEqual(initial);
    expect(store.getSnapshot().persistence).toBe("memory");
  });
});
