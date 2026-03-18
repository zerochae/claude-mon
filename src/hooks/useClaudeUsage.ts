import { useState, useEffect, useCallback } from "react";
import { getClaudeUsage, type ClaudeUsage } from "@/services/tauri";

const STORAGE_KEY = "claude-mon:usage";
const BASE_INTERVAL = 120_000;
const MAX_INTERVAL = 600_000;

function loadCached(): ClaudeUsage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClaudeUsage;
  } catch {
    return null;
  }
}

function saveCached(data: ClaudeUsage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}

let memCache: ClaudeUsage | null = loadCached();
let lastFetchAt = 0;
let currentDelay = BASE_INTERVAL;
let pollingTimer: ReturnType<typeof setTimeout> | undefined;
const subscribers = new Set<(data: ClaudeUsage | null, err: string | null) => void>();

function notifyAll(data: ClaudeUsage | null, err: string | null) {
  for (const fn of subscribers) fn(data, err);
}

function doFetch() {
  lastFetchAt = Date.now();
  getClaudeUsage()
    .then((data) => {
      memCache = data;
      saveCached(data);
      currentDelay = BASE_INTERVAL;
      notifyAll(data, null);
    })
    .catch((e: unknown) => {
      currentDelay = Math.min(currentDelay * 2, MAX_INTERVAL);
      notifyAll(memCache, String(e));
    })
    .finally(() => {
      clearTimeout(pollingTimer);
      pollingTimer = setTimeout(doFetch, currentDelay);
    });
}

function ensurePolling() {
  if (pollingTimer !== undefined) return;
  const elapsed = Date.now() - lastFetchAt;
  const wait = Math.max(0, currentDelay - elapsed);
  if (lastFetchAt === 0) {
    doFetch();
  } else {
    pollingTimer = setTimeout(doFetch, wait);
  }
}

export function useClaudeUsage() {
  const [usage, setUsage] = useState<ClaudeUsage | null>(memCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (data: ClaudeUsage | null, err: string | null) => {
      setUsage(data);
      setError(err);
    };
    subscribers.add(handler);
    ensurePolling();
    return () => {
      subscribers.delete(handler);
      if (subscribers.size === 0) {
        clearTimeout(pollingTimer);
        pollingTimer = undefined;
      }
    };
  }, []);

  const refresh = useCallback(() => {
    clearTimeout(pollingTimer);
    pollingTimer = undefined;
    doFetch();
  }, []);

  return { usage, error, refresh };
}

export function formatResetCountdown(iso: string | null): string {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "now";
  const totalMin = Math.ceil(diff / 60_000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${totalMin}m`;
}
