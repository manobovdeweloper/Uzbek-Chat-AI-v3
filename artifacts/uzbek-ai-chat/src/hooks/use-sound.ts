import { useCallback, useState } from "react";

const KEY = "oz-sound";

function loadEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playChime() {
  try {
    const ac = getCtx();
    const gain = ac.createGain();
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);

    const freqs = [880, 1108, 1320];
    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.05);
      osc.connect(gain);
      osc.start(ac.currentTime + i * 0.05);
      osc.stop(ac.currentTime + 0.7);
    });
  } catch {}
}

export function useSound() {
  const [enabled, setEnabled] = useState(loadEnabled);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(KEY, next ? "on" : "off");
      return next;
    });
  }, []);

  const play = useCallback(() => {
    if (enabled) playChime();
  }, [enabled]);

  return { enabled, toggle, play };
}
