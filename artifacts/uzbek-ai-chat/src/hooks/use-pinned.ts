import { useState, useCallback } from "react";

const KEY = "oz-pinned";

function load(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function usePinned() {
  const [pinned, setPinned] = useState<number[]>(load);

  const isPinned = useCallback((id: number) => pinned.includes(id), [pinned]);

  const toggle = useCallback((id: number) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [id, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { pinned, isPinned, toggle };
}
