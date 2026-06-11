import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

interface Ad {
  id: number;
  title: string;
  description: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
}

export function AdBanner() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem("oz-dismissed-ads");
      return stored ? new Set(JSON.parse(stored) as number[]) : new Set();
    } catch { return new Set(); }
  });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/public/ads", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Ad[]) => setAds(data))
      .catch(() => {});
  }, []);

  const visible = ads.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  const idx = current % visible.length;
  const ad = visible[idx];

  const dismiss = (id: number) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    localStorage.setItem("oz-dismissed-ads", JSON.stringify([...next]));
    setCurrent((c) => c);
  };

  return (
    <div className="mx-3.5 mb-2">
      <div className="relative rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/8 to-orange-500/5 p-2.5 group/ad overflow-hidden">
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
          {visible.length > 1 && (
            <button onClick={() => setCurrent((c) => (c + 1) % visible.length)}
              className="text-[9px] font-bold text-amber-400/60 hover:text-amber-400 transition-colors px-1">
              {idx + 1}/{visible.length}
            </button>
          )}
          <button onClick={() => dismiss(ad.id)}
            className="p-0.5 rounded text-amber-400/40 hover:text-amber-400 transition-colors">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="flex items-start gap-2 pr-10">
          {ad.imageUrl ? (
            <img src={ad.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-sm flex-none">
              📢
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[8px] font-bold text-amber-400/60 uppercase tracking-wider">Reklama</span>
            </div>
            <p className="text-[11px] font-bold text-sidebar-foreground leading-tight truncate">{ad.title}</p>
            {ad.description && (
              <p className="text-[10px] text-sidebar-foreground/40 truncate mt-0.5">{ad.description}</p>
            )}
            {ad.linkUrl && (
              <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors mt-1">
                Batafsil <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
