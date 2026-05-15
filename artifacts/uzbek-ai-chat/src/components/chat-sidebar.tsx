import {
  Plus, MessageSquare, Trash2, Search, X, Sun, Moon,
  ChevronLeft, ChevronRight, Edit2, Volume2, VolumeX,
  Bookmark, Pin, Flame, Crown, Sparkles, FileText,
  Image as ImageIcon, Mic, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  OpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSound } from "@/hooks/use-sound";
import { useStreak } from "@/hooks/use-streak";
import { usePinned } from "@/hooks/use-pinned";
import { relativeTime } from "@/hooks/use-relative-time";

/* ── Partner logos (defined early so they're available below) ───── */
function OxfordLifeLogo() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="w-5 h-5 rounded-md flex items-center justify-center shadow-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#1a6b3a,#2d9e5e)" }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1L10 3.5v4L5.5 10 1 7.5v-4L5.5 1z" fill="none" stroke="white" strokeWidth="1.1" />
          <path d="M5.5 3.5v4M3 4.8l2.5 1.2 2.5-1.2" stroke="white" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[9px] font-black tracking-widest uppercase" style={{ color: "#2d9e5e" }}>OXFORD</div>
        <div className="text-[8px] font-bold tracking-wider text-sidebar-foreground/40 uppercase">LIFE</div>
      </div>
    </div>
  );
}

function MRXLogo() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--sidebar-primary)), hsl(var(--accent)))" }}>
        <span className="text-[8px] font-black text-white tracking-tight leading-none">MX</span>
      </div>
      <div className="text-[12px] font-black tracking-tight leading-none">
        <span style={{ color: "hsl(var(--sidebar-primary))" }}>M</span>
        <span className="text-sidebar-foreground/50">R</span>
        <span style={{ color: "hsl(var(--accent))" }}>X</span>
      </div>
    </div>
  );
}

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
  const [themeIconSpin, setThemeIconSpin] = useState(false);

  const handleToggleTheme = () => {
    setThemeIconSpin(true);
    toggleTheme();
    setTimeout(() => setThemeIconSpin(false), 400);
  };

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

  // ── COLLAPSED RAIL ───────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="flex h-full w-[62px] flex-col glass-sidebar border-r border-sidebar-border items-center py-3 gap-1.5">
        <button onClick={toggleCollapse}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 hover:from-primary/30 hover:to-accent/20 flex items-center justify-center transition-all border border-primary/20 hover:border-primary/40"
          title="Kengaytirish">
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
        <div className="h-px w-7 bg-sidebar-border/70 my-0.5" />
        <button onClick={onNewChat}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 flex items-center justify-center shadow-md shadow-primary/30 transition-all hover:scale-105 active:scale-95"
          title="Yangi suhbat">
          <Plus className="w-4.5 h-4.5 text-white" />
        </button>
        <button onClick={onOpenBookmarks}
          className="relative w-10 h-10 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/40 hover:text-amber-400 transition-all"
          title="Xatcho'plar">
          <Bookmark className="w-4 h-4" />
          {bookmarkCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 border-2 border-sidebar" />}
        </button>
        <button onClick={onOpenTools}
          className="w-10 h-10 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/40 hover:text-primary transition-all"
          title="Vositalar">
          <ImageIcon className="w-4 h-4" />
        </button>
        <div className="h-px w-7 bg-sidebar-border/70 my-0.5" />
        <button onClick={handleToggleTheme}
          className="w-10 h-10 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground transition-all">
          {theme === "dark"
            ? <Sun className={`w-3.5 h-3.5 ${themeIconSpin ? "spin-once" : ""}`} />
            : <Moon className={`w-3.5 h-3.5 ${themeIconSpin ? "spin-once" : ""}`} />}
        </button>
        <button onClick={toggleSound}
          className="w-10 h-10 rounded-xl hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground transition-all">
          {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1" />
        {streak >= 2 && (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center" title={`${streak} kunlik streak!`}>
            <Flame className="w-4 h-4 text-amber-400 streak-glow" />
          </div>
        )}
        {!isPremium && (
          <button onClick={onUpgrade}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30 hover:opacity-90 transition-all"
            title="Premium">
            <Crown className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    );
  }

  // ── EXPANDED ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-72 flex-col glass-sidebar text-sidebar-foreground border-r border-sidebar-border">

      {/* Header */}
      <div className="relative px-3.5 pt-4 pb-3 border-b border-sidebar-border overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-4 w-16 h-16 rounded-full bg-accent/6 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-sidebar flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white animate-ping" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">O'zbek AI</h1>
              <div className="flex items-center gap-1.5">
                {isPremium
                  ? <span className="text-[10px] font-bold text-primary flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />Premium</span>
                  : <span className="text-[10px] text-sidebar-foreground/30">Bepul · v2.1</span>}
                {streak >= 2 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 ml-1">
                    <Flame className="w-2.5 h-2.5 streak-glow" />{streak}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleSound}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all text-sidebar-foreground/35 hover:text-sidebar-foreground"
              title={soundOn ? "Ovozni o'chir" : "Ovozni yoq"}>
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleToggleTheme}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all text-sidebar-foreground/35 hover:text-sidebar-foreground"
              title={theme === "dark" ? "Kun rejimi" : "Tun rejimi"}>
              {theme === "dark"
                ? <Sun className={`w-3.5 h-3.5 ${themeIconSpin ? "spin-once" : ""}`} />
                : <Moon className={`w-3.5 h-3.5 ${themeIconSpin ? "spin-once" : ""}`} />}
            </button>
            <button onClick={toggleCollapse}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all text-sidebar-foreground/35 hover:text-sidebar-foreground"
              title="Yig'ish">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Chat + Bookmarks */}
      <div className="px-3.5 pt-3 pb-2 flex gap-2">
        <Button onClick={onNewChat}
          className="flex-1 justify-start gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/80 text-white h-8 text-xs font-bold shadow-md shadow-primary/25 transition-all"
          data-testid="button-new-chat">
          <Plus className="w-3.5 h-3.5" />Yangi suhbat
        </Button>
        <button onClick={onOpenBookmarks}
          className="relative w-8 h-8 rounded-lg border border-sidebar-border hover:bg-sidebar-accent flex items-center justify-center transition-all text-sidebar-foreground/40 hover:text-amber-400"
          title="Xatcho'plar">
          <Bookmark className="w-3.5 h-3.5" />
          {bookmarkCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center px-1 border-2 border-sidebar">
              {Math.min(bookmarkCount, 9)}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="px-3.5 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/25 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Suhbatlarni qidirish..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-sidebar-accent/50 border border-sidebar-border rounded-xl text-sidebar-foreground placeholder:text-sidebar-foreground/25 focus:outline-none focus:border-primary/50 focus:bg-sidebar-accent transition-all" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Image credit card */}
      <div className="px-3.5 pb-2">
        <button onClick={onOpenTools}
          className="w-full text-left rounded-xl border border-primary/15 bg-gradient-to-r from-primary/8 to-accent/5 p-2.5 hover:border-primary/30 hover:from-primary/12 transition-all group/cred"
          data-testid="card-image-credits">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-sidebar-foreground">AI Rasm krediti</span>
            </div>
            <span className="text-[11px] font-bold text-primary tabular-nums">
              {isPremium ? "∞" : `${imageRemaining}/${imageLimit}`}
            </span>
          </div>
          {!isPremium && (
            <div className="h-1.5 bg-sidebar-border/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${imagePercent}%`,
                  background: imagePercent > 60
                    ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.8))"
                    : imagePercent > 30 ? "#f59e0b" : "#ef4444"
                }} />
            </div>
          )}
          {isPremium && <p className="text-[10px] text-primary/60 font-medium">Cheksiz HD · 1024×1024 · Rasm redaktori</p>}
        </button>
      </div>

      {/* Tools */}
      <div className="px-3.5 pb-1">
        <p className="px-1 pb-1 text-[9px] font-extrabold text-sidebar-foreground/20 uppercase tracking-[0.12em]">Ilg'or vositalar</p>
        {([
          { icon: ImageIcon, label: "Rasm Yaratish",  sub: isPremium ? "HD · Cheksiz" : `${imageRemaining}/${imageLimit} qoldi`, crown: false },
          { icon: FileText,  label: "PDF Tahlilchi",  sub: isPremium ? "Faol" : "Premium",                                       crown: !isPremium },
          { icon: Mic,       label: "Ovozli Suhbat",  sub: isPremium ? "Faol" : "Premium",                                       crown: !isPremium },
          { icon: BarChart2, label: "Statistika",     sub: `${conversations.length} suhbat`,                                     crown: false },
        ] as const).map(({ icon: Icon, label, sub, crown }) => (
          <button key={label} onClick={onOpenTools}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-[11px] text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all mb-0.5">
            <div className="w-6 h-6 rounded-lg bg-sidebar-accent/80 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-semibold truncate">{label}</div>
              <div className={`text-[10px] ${crown ? "text-primary/60" : "text-sidebar-foreground/30"}`}>{sub}</div>
            </div>
            {crown && <Crown className="w-3 h-3 text-primary/40 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-2.5">
        <div className="pb-4">
          {isLoading ? (
            <div className="space-y-2 pt-2 px-1">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-8 rounded-xl shimmer" style={{ opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <MessageSquare className="w-10 h-10 text-sidebar-foreground/8" />
              <p className="text-xs text-sidebar-foreground/25">
                {search ? `"${search}" topilmadi` : "Hech qanday suhbat yo'q"}
              </p>
            </div>
          ) : (
            <>
              {pinnedConvs.length > 0 && (
                <div>
                  <SectionLabel icon={<Pin className="w-2.5 h-2.5" />} label="Pinlangan" color="text-primary/50" />
                  {pinnedConvs.map((conv) => (
                    <ConvRow key={conv.id} conv={conv}
                      isActive={activeConversationId === conv.id}
                      isEditing={editingId === conv.id}
                      editTitle={editTitle} editRef={editRef}
                      onSelect={() => onSelectConversation(conv.id)}
                      onDelete={(e) => handleDelete(e, conv.id)}
                      onEdit={(e) => startEdit(e, conv)}
                      onCommitEdit={() => commitEdit(conv.id)}
                      onCancelEdit={() => setEditingId(null)}
                      setEditTitle={setEditTitle}
                      isPinned={true}
                      onTogglePin={(e) => { e.stopPropagation(); togglePin(conv.id); }} />
                  ))}
                </div>
              )}
              {Object.entries(groups).map(([grp, convs]) => !convs.length ? null : (
                <div key={grp}>
                  <SectionLabel label={grp} />
                  {convs.map((conv) => (
                    <ConvRow key={conv.id} conv={conv}
                      isActive={activeConversationId === conv.id}
                      isEditing={editingId === conv.id}
                      editTitle={editTitle} editRef={editRef}
                      onSelect={() => onSelectConversation(conv.id)}
                      onDelete={(e) => handleDelete(e, conv.id)}
                      onEdit={(e) => startEdit(e, conv)}
                      onCommitEdit={() => commitEdit(conv.id)}
                      onCancelEdit={() => setEditingId(null)}
                      setEditTitle={setEditTitle}
                      isPinned={false}
                      onTogglePin={(e) => { e.stopPropagation(); togglePin(conv.id); }} />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3.5 py-3 border-t border-sidebar-border space-y-2.5">
        {/* Partner logos */}
        <div className="flex items-center justify-between px-0.5 pb-1.5 border-b border-sidebar-border/50">
          <OxfordLifeLogo />
          <MRXLogo />
        </div>
        <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/20 px-0.5">
          <span>{conversations.length} ta suhbat</span>
          {streak >= 2 && <span className="flex items-center gap-1 text-amber-400/60"><Flame className="w-2.5 h-2.5" />{streak} kunlik streak</span>}
        </div>
        {isPremium ? (
          <div className="rounded-xl bg-gradient-to-r from-primary/12 to-accent/8 border border-primary/20 p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/25">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-sidebar-foreground">Premium faol ✓</div>
              <div className="text-[10px] text-sidebar-foreground/35">Barcha imkoniyatlar ochiq</div>
            </div>
          </div>
        ) : (
          <button onClick={onUpgrade}
            className="w-full rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent p-3 text-left hover:opacity-92 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 glow-sm"
            data-testid="button-upgrade-sidebar">
            <div className="flex items-center gap-2 text-white mb-0.5">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-xs font-bold flex-1">Premiumga o'tish</span>
              <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5 font-semibold">$2/oy</span>
            </div>
            <div className="text-[10px] text-white/60 leading-relaxed">HD rasmlar · PDF tahlil · Ovoz · Cheksiz</div>
          </button>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label, icon, color }: { label: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div className={`flex items-center gap-1 px-2 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-[0.12em] ${color ?? "text-sidebar-foreground/20"}`}>
      {icon}{label}
    </div>
  );
}

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
    <div onClick={() => !isEditing && onSelect()}
      className={`group/conv flex items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] cursor-pointer transition-all mb-0.5 ${
        isActive
          ? "bg-primary/12 border border-primary/25 text-sidebar-foreground shadow-sm shadow-primary/10"
          : "text-sidebar-foreground/55 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground border border-transparent"
      }`}
      data-testid={`card-conversation-${conv.id}`}>
      <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
        isActive ? "bg-primary/20" : "bg-sidebar-accent/60 group-hover/conv:bg-sidebar-accent"
      }`}>
        <MessageSquare className={`w-3 h-3 ${isActive ? "text-primary" : "text-sidebar-foreground/30"}`} />
      </div>

      {isEditing ? (
        <input ref={editRef} value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") onCommitEdit(); if (e.key === "Escape") onCancelEdit(); e.stopPropagation(); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-primary/50 outline-none text-[11px] text-sidebar-foreground py-0.5 min-w-0"
          autoFocus />
      ) : (
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">{conv.title || "Yangi suhbat"}</div>
          <div className="text-[9px] text-sidebar-foreground/22 mt-0.5">{relativeTime(conv.createdAt)}</div>
        </div>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover/conv:opacity-100 flex-shrink-0 transition-opacity">
        <button onClick={onTogglePin}
          className={`p-0.5 rounded transition-all ${isPinned ? "text-primary" : "text-sidebar-foreground/20 hover:text-primary"}`}
          title={isPinned ? "Pindan chiqarish" : "Pin qilish"}>
          <Pin className={`w-2.5 h-2.5 ${isPinned ? "fill-primary" : ""}`} />
        </button>
        <button onClick={onEdit}
          className="p-0.5 rounded text-sidebar-foreground/20 hover:text-primary transition-all"
          title="Nom o'zgartirish">
          <Edit2 className="w-2.5 h-2.5" />
        </button>
        <button onClick={onDelete}
          className="p-0.5 rounded text-sidebar-foreground/20 hover:text-destructive transition-all"
          title="O'chirish">
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

