import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "uzbek-ai:imageLimit";
const FREE_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

interface State {
  count: number;
  windowStart: number;
}

const initial = (): State => ({ count: 0, windowStart: Date.now() });

export function useImageLimit() {
  const [state, setState] = useState<State>(initial);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as State;
          if (Date.now() - parsed.windowStart > WINDOW_MS) {
            setState(initial());
          } else {
            setState(parsed);
          }
        }
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (next: State) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const increment = useCallback(() => {
    setState((prev) => {
      const fresh = Date.now() - prev.windowStart > WINDOW_MS;
      const next: State = fresh
        ? { count: 1, windowStart: Date.now() }
        : { count: prev.count + 1, windowStart: prev.windowStart };
      void persist(next);
      return next;
    });
  }, [persist]);

  const remaining = Math.max(0, FREE_LIMIT - state.count);
  const limitReached = state.count >= FREE_LIMIT;
  const resetsAt = state.windowStart + WINDOW_MS;

  return {
    remaining,
    limit: FREE_LIMIT,
    count: state.count,
    limitReached,
    resetsAt,
    increment,
    isLoaded,
  };
}
