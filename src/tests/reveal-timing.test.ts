import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  startRevealTiming,
  type MotionPreference,
} from "@/features/result/reveal-timing";

function preference(initial: boolean) {
  const listeners = new Set<() => void>();
  const motion: MotionPreference & { matches: boolean } = {
    matches: initial,
    addEventListener: vi.fn((_type, listener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type, listener) => {
      listeners.delete(listener);
    }),
  };
  return {
    motion,
    listeners,
    change(value: boolean) {
      motion.matches = value;
      [...listeners].forEach((listener) => listener());
    },
  };
}

describe("reveal timing lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances three stages at 600/1200/1800ms and finishes at 2600ms", () => {
    const { motion, listeners } = preference(false);
    const onStep = vi.fn();
    const onFinish = vi.fn();
    startRevealTiming({ motion, onStep, onFinish });
    expect(listeners.size).toBe(1);
    vi.advanceTimersByTime(599);
    expect(onStep).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onStep.mock.calls).toEqual([[1]]);
    vi.advanceTimersByTime(600);
    expect(onStep.mock.calls).toEqual([[1], [2]]);
    vi.advanceTimersByTime(600);
    expect(onStep.mock.calls).toEqual([[1], [2], [3]]);
    vi.advanceTimersByTime(799);
    expect(onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses only a zero-delay completion when reduced motion is enabled initially", () => {
    const { motion, listeners } = preference(true);
    const onStep = vi.fn();
    const onFinish = vi.fn();
    startRevealTiming({ motion, onStep, onFinish });
    expect(onFinish).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(0);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onStep).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("finishes immediately and cancels future steps if reduced motion turns on", () => {
    const pref = preference(false);
    const onStep = vi.fn();
    const onFinish = vi.fn();
    startRevealTiming({ motion: pref.motion, onStep, onFinish });
    vi.advanceTimersByTime(600);
    pref.change(true);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onStep.mock.calls).toEqual([[1]]);
    expect(pref.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    pref.change(true);
    vi.advanceTimersByTime(5000);
    expect(onStep.mock.calls).toEqual([[1]]);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    "cleanup prevents any later work and releases the listener (reduced=%s)",
    (reduced) => {
      const pref = preference(reduced);
      const onStep = vi.fn();
      const onFinish = vi.fn();
      const cleanup = startRevealTiming({
        motion: pref.motion,
        onStep,
        onFinish,
      });
      const registered = vi.mocked(pref.motion.addEventListener).mock
        .calls[0][1];
      cleanup();
      cleanup();
      expect(pref.motion.removeEventListener).toHaveBeenCalledExactlyOnceWith(
        "change",
        registered,
      );
      expect(pref.listeners.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      pref.change(true);
      vi.runAllTimers();
      expect(onStep).not.toHaveBeenCalled();
      expect(onFinish).not.toHaveBeenCalled();
    },
  );

  it("leaves normal timing unchanged on a non-reduced preference event", () => {
    const pref = preference(false);
    const onStep = vi.fn();
    const onFinish = vi.fn();
    startRevealTiming({ motion: pref.motion, onStep, onFinish });
    vi.advanceTimersByTime(300);
    pref.change(false);
    expect(onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2300);
    expect(onStep.mock.calls).toEqual([[1], [2], [3]]);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("supports an injected browser clock and cancels its own handles", () => {
    const pref = preference(false);
    const clock = {
      setTimeout: vi.fn(setTimeout),
      clearTimeout: vi.fn(clearTimeout),
    };
    const cleanup = startRevealTiming({
      motion: pref.motion,
      onStep: vi.fn(),
      onFinish: vi.fn(),
      clock,
    });
    expect(clock.setTimeout.mock.calls.map(([, delay]) => delay)).toEqual([
      600, 1200, 1800, 2600,
    ]);
    cleanup();
    expect(clock.clearTimeout).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
  });
});
