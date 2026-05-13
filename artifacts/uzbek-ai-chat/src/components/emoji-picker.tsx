import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

const CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "Tez", emojis: ["😊","👍","❤️","🔥","😂","🙏","✅","⭐","💡","📝","🎯","🚀"] },
  { label: "Yuz", emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🥰","😍","🤩","😘","😗","😙","😚","🙂","🤗","🤭","🤫","🤔","😐","😑","😬","🙄","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","😈","👿","💀","💩","🤡","👹","👺","👻","👾","🤖"] },
  { label: "Imo", emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","🤲","🙏","✍️","💪","🦵","🦶","👀","👁","👅","💋","💄"] },
  { label: "Tabiat", emojis: ["🌸","🌺","🌻","🌹","🌷","🍀","🌿","🍃","🌱","🌲","🌳","🌴","🌵","🎋","🎍","🍄","🐾","🌾","🌊","🌬","🌀","🌈","⚡","🔥","❄️","🌙","☀️","🌟","⭐","💫","✨"] },
  { label: "Ob-havo", emojis: ["⛅","🌤","☁️","🌧","⛈","🌩","🌨","❄️","🌪","🌫","🌊","🌀","🌈","☀️","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🪐","⭐","🌟","💫","✨","🌠","☄️"] },
  { label: "Hayvon", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🦂","🐢","🐍","🦎","🦕","🦖","🐙","🦑","🦐","🦞","🦀","🐡","🐟","🐠","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🐓","🦃","🦚","🦜","🦢","🦩","🕊"] },
  { label: "Ovqat", emojis: ["🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🫒","🫑","🥑","🍆","🥔","🥕","🌽","🌶","🥦","🥬","🥒","🍄","🧅","🧄","🌰","🍞","🥐","🥖","🫓","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫔","🌮","🌯","🫙","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍘","🍥","🥮","🍢","🧆","🥚","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊"] },
  { label: "Bayroq", emojis: ["🇺🇿","🇺🇸","🇬🇧","🇷🇺","🇩🇪","🇫🇷","🇯🇵","🇨🇳","🇰🇷","🇹🇷","🇸🇦","🇦🇪","🇮🇳","🇧🇷","🇨🇦","🇦🇺","🏳","🏴","🏁","🚩","🏳️‍🌈"] },
  { label: "Belgi", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☸️","✡️","🔯","🕎","☯️","☦️","⭐","🌟","💫","✨","🔥","💥","⚡","🌈","☁️","❄️","🌊","💧","🌙","☀️","⭕","✅","❌","❎","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔷","🔶","🔹","🔸","🔲","🔳","▪️","▫️","◾","◽","◼️","◻️","🔈","🔉","🔊","🔇","📢","📣","🔔","🔕","🎵","🎶","💤","🛑","⚠️","🚫","❗","❕","❓","❔","💯","🔞","🆕","🆙","🆒","🆓","🆖","🅰️","🅱️","🅾️","🆎"] },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(0);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const allEmojis = CATEGORIES.flatMap((c) => c.emojis);
  const searchResults = search.trim()
    ? allEmojis.filter((e) => e.includes(search))
    : null;

  const emojis = searchResults ?? CATEGORIES[cat].emojis;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-xl transition-all ${open ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
        title="Emoji"
      >
        <Smile className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 z-50 w-72 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Emoji qidirish..."
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted border-0 focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Category tabs */}
          {!search && (
            <div className="flex overflow-x-auto border-b border-border bg-muted/30">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => setCat(i)}
                  className={`flex-shrink-0 px-3 py-1.5 text-[11px] font-medium transition-colors ${cat === i ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-0 p-2 max-h-48 overflow-y-auto">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => { onSelect(e); setOpen(false); setSearch(""); }}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-lg hover:bg-muted transition-colors active:scale-90"
                title={e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
