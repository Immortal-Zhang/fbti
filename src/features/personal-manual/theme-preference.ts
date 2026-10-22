"use client";

import { useSyncExternalStore } from "react";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import type { TypeKey } from "@/lib/domain";

export const THEME_STORAGE_KEY = "hum:manual-theme";
export interface ThemePreference {
  key: TypeKey | null;
  persistent: boolean;
}
const initial: ThemePreference = { key: null, persistent: true };

export function decodeThemePreference(raw: string | null): TypeKey | null {
  if (!raw || raw.length > 128) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return null;
    const record = value as Record<string, unknown>;
    if (Object.keys(record).length !== 2 || record.version !== 1) return null;
    return PERSONALITY_TYPES.some((device) => device.key === record.key)
      ? (record.key as TypeKey)
      : null;
  } catch {
    return null;
  }
}

/** Appearance has a separate store; changing it never writes quiz answers. */
function createThemePreference() {
  let snapshot = initial;
  let ready = false;
  const listeners = new Set<() => void>();
  function publish(value: ThemePreference) {
    snapshot = value;
    listeners.forEach((listener) => listener());
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!ready) {
        ready = true;
        try {
          publish({
            key: decodeThemePreference(
              window.localStorage.getItem(THEME_STORAGE_KEY),
            ),
            persistent: true,
          });
        } catch {
          publish({ key: null, persistent: false });
        }
      }
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    choose(key: TypeKey | null) {
      if (
        key !== null &&
        !PERSONALITY_TYPES.some((device) => device.key === key)
      )
        return;
      let persistent = true;
      try {
        window.localStorage.setItem(
          THEME_STORAGE_KEY,
          JSON.stringify({ version: 1, key }),
        );
      } catch {
        persistent = false;
      }
      publish({ key, persistent });
    },
  };
}

const preference = createThemePreference();

export function useManualTheme() {
  const snapshot = useSyncExternalStore(
    preference.subscribe,
    preference.getSnapshot,
    preference.getServerSnapshot,
  );
  return { ...snapshot, choose: preference.choose };
}
