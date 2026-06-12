import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "uzbek-ai:msgLimit";
const FREE_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

interface State {
  count: number;
  windowStart: number;
  bonus: number; // extra msgs from "watch ad"
}

const initial = (): State => ({ count: 0, windowStart: Date.now(), bonus: 0 });

export function useMessageLimit() {
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
            setState({ bonus: 0, ...parsed });
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

  const cap = FREE_LIMIT + state.bonus;
  const remaining = Math.max(0, cap - state.count);
  const limitReached = state.count >= cap;
  const resetsAt = state.windowStart + WINDOW_MS;

  const increment = useCallback(() => {
    setState((prev) => {
      let next: State;
      if (Date.now() - prev.windowStart > WINDOW_MS) {
        next = { count: 1, windowStart: Date.now(), bonus: 0 };
      } else {
        next = { ...prev, count: prev.count + 1 };
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const grantBonus = useCallback(
    (extra: number) => {
      setState((prev) => {
        const next: State = { ...prev, bonus: prev.bonus + extra };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  return {
    isLoaded,
    remaining,
    limitReached,
    resetsAt,
    limit: cap,
    count: state.count,
    increment,
    grantBonus,
  };
}
