import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "uzbek-ai:isPremium";
const ACTIVATION_CODE = "MANOPOV2026";

interface PremiumContextValue {
  isPremium: boolean;
  isLoaded: boolean;
  activate: (code: string) => Promise<boolean>;
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

  const activate = useCallback(async (code: string) => {
    if (code.trim().toUpperCase() === ACTIVATION_CODE) {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
      setIsPremium(true);
      return true;
    }
    return false;
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
