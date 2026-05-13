import {
  Plus, MessageSquare, Trash2, Loader2, Crown, Sparkles,
  FileText, Image as ImageIcon, Mic, Search, X, Sun, Moon,
  Zap, Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  OpenaiConversation,
  useDeleteOpenaiConversation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

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

function groupByDate(conversations: OpenaiConversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, OpenaiConversation[]> = {
    "Bugun": [],
    "Kecha": [],
    "Shu hafta": [],
    "Oldingi": [],
  };

  for (const conv of conversations) {
    const d = new Date(conv.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups["Bugun"].push(conv);
    else if (day >= yesterday) groups["Kecha"].push(conv);
    else if (day >= week) groups["Shu hafta"].push(conv);
    else groups["Oldingi"].push(conv);
  }

  return groups;
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
  const [search, setSearch] = useState("");
  const { theme, toggle } = useTheme();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (activeConversationId === id) onNewChat();
        },
      }
    );
  };

  const filtered = search.trim()
    ? conversations.filter((c) =>
        (c.title || "Yangi suhbat").toLowerCase().includes(search.trim().toLowerCase())
      )
    : conversations;

  const groups = groupByDate(filtered);

  const imagePercent = isPremium ? 100 : Math.round((imageRemaining / imageLimit) * 100);

  return (
    <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground leading-none">O'zbek AI</h1>
            {isPremium && (
              <span className="text-[10px] text-primary font-semibold">Premium</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isPremium && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
              <Crown className="w-2.5 h-2.5" />
              Pro
            </span>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
            title={theme === "dark" ? "Yorug' rejim" : "Qorong'u rejim"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm glow-primary transition-all"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4" />
          Yangi suhbat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suhbatlarni qidiring..."
            className="w-full pl-8 pr-8 py-2 text-xs bg-sidebar-accent/50 border border-sidebar-border rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Image Credits */}
      <div className="px-3 pb-2">
        <button
          onClick={onOpenTools}
          className="w-full text-left rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-3 hover:border-primary/40 transition-all group"
          data-testid="card-image-credits"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-sidebar-foreground">AI Rasm</span>
            </div>
            <span className="text-xs font-bold text-primary">
              {isPremium ? <Infinity className="w-3.5 h-3.5" /> : `${imageRemaining}/${imageLimit}`}
            </span>
          </div>
          {!isPremium && (
            <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ width: `${imagePercent}%` }}
              />
            </div>
          )}
          {isPremium && (
            <div className="text-[10px] text-primary/80 font-medium">Cheksiz HD rasmlar</div>
          )}
        </button>
      </div>

      {/* Tools */}
      <div className="px-3 pb-2">
        <h2 className="px-1 py-1.5 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5" />
          Ilg'or vositalar
        </h2>
        {[
          { icon: ImageIcon, label: "Rasm Yaratish", badge: isPremium ? "HD" : `${imageRemaining}/${imageLimit}`, premium: false },
          { icon: FileText, label: "PDF Tahlilchi", badge: null, premium: !isPremium },
          { icon: Mic, label: "Ovozli Suhbat", badge: null, premium: !isPremium },
        ].map(({ icon: Icon, label, badge, premium }) => (
          <button
            key={label}
            onClick={onOpenTools}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <span className="text-[10px] text-primary font-bold">{badge}</span>
            )}
            {premium && <Crown className="w-3 h-3 text-primary/60" />}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-0.5 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <MessageSquare className="w-8 h-8 text-sidebar-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-sidebar-foreground/40">
                {search ? "Hech narsa topilmadi" : "Hozircha suhbatlar yo'q"}
              </p>
            </div>
          ) : (
            Object.entries(groups).map(([groupName, convs]) => {
              if (convs.length === 0) return null;
              return (
                <div key={groupName}>
                  <h3 className="px-2 pt-3 pb-1 text-[10px] font-bold text-sidebar-foreground/35 uppercase tracking-widest">
                    {groupName}
                  </h3>
                  {convs.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all ${
                        activeConversationId === conv.id
                          ? "bg-primary/15 text-sidebar-foreground border border-primary/25 shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                      data-testid={`card-conversation-${conv.id}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className={`w-3 h-3 flex-shrink-0 ${activeConversationId === conv.id ? "text-primary" : "text-sidebar-foreground/30"}`} />
                        <span className="truncate">{conv.title || "Yangi suhbat"}</span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="p-1 rounded transition-colors text-sidebar-foreground/30 hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                        aria-label="O'chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Stats + Upgrade */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/40 px-1">
          <span>{conversations.length} ta suhbat</span>
          <span>O'zbek AI v2</span>
        </div>

        {isPremium ? (
          <div className="rounded-xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/20 p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-sidebar-foreground">Premium faol</div>
              <div className="text-[10px] text-sidebar-foreground/50">Hamma imkoniyatlar ochiq</div>
            </div>
          </div>
        ) : (
          <button
            onClick={onUpgrade}
            className="w-full rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 p-3 text-left hover:opacity-95 transition-all shadow-lg shadow-primary/20 glow-primary"
            data-testid="button-upgrade-sidebar"
          >
            <div className="flex items-center gap-2 text-white mb-0.5">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Premiumga o'tish</span>
            </div>
            <div className="text-[10px] text-white/75">
              HD rasmlar · PDF · Ovoz · $2/oy
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
