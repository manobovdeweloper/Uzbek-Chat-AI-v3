import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  useListOpenaiMessages,
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey,
  getListOpenaiMessagesQueryKey,
} from "@workspace/api-client-react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { useChatStream } from "@/hooks/use-chat-stream";
import { usePremium } from "@/contexts/premium-context";
import { useImageLimit } from "@/hooks/use-image-limit";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useDraft } from "@/hooks/use-draft";
import { useSound } from "@/hooks/use-sound";
import { UpgradeModal } from "@/components/upgrade-modal";
import { DailyLimitModal } from "@/components/daily-limit-modal";
import { PremiumToolsModal } from "@/components/premium-tools-modal";
import { BookmarksPanel } from "@/components/bookmarks-panel";
import type { BookmarkedMessage } from "@/hooks/use-bookmarks";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [imageLimitOpen, setImageLimitOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const queryClient = useQueryClient();

  const { isPremium } = usePremium();
  const { remaining: imgRemaining, limit: imgLimit, resetsAt: imgResetsAt } = useImageLimit();
  const { bookmarks, isBookmarked, toggle: toggleBookmark, clear: clearBookmarks } = useBookmarks();
  const { play: playSound } = useSound();

  const { getDraft, saveDraft, clearDraft } = useDraft(activeConversationId);
  const [draft, setDraft] = useState(() => getDraft());

  useEffect(() => { setDraft(getDraft()); }, [activeConversationId]);

  const { data: conversations = [], isLoading: isLoadingConversations } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();

  const { data: activeConversation, isLoading: isLoadingConversation } = useGetOpenaiConversation(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId, queryKey: getGetOpenaiConversationQueryKey(activeConversationId as number) } }
  );

  const { data: messages = [], isLoading: isLoadingMessages } = useListOpenaiMessages(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId, queryKey: getListOpenaiMessagesQueryKey(activeConversationId as number) } }
  );

  const { sendMessage, streamingMessage, isStreaming, stopStreaming } = useChatStream({
    conversationId: activeConversationId as number,
    tier: isPremium ? "premium" : "free",
    onFinished: () => {
      playSound();
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(activeConversationId) });
        queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(activeConversationId) });
      }
    },
  });

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null); setIsSidebarOpen(false); setDraft("");
  }, []);

  const handleSelectConversation = useCallback((id: number) => {
    setActiveConversationId(id); setIsSidebarOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (content: string, imageBase64?: string) => {
    let currentId = activeConversationId;
    if (!currentId) {
      try {
        const cleanTitle = content.replace(/^__IMG__[\s\S]*?__ENDIMG__/, "").trim();
        const title = (imageBase64 && !cleanTitle)
          ? "📷 Rasm tahlili"
          : cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + "..." : cleanTitle;
        const newConv = await createConversation.mutateAsync({ data: { title: title || "Yangi suhbat" } });
        currentId = newConv.id;
        setActiveConversationId(newConv.id);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      } catch { return; }
    }
    if (!currentId) return;
    clearDraft(); setDraft("");
    // If we just created the conversation, useChatStream closure still has null id —
    // call the SSE endpoint directly so streaming works immediately.
    if (!activeConversationId) {
      try {
        const response = await fetch(`/api/openai/conversations/${currentId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, tier: isPremium ? "premium" : "free", imageBase64 }),
        });
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            decoder.decode(value, { stream: true });
          }
        }
      } catch {}
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(currentId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(currentId) });
    } else {
      sendMessage(content, imageBase64);
    }
  }, [activeConversationId, createConversation, queryClient, sendMessage, isPremium, clearDraft]);

  const handleRenameConversation = useCallback(async (id: number, title: string) => {
    try {
      await fetch(`/api/openai/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(id) });
    } catch {}
  }, [queryClient]);

  const handleClearMessages = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      await fetch(`/api/openai/conversations/${activeConversationId}/messages`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(activeConversationId) });
    } catch {}
  }, [activeConversationId, queryClient]);

  const handleToggleBookmark = useCallback((msg: BookmarkedMessage) => {
    toggleBookmark({ ...msg, conversationTitle: activeConversation?.title ?? undefined });
  }, [toggleBookmark, activeConversation]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)} data-testid="sidebar-backdrop" />
      )}

      <div className={`fixed md:relative z-30 md:z-auto h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          isLoading={isLoadingConversations}
          isPremium={isPremium}
          imageRemaining={imgRemaining}
          imageLimit={imgLimit}
          onUpgrade={() => setUpgradeOpen(true)}
          onOpenTools={() => setToolsOpen(true)}
          bookmarkCount={bookmarks.length}
          onOpenBookmarks={() => setBookmarksOpen(true)}
          onRenameConversation={handleRenameConversation}
        />
      </div>

      <ChatArea
        messages={activeConversationId ? messages : []}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopStreaming={stopStreaming}
        onClearMessages={activeConversationId ? handleClearMessages : undefined}
        isLoading={!!activeConversationId && (isLoadingConversation || isLoadingMessages)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        conversationTitle={activeConversation?.title ?? undefined}
        conversationId={activeConversationId}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleToggleBookmark}
        onDraftChange={(v) => saveDraft(v)}
        initialDraft={draft}
      />

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <DailyLimitModal
        open={imageLimitOpen}
        onClose={() => setImageLimitOpen(false)}
        onUpgrade={() => { setImageLimitOpen(false); setUpgradeOpen(true); }}
        resetsAt={imgResetsAt}
        limit={imgLimit}
      />
      <PremiumToolsModal
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onUpgradeRequest={() => { setToolsOpen(false); setUpgradeOpen(true); }}
        onImageLimitReached={() => { setToolsOpen(false); setImageLimitOpen(true); }}
      />
      <BookmarksPanel
        open={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        bookmarks={bookmarks}
        onClear={clearBookmarks}
      />
    </div>
  );
}
