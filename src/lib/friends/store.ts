import type { Answer } from "@/lib/domain";
import type { ProgressStorage } from "@/lib/quiz/store";
import {
  createFriendProgress,
  decodeFriendProgress,
  friendStorageKey,
  validateFriendProgress,
  type FriendProgress,
} from "./progress";
import { scoreFriendAnswers } from "./score";

export function createFriendStore(
  invitation: string,
  storage: () => ProgressStorage,
) {
  const initial = {
    ready: false,
    progress: createFriendProgress(invitation),
    notice: null as string | null,
    persistent: true,
  };
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const key = friendStorageKey(invitation);
  function emit(next: typeof initial) {
    snapshot = next;
    for (const listener of listeners) listener();
  }
  function initialize() {
    if (snapshot.ready) return;
    try {
      const decoded = decodeFriendProgress(storage().getItem(key), invitation);
      emit({
        ready: true,
        progress: decoded.progress,
        persistent: true,
        notice: decoded.invalid
          ? "这份朋友观察记录无法恢复，已为当前邀请开启空白观察。你的个人测试不受影响。"
          : null,
      });
    } catch {
      emit({
        ...initial,
        ready: true,
        persistent: false,
        notice: "本机存储无法读取，当前观察仅在此页面保留，请完成后再离开。",
      });
    }
  }
  function commit(progress: FriendProgress) {
    const valid = validateFriendProgress(progress, invitation);
    try {
      storage().setItem(key, JSON.stringify(valid));
      emit({ ready: true, progress: valid, persistent: true, notice: null });
    } catch {
      emit({
        ready: true,
        progress: valid,
        persistent: false,
        notice:
          "暂时无法保存观察进度。当前页面仍可完成，请勿刷新；可以重试保存。",
      });
    }
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      initialize();
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    choose(answer: Answer) {
      initialize();
      const previous = snapshot.progress.answers.find(
        (a) => a.questionId === answer.questionId,
      );
      const answers = [
        ...snapshot.progress.answers.filter(
          (a) => a.questionId !== answer.questionId,
        ),
        answer,
      ];
      commit({
        ...snapshot.progress,
        answers,
        completed:
          previous?.optionId === answer.optionId
            ? snapshot.progress.completed
            : false,
      });
    },
    move(currentIndex: number) {
      initialize();
      commit({ ...snapshot.progress, currentIndex });
    },
    complete() {
      initialize();
      const result = scoreFriendAnswers(snapshot.progress.answers);
      commit({ ...snapshot.progress, completed: true });
      return result;
    },
    restart() {
      initialize();
      commit(createFriendProgress(invitation));
    },
    retry() {
      initialize();
      commit(snapshot.progress);
    },
  };
}
