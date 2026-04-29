import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Crown, Copy, Check, Send, Sparkles, Infinity, Zap,
  FileText, Image as ImageIcon, Mic, ShieldCheck, Loader2,
} from "lucide-react";
import { usePremium } from "@/contexts/premium-context";

const CARD_NUMBER = "5614 6818 5899 7095";
const TG_HANDLE = "@manobov_deweloper";
const TG_URL = "https://t.me/manobov_deweloper";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: Props) {
  const { activate, isPremium } = usePremium();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleActivate = async () => {
    setError(null);
    setSubmitting(true);
    const err = await activate(code);
    setSubmitting(false);
    if (!err) {
      setSuccess(true);
      setCode("");
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } else {
      setError(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-secondary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                O'zbek AI Premium
              </span>
            </div>
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-2xl font-bold text-primary-foreground">
                Cheksiz imkoniyatlarni oching
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Atigi $2/oy — eng zamonaviy AI asboblari qo'lingizda.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <Feature icon={<Infinity className="w-4 h-4" />} label="Cheksiz rasmlar" />
              <Feature icon={<Zap className="w-4 h-4" />} label="HD AI modellar" />
              <Feature icon={<FileText className="w-4 h-4" />} label="PDF tahlili" />
              <Feature icon={<ImageIcon className="w-4 h-4" />} label="Rasm yaratish" />
              <Feature icon={<Mic className="w-4 h-4" />} label="Ovozli suhbat" />
              <Feature icon={<Sparkles className="w-4 h-4" />} label="Workspace" />
            </div>
          </div>
        </div>

        {isPremium ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-secondary/20 mx-auto flex items-center justify-center">
              <Crown className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold">Siz allaqachon Premium foydalanuvchisiz</h3>
            <p className="text-sm text-muted-foreground">
              Barcha ilg'or vositalardan foydalanishingiz mumkin.
            </p>
            <Button onClick={onClose} className="w-full mt-2">Yopish</Button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">1. To'lov qiling — $2</div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Tasdiqlangan
                </span>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground mb-1">Karta raqami · ~25 000 so'm</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-lg tracking-wider tabular-nums">
                    {CARD_NUMBER}
                  </div>
                  <button
                    onClick={copyCard}
                    className="p-2 rounded-md hover:bg-background transition-colors"
                    aria-label="Nusxa olish"
                    data-testid="button-copy-card"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">2. Telegram orqali tasdiqlang</div>
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4 hover:bg-muted transition-colors"
                data-testid="link-telegram-admin"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#26A5E4] flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{TG_HANDLE}</div>
                    <div className="text-xs text-muted-foreground">Skrinshotni yuboring va kodni so'rang</div>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold">→</span>
              </a>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">3. 6 raqamli aktivatsiya kodini kiriting</div>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  className="font-mono text-lg tracking-[0.4em] text-center tabular-nums"
                  data-testid="input-activation-code"
                />
                <Button
                  onClick={handleActivate}
                  disabled={code.length !== 6 || submitting}
                  data-testid="button-activate"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tasdiqlash"}
                </Button>
              </div>
              {error && <p className="text-xs text-destructive mt-2">{error}</p>}
              {success && (
                <p className="text-xs text-green-600 mt-2 font-semibold">
                  ✓ Premium faollashtirildi!
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-primary-foreground/95">
      <span className="text-secondary">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
