import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Image as ImageIcon, Mic, Upload, Sparkles, Lock, Loader2, AlertCircle,
} from "lucide-react";
import { usePremium } from "@/contexts/premium-context";
import { useImageLimit } from "@/hooks/use-image-limit";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgradeRequest: () => void;
  onImageLimitReached: () => void;
  initialTab?: "pdf" | "image" | "voice";
}

export function PremiumToolsModal({
  open,
  onClose,
  onUpgradeRequest,
  onImageLimitReached,
  initialTab = "image",
}: Props) {
  const { isPremium } = usePremium();
  const [tab, setTab] = useState<"pdf" | "image" | "voice">(initialTab);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Ilg'or AI vositalari
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="image" data-testid="tab-image">
              <ImageIcon className="w-4 h-4 mr-1.5" />Rasm
            </TabsTrigger>
            <TabsTrigger value="pdf" data-testid="tab-pdf">
              <FileText className="w-4 h-4 mr-1.5" />PDF
            </TabsTrigger>
            <TabsTrigger value="voice" data-testid="tab-voice">
              <Mic className="w-4 h-4 mr-1.5" />Ovoz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4">
            {/* Image generation is available to ALL users (with daily limit for free) */}
            <ImageTool
              isPremium={isPremium}
              onLimitReached={onImageLimitReached}
            />
          </TabsContent>
          <TabsContent value="pdf" className="mt-4">
            {isPremium ? (
              <PdfTool />
            ) : (
              <Locked
                title="PDF Tahlilchi"
                desc="PDF fayllaringizni yuklang va AI ulardan kerakli ma'lumotni topib, qisqacha taqdim qiladi."
                onUpgrade={onUpgradeRequest}
              />
            )}
          </TabsContent>
          <TabsContent value="voice" className="mt-4">
            {isPremium ? (
              <VoiceTool />
            ) : (
              <Locked
                title="Ovozli Suhbat"
                desc="AI bilan ovoz orqali suhbatlashing — gapiring va eshiting."
                onUpgrade={onUpgradeRequest}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Locked({ title, desc, onUpgrade }: { title: string; desc: string; onUpgrade: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-secondary/20 mx-auto flex items-center justify-center">
        <Lock className="w-5 h-5 text-secondary" />
      </div>
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
      <div className="text-xs uppercase tracking-wider text-secondary font-semibold">
        Faqat Premium foydalanuvchilar uchun
      </div>
      <Button onClick={onUpgrade} className="w-full" data-testid="button-tool-upgrade">
        Premiumga o'tish — $2/oy
      </Button>
    </div>
  );
}

function PdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors p-8 text-center cursor-pointer"
      >
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <div className="text-sm font-medium">
          {file ? file.name : "PDF faylni yuklash uchun bosing"}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Maksimal 25 MB</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          data-testid="input-pdf-file"
        />
      </div>
      <Button className="w-full" disabled={!file}>
        AI bilan tahlil qilish
      </Button>
    </div>
  );
}

function ImageTool({
  isPremium,
  onLimitReached,
}: {
  isPremium: boolean;
  onLimitReached: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { remaining, limitReached, increment, limit, count } = useImageLimit();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isPremium && limitReached) {
      onLimitReached();
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch("/api/openai/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) {
        setError(data.error ?? "Rasm yaratib bo'lmadi.");
        return;
      }
      setImageUrl(data.dataUrl);
      if (!isPremium) increment();
    } catch {
      setError("Tarmoq xatosi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Credits header */}
      <div className="flex items-center justify-between text-xs">
        {isPremium ? (
          <span className="inline-flex items-center gap-1 font-semibold text-secondary">
            <Sparkles className="w-3 h-3" />
            HD AI · Cheksiz
          </span>
        ) : (
          <span className="text-muted-foreground">
            Bugungi rasmlar: <span className="font-semibold text-foreground">{count}/{limit}</span>
          </span>
        )}
        {!isPremium && remaining === 0 && (
          <span className="inline-flex items-center gap-1 text-secondary font-semibold">
            <AlertCircle className="w-3 h-3" />
            Limit tugadi
          </span>
        )}
      </div>

      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Masalan: Samarqanddagi quyosh botishi"
        data-testid="input-image-prompt"
      />
      <Button
        className="w-full gap-2"
        disabled={!prompt.trim() || loading}
        onClick={handleGenerate}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> AI yaratmoqda...
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4" /> Rasm yaratish
          </>
        )}
      </Button>

      <div className="aspect-square rounded-xl bg-muted/40 border border-border flex items-center justify-center text-sm text-muted-foreground overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse flex items-center justify-center">
            <span className="text-xs">AI sehri ishga tushdi...</span>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={prompt} className="w-full h-full object-cover" />
        ) : (
          <span className="px-4 text-center">Yaratilgan rasm bu yerda paydo bo'ladi</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function VoiceTool() {
  const [recording, setRecording] = useState(false);
  return (
    <div className="space-y-3 text-center">
      <button
        onClick={() => setRecording((r) => !r)}
        className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
          recording
            ? "bg-destructive text-destructive-foreground scale-110 animate-pulse"
            : "bg-primary text-primary-foreground hover:scale-105"
        }`}
        data-testid="button-voice-record"
      >
        <Mic className="w-10 h-10" />
      </button>
      <div className="text-sm font-semibold">
        {recording ? "Eshityapman..." : "Gapirishni boshlash uchun bosing"}
      </div>
      <p className="text-xs text-muted-foreground">
        AI sizning ovozingizni eshitadi va ovozli javob qaytaradi.
      </p>
    </div>
  );
}
