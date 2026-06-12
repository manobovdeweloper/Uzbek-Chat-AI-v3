import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "uzbek-ai:msgLimit";
const FREE_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

interface State {
  count: number;
  windowStart: number;
}

function read(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, windowStart: Date.now() };
    const parsed = JSON.parse(raw) as State;
    if (Date.now() - parsed.windowStart > WINDOW_MS) {
      return { count: 0, windowStart: Date.now() };
    }
    return parsed;
  } catch {
    return { count: 0, windowStart: Date.now() };
  }
}

export function useMessageLimit() {
  const [state, setState] = useState<State>({ count: 0, windowStart: Date.now() });

  useEffect(() => {
    setState(read());
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - state.count);
  const limitReached = state.count >= FREE_LIMIT;
  const resetsAt = state.windowStart + WINDOW_MS;

  const increment = useCallback(() => {
    setState((prev) => {
      let next = prev;
      if (Date.now() - prev.windowStart > WINDOW_MS) {
        next = { count: 1, windowStart: Date.now() };
      } else {
        next = { count: prev.count + 1, windowStart: prev.windowStart };
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next = { count: 0, windowStart: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setState(next);
  }, []);

  return { remaining, limitReached, resetsAt, increment, reset, limit: FREE_LIMIT, count: state.count };
}
