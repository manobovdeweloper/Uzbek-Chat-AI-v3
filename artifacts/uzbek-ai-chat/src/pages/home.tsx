import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListOpenaiConversations, 
  useCreateOpenaiConversation, 
  useGetOpenaiConversation,
  useListOpenaiMessages,
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey,
  getListOpenaiMessagesQueryKey
} from "@workspace/api-client-react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { useChatStream } from "@/hooks/use-chat-stream";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const { sendMessage, streamingMessage, isStreaming } = useChatStream({
    conversationId: activeConversationId as number,
    onFinished: () => {
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(activeConversationId) });
        queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(activeConversationId) });
      }
    }
  });

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setIsSidebarOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: number) => {
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    let currentId = activeConversationId;
    
    if (!currentId) {
      try {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        const newConv = await createConversation.mutateAsync({ data: { title } });
        currentId = newConv.id;
        setActiveConversationId(newConv.id);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      } catch (err) {
        console.error("Failed to create conversation", err);
        return;
      }
    }

    if (currentId) {
      if (!activeConversationId) {
        const response = await fetch(`/api/openai/conversations/${currentId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(currentId) });
        queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(currentId) });
      } else {
        sendMessage(content);
      }
    }
  }, [activeConversationId, createConversation, queryClient, sendMessage]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Sidebar — slides in on mobile, always visible on md+ */}
      <div
        className={`
          fixed md:relative z-30 md:z-auto
          h-full
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          isLoading={isLoadingConversations}
        />
      </div>

      <ChatArea
        messages={activeConversationId ? messages : []}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        isLoading={!!activeConversationId && (isLoadingConversation || isLoadingMessages)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
}
