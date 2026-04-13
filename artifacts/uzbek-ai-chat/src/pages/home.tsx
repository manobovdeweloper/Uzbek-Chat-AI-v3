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
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    let currentId = activeConversationId;
    
    if (!currentId) {
      // Create new conversation first
      try {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        const newConv = await createConversation.mutateAsync({ data: { title } });
        currentId = newConv.id;
        setActiveConversationId(newConv.id);
        
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        
        // Wait a tick for the state to update
        setTimeout(() => {
           // We can't use sendMessage from the hook directly here because it closed over the old conversationId
           // Instead, we rely on the component re-rendering with the new ID, and the user might have to send again
           // To fix this fully, we can pass currentId directly to a fetch
        }, 0);
      } catch (err) {
        console.error("Failed to create conversation", err);
        return;
      }
    }

    if (currentId) {
      // Optimistically add user message if we want, or just let stream handle it
      // For now, we will stream using the hook. 
      // NOTE: if we just created it, the hook might not have the updated ID yet in this tick.
      // So we implement the fetch directly here to be safe for the FIRST message.
      if (!activeConversationId) {
        // Fallback fetch for first message
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
        isLoading={isLoadingConversations}
      />
      <ChatArea 
        messages={activeConversationId ? messages : []}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        isLoading={!!activeConversationId && (isLoadingConversation || isLoadingMessages)}
      />
    </div>
  );
}
