import {
  Plus, MessageSquare, Trash2, Loader2, Crown, Sparkles,
  FileText, Image as ImageIcon, Mic, Search, X, Sun, Moon,
  Zap, Infinity, ChevronLeft, ChevronRight, Edit2, Check,
  Volume2, VolumeX, Bookmark, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  OpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSound } from "@/hooks/use-sound";

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
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  onRenameConversation: (id: number, title: string) => void;
}

function groupByDate(conversations: OpenaiConversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);
  const groups: Record<string, OpenaiConversation[]> = {
    "Bugun": [], "Kecha": [], "Shu hafta": [], "Oldingi": [],
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

const COLLAPSED_KEY = "oz-sidebar-collapsed";

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
  bookmarkCount,
  onOpenBookmarks,
  onRenameConversation,
}: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteOpenaiConversation();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const { enabled: soundOn, toggle: toggleSound } = useSound();

  const toggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (activeConversationId === id) onNewChat();
      },
    });
  };

  const startEdit = (e: React.MouseEvent, conv: OpenaiConversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || "Yangi suhbat");
    setTimeout(() => editRef.current?.select(), 30);
  };

  const commitEdit = (id: number) => {
    if (editTitle.trim()) onRenameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  const filtered = search.trim()
    ? conversations.filter((c) => (c.title || "Yangi suhbat").toLowerCase().includes(search.toLowerCase()))
    : conversations;
  const groups = groupByDate(filtered);
  const imagePercent = isPremium ? 100 : Math.round((imageRemaining / imageLimit) * 100);

  if (collapsed) {
    return (
      <div className="flex h-full w-[60px] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border items-center py-3 gap-2">
        <button
          onClick={toggleCollapse}
          className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
          title="Kengaytirish"
        >
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
        <button onClick={onNewChat} className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-sm" title="Yangi suhbat">
          <Plus className="w-4 h-4 text-white" />
        </button>
        <button onClick={onOpenTools} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" title="Vositalar">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={onOpenBookmarks} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center relative text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" title="Xatcho'plar">
          <Bookmark className="w-4 h-4" />
          {bookmarkCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />}
        </button>
        <button onClick={toggleTheme} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" title="Mavzu">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={toggleSound} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" title={soundOn ? "Ovoz o'chir" : "Ovozni yoq"}>
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <div className="flex-1" />
        {!isPremium && (
          <button onClick={onUpgrade} className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm" title="Premium">
            <Crown className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground leading-none">O'zbek AI</h1>
            <span className="text-[10px] text-sidebar-foreground/40">v2.0</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {isPremium && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 mr-1">
              <Crown className="w-2.5 h-2.5" />Pro
            </span>
          )}
          <button onClick={toggleSound} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground" title={soundOn ? "Ovoz o'chir" : "Ovozni yoq"}>
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground" title="Mavzu almashtirish">
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleCollapse} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground" title="Yig'ish">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New Chat + Bookmarks row */}
      <div className="p-3 flex gap-2">
        <Button onClick={onNewChat} className="flex-1 justify-start gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm transition-all h-8 text-xs" data-testid="button-new-chat">
          <Plus className="w-3.5 h-3.5" />Yangi suhbat
        </Button>
        <button
          onClick={onOpenBookmarks}
          className="relative w-8 h-8 rounded-lg border border-sidebar-border hover:bg-sidebar-accent flex items-center justify-center transition-colors text-sidebar-foreground/60 hover:text-primary"
          title="Xatcho'plar"
        >
          <Bookmark className="w-3.5 h-3.5" />
          {bookmarkCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {Math.min(bookmarkCount, 9)}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-sidebar-accent/40 border border-sidebar-border rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/35 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Image Credits */}
      <div className="px-3 pb-2">
        <button
          onClick={onOpenTools}
          className="w-full text-left rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-2.5 hover:border-primary/40 transition-all"
          data-testid="card-image-credits"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-sidebar-foreground">AI Rasm krediti</span>
            </div>
            <span className="text-[11px] font-bold text-primary">
              {isPremium ? "∞" : `${imageRemaining}/${imageLimit}`}
            </span>
          </div>
          {!isPremium && (
            <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${imagePercent}%` }} />
            </div>
          )}
        </button>
      </div>

      {/* Tools */}
      <div className="px-3 pb-1.5">
        <h2 className="px-1 py-1 text-[10px] font-bold text-sidebar-foreground/35 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5" />Ilg'or vositalar
        </h2>
        {([
          { icon: ImageIcon, label: "Rasm Yaratish", badge: isPremium ? "HD" : `${imageRemaining}/${imageLimit}`, crown: false },
          { icon: FileText, label: "PDF Tahlilchi", badge: null, crown: !isPremium },
          { icon: Mic, label: "Ovozli Suhbat", badge: null, crown: !isPremium },
        ] as const).map(({ icon: Icon, label, badge, crown }) => (
          <button key={label} onClick={onOpenTools}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {badge && <span className="text-[10px] text-primary font-bold">{badge}</span>}
            {crown && <Crown className="w-3 h-3 text-primary/50" />}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-3">
        <div className="pb-3">
          {isLoading ? (
            <div className="space-y-2 pt-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-sidebar-accent/40 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="w-8 h-8 text-sidebar-foreground/15 mx-auto mb-2" />
              <p className="text-[11px] text-sidebar-foreground/35">
                {search ? "Topilmadi" : "Suhbat yo'q"}
              </p>
            </div>
          ) : (
            Object.entries(groups).map(([grp, convs]) => {
              if (!convs.length) return null;
              return (
                <div key={grp}>
                  <h3 className="px-1 pt-3 pb-1 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-widest">{grp}</h3>
                  {convs.map((conv) => {
                    const isActive = activeConversationId === conv.id;
                    const isEditing = editingId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => !isEditing && onSelectConversation(conv.id)}
                        className={`group/conv flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer transition-all mb-0.5 ${
                          isActive ? "bg-primary/15 border border-primary/25 text-sidebar-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                        data-testid={`card-conversation-${conv.id}`}
                      >
                        <MessageSquare className={`w-3 h-3 flex-shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground/25"}`} />
                        {isEditing ? (
                          <input
                            ref={editRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => commitEdit(conv.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(conv.id);
                              if (e.key === "Escape") setEditingId(null);
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-transparent border-b border-primary/50 outline-none text-[11px] text-sidebar-foreground py-0.5 min-w-0"
                            autoFocus
                          />
                        ) : (
                          <span className="flex-1 truncate">{conv.title || "Yangi suhbat"}</span>
                        )}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/conv:opacity-100 flex-shrink-0">
                          <button onClick={(e) => startEdit(e, conv)} className="p-0.5 rounded hover:text-primary transition-colors text-sidebar-foreground/30" title="Nomini o'zgartirish">
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDelete(e, conv.id)} className="p-0.5 rounded hover:text-destructive transition-colors text-sidebar-foreground/30" title="O'chirish">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/35 px-0.5">
          <span>{conversations.length} suhbat</span>
          <div className="flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            <span>O'zbek AI v2</span>
          </div>
        </div>
        {isPremium ? (
          <div className="rounded-xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/20 p-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-bold text-sidebar-foreground">Premium faol ✓</div>
              <div className="text-[10px] text-sidebar-foreground/45">Cheksiz imkoniyatlar</div>
            </div>
          </div>
        ) : (
          <button onClick={onUpgrade} className="w-full rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 p-3 text-left hover:opacity-95 transition-all shadow-lg shadow-primary/20" data-testid="button-upgrade-sidebar">
            <div className="flex items-center gap-2 text-white mb-0.5">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Premiumga o'tish</span>
            </div>
            <div className="text-[10px] text-white/70">HD rasmlar · PDF · Ovoz · $2/oy</div>
          </button>
        )}
      </div>
    </div>
  );
}
