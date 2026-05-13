import { useEffect, useRef } from "react";

const PREFIX = "oz-draft-";

export function useDraft(conversationId: number | null) {
  const key = conversationId !== null ? `${PREFIX}${conversationId}` : null;

  function getDraft(): string {
    if (!key) return "";
    try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
  }

  function saveDraft(value: string) {
    if (!key) return;
    try {
      if (value.trim()) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {}
  }

  function clearDraft() {
    if (!key) return;
    try { localStorage.removeItem(key); } catch {}
  }

  return { getDraft, saveDraft, clearDraft };
}
