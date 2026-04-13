import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  OpenaiConversation,
  useDeleteOpenaiConversation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";

interface ChatSidebarProps {
  conversations: OpenaiConversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isLoading,
}: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteOpenaiConversation();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListOpenaiConversationsQueryKey(),
          });
          if (activeConversationId === id) {
            onNewChat();
          }
        },
      }
    );
  };

  return (
    <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          O'zbek AI
        </h1>
      </div>
      
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-sm"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4" />
          Yangi suhbat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          <h2 className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Tarix
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-sidebar-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-4 text-sm text-sidebar-foreground/50 italic">
              Hozircha suhbatlar yo'q
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                data-testid={`card-conversation-${conv.id}`}
              >
                <div className="truncate flex-1 pr-2">
                  {conv.title || "Yangi suhbat"}
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-border rounded-sm transition-opacity text-sidebar-foreground/60 hover:text-destructive"
                  data-testid={`button-delete-conversation-${conv.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
