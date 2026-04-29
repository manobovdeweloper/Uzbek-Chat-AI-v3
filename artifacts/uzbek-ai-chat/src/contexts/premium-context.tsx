import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

const STORAGE_KEY = "uzbek-ai:isPremium";

interface PremiumContextValue {
  isPremium: boolean;
  /** Calls the server, returns null on success or an error message string on failure. */
  activate: (code: string) => Promise<string | null>;
  deactivate: () => void;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    try {
      setIsPremium(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  const activate = useCallback(async (code: string): Promise<string | null> => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      return "Kod 6 ta raqamdan iborat bo'lishi kerak.";
    }
    try {
      const res = await fetch("/api/premium/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {}
        setIsPremium(true);
        return null;
      }
      return data.error ?? "Kod noto'g'ri yoki allaqachon ishlatilgan.";
    } catch {
      return "Server bilan bog'lanib bo'lmadi.";
    }
  }, []);

  const deactivate = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsPremium(false);
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, activate, deactivate }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
