import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "uzbek-ai:isPremium";
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface PremiumContextValue {
  isPremium: boolean;
  isLoaded: boolean;
  /** Returns null on success, error message string on failure. */
  activate: (code: string) => Promise<string | null>;
  deactivate: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => setIsPremium(v === "1"))
      .finally(() => setIsLoaded(true));
  }, []);

  const activate = useCallback(async (code: string): Promise<string | null> => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      return "Kod 6 ta raqamdan iborat bo'lishi kerak.";
    }
    try {
      const res = await fetch(`${BASE_URL}/api/premium/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && data.ok) {
        await AsyncStorage.setItem(STORAGE_KEY, "1");
        setIsPremium(true);
        return null;
      }
      return data.error ?? "Kod noto'g'ri yoki allaqachon ishlatilgan.";
    } catch {
      return "Server bilan bog'lanib bo'lmadi.";
    }
  }, []);

  const deactivate = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setIsPremium(false);
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, isLoaded, activate, deactivate }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
