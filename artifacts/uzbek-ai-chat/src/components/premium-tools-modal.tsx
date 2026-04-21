import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image as ImageIcon, Mic, Upload, Sparkles, Lock } from "lucide-react";
import { usePremium } from "@/contexts/premium-context";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgradeRequest: () => void;
}

export function PremiumToolsModal({ open, onClose, onUpgradeRequest }: Props) {
  const { isPremium } = usePremium();
  const [tab, setTab] = useState("pdf");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Ilg'or AI vositalari
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pdf" data-testid="tab-pdf">
              <FileText className="w-4 h-4 mr-1.5" />PDF
            </TabsTrigger>
            <TabsTrigger value="image" data-testid="tab-image">
              <ImageIcon className="w-4 h-4 mr-1.5" />Rasm
            </TabsTrigger>
            <TabsTrigger value="voice" data-testid="tab-voice">
              <Mic className="w-4 h-4 mr-1.5" />Ovoz
            </TabsTrigger>
          </TabsList>

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
          <TabsContent value="image" className="mt-4">
            {isPremium ? (
              <ImageTool />
            ) : (
              <Locked
                title="AI Rasm Generator"
                desc="O'zbekcha matn yozing — AI siz uchun rasm yaratadi."
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
      {file && (
        <p className="text-xs text-muted-foreground text-center">
          Tahlil natijasi suhbatda paydo bo'ladi.
        </p>
      )}
    </div>
  );
}

function ImageTool() {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="space-y-3">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Masalan: Samarqanddagi quyosh botishi"
        data-testid="input-image-prompt"
      />
      <Button className="w-full" disabled={!prompt.trim()}>
        <ImageIcon className="w-4 h-4 mr-2" />
        Rasm yaratish
      </Button>
      <div className="aspect-square rounded-xl bg-muted/40 border border-border flex items-center justify-center text-sm text-muted-foreground">
        Yaratilgan rasm bu yerda paydo bo'ladi
      </div>
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
        AI sizning ovoziingizni eshitadi va ovozli javob qaytaradi.
      </p>
    </div>
  );
}
