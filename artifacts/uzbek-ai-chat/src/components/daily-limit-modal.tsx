import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Crown, Sparkles } from "lucide-react";

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h} soat ${m} daqiqa`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  resetsAt: number;
  limit: number;
}

export function DailyLimitModal({ open, onClose, onUpgrade, resetsAt, limit }: Props) {
  const remainingMs = resetsAt - Date.now();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0 border-0">
        <div className="relative bg-gradient-to-br from-primary via-primary to-secondary/80 p-6 text-primary-foreground">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary blur-3xl" />
          </div>
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-4 mx-auto">
              <Clock className="w-7 h-7 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-center mb-1">
              Kunlik limitga yetdingiz
            </h2>
            <p className="text-sm text-center text-primary-foreground/85">
              Bepul tarif kuniga {limit} ta xabar bilan cheklangan.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Yangi xabarlar shu vaqtdan keyin:</div>
            <div className="text-base font-semibold text-foreground">
              {formatCountdown(remainingMs)}
            </div>
          </div>

          <Button
            onClick={onUpgrade}
            className="w-full h-11 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold gap-2"
            data-testid="button-upgrade-from-limit"
          >
            <Crown className="w-4 h-4" />
            Premiumga o'tish — $2/oy
            <Sparkles className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
            data-testid="button-dismiss-limit"
          >
            Keyinroq
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
