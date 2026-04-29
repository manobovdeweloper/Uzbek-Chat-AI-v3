import { Plus, MessageSquare, Trash2, Loader2, Crown, Sparkles, FileText, Image as ImageIcon, Mic } from "lucide-react";
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
  isPremium: boolean;
  imageRemaining: number;
  imageLimit: number;
  onUpgrade: () => void;
  onOpenTools: () => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isLoading,
  isPremium,
  imageRemaining,
  imageLimit,
  onUpgrade,
  onOpenTools,
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
        {isPremium && (
          <span
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/40"
            data-testid="badge-premium"
          >
            <Crown className="w-3 h-3" />
            Premium
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-sm"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4" />
          Yangi suhbat
        </Button>
      </div>

      {/* Image credits card */}
      <div className="px-4 pb-2">
        <button
          onClick={onOpenTools}
          className="w-full text-left rounded-lg bg-secondary/10 border border-secondary/30 p-3 hover:bg-secondary/15 transition-colors"
          data-testid="card-image-credits"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-secondary" />
              <span className="text-xs font-semibold text-sidebar-foreground">AI Rasm krediti</span>
            </div>
            <span className="text-xs font-bold text-secondary">
              {isPremium ? "∞" : `${imageRemaining}/${imageLimit}`}
            </span>
          </div>
          <div className="text-[11px] text-sidebar-foreground/60 mt-1">
            {isPremium ? "Cheksiz HD rasmlar" : "Bugungi rasmlar qoldi"}
          </div>
        </button>
      </div>

      {/* Tools */}
      <div className="px-3 pb-2">
        <h2 className="px-2 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Ilg'or vositalar
        </h2>
        <button
          onClick={onOpenTools}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          data-testid="button-tool-image"
        >
          <ImageIcon className="w-4 h-4" />
          Rasm Yaratish
          <span className="ml-auto text-[10px] text-secondary font-semibold">
            {isPremium ? "HD" : `${imageRemaining}/${imageLimit}`}
          </span>
        </button>
        <button
          onClick={onOpenTools}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <FileText className="w-4 h-4" />
          PDF Tahlilchi
          {!isPremium && <Crown className="w-3 h-3 ml-auto text-secondary" />}
        </button>
        <button
          onClick={onOpenTools}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Mic className="w-4 h-4" />
          Ovozli Suhbat
          {!isPremium && <Crown className="w-3 h-3 ml-auto text-secondary" />}
        </button>
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
                className={`group flex items-center justify-between rounded-md px-3 py-2.5 text-sm cursor-pointer transition-colors ${
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
                  className="p-1.5 rounded-sm transition-colors text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-border opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  data-testid={`button-delete-conversation-${conv.id}`}
                  aria-label="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bottom card */}
      <div className="p-3 border-t border-sidebar-border">
        {isPremium ? (
          <div className="rounded-lg bg-secondary/10 border border-secondary/30 p-3 text-center">
            <Crown className="w-4 h-4 text-secondary mx-auto mb-1" />
            <div className="text-xs font-semibold text-sidebar-foreground">Premium faol</div>
            <div className="text-[11px] text-sidebar-foreground/60">Cheksiz hammasiga kirish</div>
          </div>
        ) : (
          <button
            onClick={onUpgrade}
            className="w-full rounded-lg bg-gradient-to-br from-sidebar-primary to-secondary p-3 text-left hover:opacity-90 transition-opacity"
            data-testid="button-upgrade-sidebar"
          >
            <div className="flex items-center gap-2 text-sidebar-primary-foreground mb-1">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-semibold">Premiumga o'tish</span>
            </div>
            <div className="text-[11px] text-sidebar-primary-foreground/85">
              HD rasmlar · PDF · Ovoz · $2/oy
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
