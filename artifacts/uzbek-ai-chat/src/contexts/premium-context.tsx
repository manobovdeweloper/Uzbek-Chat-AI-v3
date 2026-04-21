import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

const STORAGE_KEY = "uzbek-ai:isPremium";
const ACTIVATION_CODE = "MANOPOV2026";

interface PremiumContextValue {
  isPremium: boolean;
  activate: (code: string) => boolean;
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

  const activate = useCallback((code: string) => {
    if (code.trim().toUpperCase() === ACTIVATION_CODE) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setIsPremium(true);
      return true;
    }
    return false;
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
