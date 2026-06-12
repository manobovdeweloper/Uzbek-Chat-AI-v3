import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Crown, Copy, Check, Send, Sparkles, Infinity, Zap,
  FileText, Image as ImageIcon, Mic, ShieldCheck, Loader2, ArrowRight,
} from "lucide-react";
import { usePremium } from "@/contexts/premium-context";

const CARD_NUMBER = "5614 6818 5899 7095";
const TG_HANDLE = "@Manobov17";
const TG_URL = "https://t.me/Manobov17";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: Props) {
  const { activate, isPremium } = usePremium();
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setStep(1);
    setCode("");
    setError(null);
    setSuccess(false);
    onClose();
  };

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
        handleClose();
      }, 1400);
    } else {
      setError(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {/* Header */}
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
            <Button onClick={handleClose} className="w-full mt-2">Yopish</Button>
          </div>
        ) : step === 1 ? (
          /* ─── STEP 1: Payment info ─── */
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">1. To'lov qiling — $2 (~25 000 so'm)</div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Xavfsiz
                </span>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground mb-1">Karta raqami</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-lg tracking-wider tabular-nums">
                    {CARD_NUMBER}
                  </div>
                  <button
                    onClick={copyCard}
                    className="p-2 rounded-md hover:bg-background transition-colors"
                    aria-label="Nusxa olish"
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
              <div className="text-sm font-semibold mb-2">2. To'lov chekini Telegramga yuboring</div>
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#26A5E4] flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{TG_HANDLE}</div>
                    <div className="text-xs text-muted-foreground">To'lov skrinshotini yuboring</div>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold">→</span>
              </a>
              <p className="text-xs text-muted-foreground mt-2 px-1">
                To'lovni amalga oshirganingizdan so'ng skrinshot (chek) ni{" "}
                <span className="font-semibold text-foreground">{TG_HANDLE}</span> ga yuboring. Admin sizga aktivatsiya kodini yuboradi.
              </p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => setStep(2)}
            >
              To'lov qildim — Kodni kiritish
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* ─── STEP 2: Code input ─── */
          <div className="p-6 space-y-5">
            <div>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
                onClick={() => setStep(1)}
              >
                ← Orqaga
              </button>
              <div className="text-sm font-semibold mb-1">Aktivatsiya kodi</div>
              <p className="text-xs text-muted-foreground mb-3">
                Admin tomonidan yuborilgan 6 raqamli kodni kiriting.
              </p>
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
                  autoFocus
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

            <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#26A5E4] flex-shrink-0 flex items-center justify-center mt-0.5">
                <Send className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold mb-0.5">Hali to'lov qilmadingizmi?</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Karta: <span className="font-mono">{CARD_NUMBER}</span> ga to'lang va skrinshotni{" "}
                  <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">{TG_HANDLE}</a> ga yuboring.
                </p>
              </div>
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
