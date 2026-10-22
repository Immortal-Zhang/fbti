import type { ScoredResult } from "@/lib/domain";
import {
  STORAGE_KEY,
  completeProgress,
  createProgress,
  decodeProgress,
  withAnswer,
  withQuestionIndex,
  type QuizProgress,
} from "./progress";

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface QuizSnapshot {
  ready: boolean;
  progress: QuizProgress;
  persistence: "saved" | "memory";
  notice: string | null;
  restored: boolean;
}

export interface QuizActions {
  chooseAnswer(questionId: string, optionId: string): void;
  goToQuestion(index: number): void;
  finishQuiz(): ScoredResult;
  restartQuiz(): void;
  retryPersistence(): void;
}

export interface QuizStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): QuizSnapshot;
  getServerSnapshot(): QuizSnapshot;
  actions: QuizActions;
  receiveExternal(raw: string | null): void;
}

export const STORAGE_NOTICES = {
  invalid: "上次的进度记录损坏，已为你开启空白测试。请重新作答后生成说明书。",
  incompatible: "上次的记录属于其他版本，无法安全恢复。已开启新一轮测试。",
  migrated:
    "厂家换了一位比较离谱的说明书作者。文案已升级为抽象版，原回答、得分、型号和设备编号保持不变。",
  readFailed:
    "浏览器暂时无法读取本机进度。你仍可完成测试，但本次答案只保留在当前页面；刷新可能恢复上次保存的记录。",
  writeFailed:
    "本机保存暂时不可用。当前页面内的答案仍在，请勿刷新或关闭页面；刷新可能恢复上次保存的记录。",
} as const;

/** No browser global is read until subscription or an explicit action. */
export function createQuizStore(
  resolveStorage: () => ProgressStorage,
): QuizStore {
  const initial: QuizSnapshot = {
    ready: false,
    progress: createProgress(),
    persistence: "saved",
    notice: null,
    restored: false,
  };
  let snapshot = initial;
  const listeners = new Set<() => void>();

  function emit(next: QuizSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function initialize() {
    if (snapshot.ready) return;
    try {
      const decoded = decodeProgress(resolveStorage().getItem(STORAGE_KEY));
      let persistence: QuizSnapshot["persistence"] = "saved";
      let notice: string | null =
        decoded.kind === "invalid" || decoded.kind === "incompatible"
          ? STORAGE_NOTICES[decoded.kind]
          : decoded.kind === "migrated" && decoded.progress.answers.length > 0
            ? STORAGE_NOTICES.migrated
            : null;
      if (decoded.kind === "migrated") {
        try {
          resolveStorage().setItem(
            STORAGE_KEY,
            JSON.stringify(decoded.progress),
          );
        } catch {
          persistence = "memory";
          notice = `${notice ? `${notice} ` : ""}${STORAGE_NOTICES.writeFailed}`;
        }
      }
      emit({
        ready: true,
        progress: decoded.progress,
        persistence,
        notice,
        restored:
          (decoded.kind === "valid" || decoded.kind === "migrated") &&
          decoded.progress.answers.length > 0,
      });
    } catch {
      emit({
        ...initial,
        ready: true,
        persistence: "memory",
        notice: STORAGE_NOTICES.readFailed,
      });
    }
  }

  function commit(progress: QuizProgress, restored = snapshot.restored) {
    let persistence: QuizSnapshot["persistence"] = "saved";
    let notice: string | null = null;
    try {
      // Synchronous writes preserve the latest choice even if the next action is refresh.
      resolveStorage().setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      persistence = "memory";
      notice = STORAGE_NOTICES.writeFailed;
    }
    emit({ ready: true, progress, persistence, notice, restored });
  }

  const actions: QuizActions = {
    chooseAnswer(questionId, optionId) {
      initialize();
      commit(withAnswer(snapshot.progress, questionId, optionId));
    },
    goToQuestion(index) {
      initialize();
      commit(withQuestionIndex(snapshot.progress, index));
    },
    finishQuiz() {
      initialize();
      const completed = completeProgress(snapshot.progress);
      commit(completed.progress);
      return completed.result;
    },
    restartQuiz() {
      initialize();
      // Persist an explicit blank record instead of leaving a stale completed result behind.
      commit(createProgress(), false);
    },
    retryPersistence() {
      initialize();
      commit(snapshot.progress);
    },
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      initialize();
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    actions,
    receiveExternal(raw) {
      initialize();
      if (snapshot.persistence === "memory") {
        emit({
          ...snapshot,
          notice:
            "另一页面更新了本机记录。当前页面未保存的回答仍然保留，请在这一页完成并保存后再关闭。",
        });
        return;
      }
      const decoded = decodeProgress(raw);
      if (decoded.kind === "invalid" || decoded.kind === "incompatible") {
        emit({
          ...snapshot,
          persistence: "memory",
          notice:
            "另一页面的记录无法识别，当前有效回答仍然保留。请重试保存后再刷新。",
        });
        return;
      }
      if (
        JSON.stringify(decoded.progress) === JSON.stringify(snapshot.progress)
      )
        return;
      // Receive, do not write back: this avoids cross-tab event loops and stale-result resurrection.
      emit({
        ready: true,
        progress: decoded.progress,
        persistence: "saved",
        notice: "另一页面已更新这轮测试，当前页面已同步。",
        restored: decoded.progress.answers.length > 0,
      });
    },
  };
}
