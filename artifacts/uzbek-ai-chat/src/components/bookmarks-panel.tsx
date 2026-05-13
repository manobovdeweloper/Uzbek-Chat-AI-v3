import { Bookmark, X, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { BookmarkedMessage } from "@/hooks/use-bookmarks";

interface Props {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkedMessage[];
  onClear: () => void;
  onGoto?: (conversationId: number, messageId: number) => void;
}

export function BookmarksPanel({ open, onClose, bookmarks, onClear }: Props) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!open) return null;

  const handleCopy = async (msg: BookmarkedMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {}
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg md:max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 md:fade-in md:zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Xatcho'plar</h2>
              <p className="text-xs text-muted-foreground">{bookmarks.length} ta saqlangan xabar</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {bookmarks.length > 0 && (
              <button onClick={onClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
                Hammasini o'chir
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Bookmark className="w-12 h-12 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Hech qanday xabar saqlanmagan</p>
              <p className="text-xs text-muted-foreground/60">Xabarga mos belgini bosib saqlang</p>
            </div>
          ) : (
            bookmarks.map((msg) => (
              <div key={msg.id} className="rounded-xl border border-border bg-muted/30 p-3.5 group/bm hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${msg.role === "user" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                      {msg.role === "user" ? "Siz" : "AI"}
                    </span>
                    {msg.conversationTitle && (
                      <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">{msg.conversationTitle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/bm:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(msg)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-2">{formatTime(msg.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
