import { useState, useEffect } from "react";

const KEY_DATE = "oz-streak-date";
const KEY_COUNT = "oz-streak-count";

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem(KEY_DATE);
    const count = parseInt(localStorage.getItem(KEY_COUNT) ?? "0", 10);

    if (last === today) {
      setStreak(count);
      return;
    }
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newCount = last === yesterday ? count + 1 : 1;
    localStorage.setItem(KEY_DATE, today);
    localStorage.setItem(KEY_COUNT, String(newCount));
    setStreak(newCount);
  }, []);

  return streak;
}
