import { useEffect, useRef, useState } from "react";

interface BubbleLifecycleOptions {
  phase: string;
  lastActivity: number;
  donePhasesSet: Set<string>;
  activePhasesSet: Set<string>;
  doneVisibleSec?: number;
  fadeOutMs?: number;
  staleThresholdSec?: number;
  disableStale?: boolean;
}

interface BubbleLifecycleResult {
  visible: boolean;
  fading: boolean;
  fadeOutMs: number;
  isStale: boolean;
  now: number;
}

export function useBubbleLifecycle({
  phase,
  lastActivity,
  donePhasesSet,
  activePhasesSet,
  doneVisibleSec = 4,
  fadeOutMs = 300,
  staleThresholdSec = 10,
  disableStale = false,
}: BubbleLifecycleOptions): BubbleLifecycleResult {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const wasActive = activePhasesSet.has(prevPhaseRef.current);
    prevPhaseRef.current = phase;
    if (donePhasesSet.has(phase) && wasActive) {
      const t = Math.floor(Date.now() / 1000);
      queueMicrotask(() => {
        setHidden(false);
        setDoneAt((prev) => prev ?? t);
      });
    } else if (!donePhasesSet.has(phase)) {
      queueMicrotask(() => {
        setHidden(false);
        setDoneAt(null);
      });
    }
  }, [phase, donePhasesSet, activePhasesSet]);

  const isStale =
    !disableStale &&
    activePhasesSet.has(phase) &&
    now - lastActivity > staleThresholdSec;

  const isDoneExpired =
    donePhasesSet.has(phase) &&
    doneAt !== null &&
    now - doneAt > doneVisibleSec;

  useEffect(() => {
    if (!isDoneExpired || hidden) return;
    const timer = setTimeout(() => setHidden(true), fadeOutMs);
    return () => clearTimeout(timer);
  }, [isDoneExpired, hidden, fadeOutMs]);

  const fading = isDoneExpired && !hidden;
  const visible = !hidden && !isStale;

  return { visible, fading, fadeOutMs, isStale, now };
}
