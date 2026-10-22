export interface MotionPreference {
  readonly matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

interface RevealClock {
  setTimeout(
    callback: () => void,
    delay: number,
  ): ReturnType<typeof setTimeout>;
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
}

interface RevealTimingOptions {
  motion: MotionPreference;
  onStep: (step: number) => void;
  onFinish: () => void;
  clock?: RevealClock;
}

/** Inject browser preferences/timers without importing window or React. */
export function startRevealTiming({
  motion,
  onStep,
  onFinish,
  clock = {
    setTimeout: (callback, delay) => setTimeout(callback, delay),
    clearTimeout: (handle) => clearTimeout(handle),
  },
}: RevealTimingOptions): () => void {
  let active = true;
  const pending: ReturnType<typeof setTimeout>[] = [];

  function cleanup() {
    if (!active) return;
    active = false;
    pending.forEach((handle) => clock.clearTimeout(handle));
    pending.length = 0;
    motion.removeEventListener("change", onMotionChange);
  }

  function finish() {
    if (!active) return;
    cleanup();
    onFinish();
  }

  function onMotionChange() {
    if (motion.matches) finish();
  }

  motion.addEventListener("change", onMotionChange);
  if (motion.matches) {
    pending.push(clock.setTimeout(finish, 0));
  } else {
    [600, 1200, 1800].forEach((delay, index) => {
      pending.push(
        clock.setTimeout(() => {
          if (active) onStep(index + 1);
        }, delay),
      );
    });
    pending.push(clock.setTimeout(finish, 2600));
  }
  return cleanup;
}
