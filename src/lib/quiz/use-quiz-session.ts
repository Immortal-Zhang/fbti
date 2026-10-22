"use client";

import { useSyncExternalStore } from "react";
import { createQuizStore, type QuizActions, type QuizSnapshot } from "./store";
import { STORAGE_KEY } from "./progress";

// A single in-memory session survives Next.js route transitions when storage is unavailable.
// This resolver is never called by server rendering or a render-phase getSnapshot.
const store = createQuizStore(() => window.localStorage);
let subscribers = 0;
function externalChange(event: StorageEvent) {
  try {
    if (event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  if (event.key === STORAGE_KEY || event.key === null)
    store.receiveExternal(event.newValue);
}
function subscribe(listener: () => void) {
  const stop = store.subscribe(listener);
  if (subscribers++ === 0) window.addEventListener("storage", externalChange);
  return () => {
    stop();
    if (--subscribers === 0)
      window.removeEventListener("storage", externalChange);
  };
}

export type QuizSession = QuizSnapshot & QuizActions;

export function useQuizSession(): QuizSession {
  const snapshot = useSyncExternalStore(
    subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { ...snapshot, ...store.actions };
}
