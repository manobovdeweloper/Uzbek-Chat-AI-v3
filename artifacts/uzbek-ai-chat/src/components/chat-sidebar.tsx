import {
  Plus, MessageSquare, Trash2, Loader2, Crown, Sparkles,
  FileText, Image as ImageIcon, Mic, Search, X, Sun, Moon,
  ChevronLeft, ChevronRight, Edit2,
  Volume2, VolumeX, Bookmark, Pin, Flame,
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
import { useStreak } from "@/hooks/use-streak";
import { usePinned } from "@/hooks/use-pinned";

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
  const groups: Record<string, OpenaiConversation[]> = { "Bugun": [], "Kecha": [], "Shu hafta": [], "Oldingi": [] };
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
  conversations, activeConversationId, onSelectConversation, onNewChat,
  isLoading, isPremium, imageRemaining, imageLimit, onUpgrade, onOpenTools,
  bookmarkCount, onOpenBookmarks, onRenameConversation,
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
  const streak = useStreak();
  const { isPinned, toggle: togglePin } = usePinned();

  const toggleCollapse = () => setCollapsed((v) => {
    const n = !v; localStorage.setItem(COLLAPSED_KEY, n ? "1" : "0"); return n;
  });

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
    setEditingId(conv.id); setEditTitle(conv.title || "Yangi suhbat");
    setTimeout(() => editRef.current?.select(), 30);
  };

  const commitEdit = (id: number) => {
    if (editTitle.trim()) onRenameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  const filtered = search.trim()
    ? conversations.filter((c) => (c.title || "Yangi suhbat").toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const pinnedConvs = filtered.filter((c) => isPinned(c.id));
  const unpinnedConvs = filtered.filter((c) => !isPinned(c.id));
  const groups = groupByDate(unpinnedConvs);
  const imagePercent = Math.round((imageRemaining / imageLimit) * 100);

  // ── COLLAPSED (icon-only rail) ──────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="flex h-full w-[60px] flex-col bg-sidebar border-r border-sidebar-border items-center py-3 gap-1.5">
        <button onClick={toggleCollapse}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 hover:from-primary/30 flex items-center justify-center transition-all border border-primary/20"
          title="Kengaytirish">
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
        <div className="h-px w-6 bg-sidebar-border my-1" />
        <button onClick={onNewChat} className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-all shadow-sm shadow-primary/30" title="Yangi suhbat">
          <Plus className="w-4 h-4 text-white" />
        </button>
        <button onClick={onOpenTools} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/50 hover:text-primary transition-all" title="Vositalar">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={onOpenBookmarks} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center relative text-sidebar-foreground/50 hover:text-amber-400 transition-all" title="Xatcho'plar">
          <Bookmark className="w-4 h-4" />
          {bookmarkCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 border border-sidebar" />}
        </button>
        <div className="h-px w-6 bg-sidebar-border my-1" />
        <button onClick={toggleTheme} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all">
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <button onClick={toggleSound} className="w-9 h-9 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all">
          {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1" />
        {streak >= 2 && (
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center" title={`${streak} kunlik streak!`}>
            <Flame className="w-4 h-4 text-amber-400 streak-glow" />
          </div>
        )}
        {!isPremium && (
          <button onClick={onUpgrade} className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm shadow-primary/30" title="Premium">
            <Crown className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    );
  }

  // ── EXPANDED ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">

      {/* Header */}
      <div className="relative px-3 pt-4 pb-3 border-b border-sidebar-border overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-2 -left-2 w-14 h-14 rounded-full bg-accent/8 blur-xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">O'zbek AI</h1>
              <div className="flex items-center gap-1.5">
                {isPremium ? (
                  <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />Premium</span>
                ) : (
                  <span className="text-[10px] text-sidebar-foreground/35">Bepul rejim</span>
                )}
                {streak >= 2 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 ml-1">
                    <Flame className="w-2.5 h-2.5 streak-glow" />{streak}🔥
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleSound} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all text-sidebar-foreground/40 hover:text-sidebar-foreground" title={soundOn ? "Ovoz o'chir" : "Ovozni yoq"}>
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all text-sidebar-foreground/40 hover:text-sidebar-foreground">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button onClick={toggleCollapse} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all text-sidebar-foreground/40 hover:text-sidebar-foreground">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Chat + Bookmarks */}
      <div className="p-3 flex gap-2">
        <Button onClick={onNewChat}
          className="flex-1 justify-start gap-2 bg-primary hover:bg-primary/90 text-white h-8 text-xs font-semibold shadow-sm shadow-primary/30 transition-all"
          data-testid="button-new-chat">
          <Plus className="w-3.5 h-3.5" />Yangi suhbat
        </Button>
        <button onClick={onOpenBookmarks}
          className="relative w-8 h-8 rounded-lg border border-sidebar-border hover:bg-sidebar-accent flex items-center justify-center transition-all text-sidebar-foreground/50 hover:text-amber-400"
          title="Xatcho'plar">
          <Bookmark className="w-3.5 h-3.5" />
          {bookmarkCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center px-0.5">
              {Math.min(bookmarkCount, 9)}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suhbatlarni qidirish..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-sidebar-accent/50 border border-sidebar-border rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-sidebar-accent/70 transition-all" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/30 hover:text-sidebar-foreground"><X className="w-3 h-3" /></button>}
        </div>
      </div>

      {/* Credits card */}
      <div className="px-3 pb-2">
        <button onClick={onOpenTools}
          className="w-full text-left rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-2.5 hover:border-primary/40 hover:from-primary/15 transition-all group/cred"
          data-testid="card-image-credits">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-sidebar-foreground">AI Rasm</span>
            </div>
            <span className="text-[11px] font-bold text-primary">{isPremium ? "∞" : `${imageRemaining}/${imageLimit}`}</span>
          </div>
          {!isPremium && (
            <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${imagePercent}%`, background: imagePercent > 60 ? "hsl(var(--primary))" : imagePercent > 30 ? "#f59e0b" : "#ef4444" }} />
            </div>
          )}
          {isPremium && <p className="text-[10px] text-primary/70 font-medium">Cheksiz HD rasmlar · 1024×1024</p>}
        </button>
      </div>

      {/* Tools */}
      <div className="px-3 pb-1">
        <p className="px-1 pb-1 text-[9px] font-bold text-sidebar-foreground/25 uppercase tracking-widest">Ilg'or vositalar</p>
        {([
          { icon: ImageIcon, label: "Rasm Yaratish", badge: isPremium ? "HD" : `${imageRemaining}/${imageLimit}`, crown: false },
          { icon: FileText, label: "PDF Tahlilchi", badge: null, crown: !isPremium },
          { icon: Mic, label: "Ovozli Suhbat", badge: null, crown: !isPremium },
        ] as const).map(({ icon: Icon, label, badge, crown }) => (
          <button key={label} onClick={onOpenTools}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {badge && <span className="text-[10px] text-primary font-bold">{badge}</span>}
            {crown && <Crown className="w-3 h-3 text-primary/40" />}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-3">
        <div className="pb-4">
          {isLoading ? (
            <div className="space-y-2 pt-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="h-8 rounded-lg shimmer" style={{ opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <MessageSquare className="w-10 h-10 text-sidebar-foreground/10 mx-auto mb-2" />
              <p className="text-xs text-sidebar-foreground/30">{search ? "Topilmadi" : "Suhbatlar yo'q"}</p>
            </div>
          ) : (
            <>
              {/* Pinned */}
              {pinnedConvs.length > 0 && (
                <div className="mb-1">
                  <p className="px-1 pt-2.5 pb-1 text-[9px] font-bold text-primary/50 uppercase tracking-widest flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5" />Pinlangan
                  </p>
                  {pinnedConvs.map((conv) => (
                    <ConvRow key={conv.id} conv={conv} isActive={activeConversationId === conv.id}
                      isEditing={editingId === conv.id} editTitle={editTitle} editRef={editRef}
                      onSelect={() => onSelectConversation(conv.id)}
                      onDelete={(e) => handleDelete(e, conv.id)}
                      onEdit={(e) => startEdit(e, conv)}
                      onCommitEdit={() => commitEdit(conv.id)}
                      onCancelEdit={() => setEditingId(null)}
                      setEditTitle={setEditTitle}
                      isPinned={true}
                      onTogglePin={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                    />
                  ))}
                </div>
              )}

              {/* Grouped by date */}
              {Object.entries(groups).map(([grp, convs]) => {
                if (!convs.length) return null;
                return (
                  <div key={grp}>
                    <p className="px-1 pt-3 pb-1 text-[9px] font-bold text-sidebar-foreground/25 uppercase tracking-widest">{grp}</p>
                    {convs.map((conv) => (
                      <ConvRow key={conv.id} conv={conv} isActive={activeConversationId === conv.id}
                        isEditing={editingId === conv.id} editTitle={editTitle} editRef={editRef}
                        onSelect={() => onSelectConversation(conv.id)}
                        onDelete={(e) => handleDelete(e, conv.id)}
                        onEdit={(e) => startEdit(e, conv)}
                        onCommitEdit={() => commitEdit(conv.id)}
                        onCancelEdit={() => setEditingId(null)}
                        setEditTitle={setEditTitle}
                        isPinned={false}
                        onTogglePin={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                      />
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/25 px-0.5">
          <span>{conversations.length} suhbat</span>
          <span>O'zbek AI v2.1</span>
        </div>
        {isPremium ? (
          <div className="rounded-xl bg-gradient-to-r from-primary/15 via-primary/8 to-accent/10 border border-primary/25 p-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-sidebar-foreground">Premium faol ✓</div>
              <div className="text-[10px] text-sidebar-foreground/40">Barcha imkoniyatlar ochiq</div>
            </div>
          </div>
        ) : (
          <button onClick={onUpgrade}
            className="w-full rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent/90 p-3 text-left hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 glow-primary"
            data-testid="button-upgrade-sidebar">
            <div className="flex items-center gap-2 text-white mb-0.5">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Premiumga o'tish</span>
              <span className="ml-auto text-[10px] bg-white/20 rounded-full px-1.5 py-0.5">$2/oy</span>
            </div>
            <div className="text-[10px] text-white/65">HD rasmlar · PDF tahlil · Ovoz · Cheksiz</div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: single conversation row ───────────────────────────────
interface ConvRowProps {
  conv: OpenaiConversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  editRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  setEditTitle: (v: string) => void;
  isPinned: boolean;
  onTogglePin: (e: React.MouseEvent) => void;
}

function ConvRow({ conv, isActive, isEditing, editTitle, editRef, onSelect, onDelete, onEdit, onCommitEdit, onCancelEdit, setEditTitle, isPinned, onTogglePin }: ConvRowProps) {
  return (
    <div
      onClick={() => !isEditing && onSelect()}
      className={`group/conv flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] cursor-pointer transition-all mb-0.5 ${
        isActive
          ? "bg-primary/15 border border-primary/25 text-sidebar-foreground shadow-sm"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground border border-transparent"
      }`}
      data-testid={`card-conversation-${conv.id}`}
    >
      <MessageSquare className={`w-3 h-3 flex-shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground/20"}`} />
      {isEditing ? (
        <input ref={editRef} value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") onCommitEdit(); if (e.key === "Escape") onCancelEdit(); e.stopPropagation(); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-primary/50 outline-none text-[11px] text-sidebar-foreground py-0.5 min-w-0"
          autoFocus
        />
      ) : (
        <span className="flex-1 truncate">{conv.title || "Yangi suhbat"}</span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover/conv:opacity-100 flex-shrink-0 transition-opacity">
        <button onClick={onTogglePin} className={`p-0.5 rounded transition-all ${isPinned ? "text-primary" : "text-sidebar-foreground/25 hover:text-primary"}`} title={isPinned ? "Pindan chiqar" : "Pin"}>
          <Pin className={`w-2.5 h-2.5 ${isPinned ? "fill-primary" : ""}`} />
        </button>
        <button onClick={onEdit} className="p-0.5 rounded text-sidebar-foreground/25 hover:text-primary transition-all" title="Nom o'zgartirish">
          <Edit2 className="w-2.5 h-2.5" />
        </button>
        <button onClick={onDelete} className="p-0.5 rounded text-sidebar-foreground/25 hover:text-destructive transition-all" title="O'chirish">
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
