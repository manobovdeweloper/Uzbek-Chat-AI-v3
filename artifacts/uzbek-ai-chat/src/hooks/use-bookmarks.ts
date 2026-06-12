import { useState, useEffect, useCallback } from "react";

export interface BookmarkedMessage {
  id: number;
  content: string;
  role: string;
  createdAt: string;
  conversationId: number;
  conversationTitle?: string;
}

const KEY = "oz-bookmarks";

function load(): BookmarkedMessage[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>(load);

  const save = useCallback((list: BookmarkedMessage[]) => {
    localStorage.setItem(KEY, JSON.stringify(list));
    setBookmarks(list);
  }, []);

  const isBookmarked = useCallback((id: number) => bookmarks.some((b) => b.id === id), [bookmarks]);

  const toggle = useCallback((msg: BookmarkedMessage) => {
    setBookmarks((prev) => {
      const next = prev.some((b) => b.id === msg.id)
        ? prev.filter((b) => b.id !== msg.id)
        : [msg, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => save([]), [save]);

  return { bookmarks, isBookmarked, toggle, clear };
}
