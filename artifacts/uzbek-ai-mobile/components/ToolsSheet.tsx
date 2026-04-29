import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/contexts/PremiumContext";
import { useImageLimit } from "@/hooks/useImageLimit";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

type Tab = "image" | "pdf" | "voice";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onImageLimitReached: () => void;
}

export function ToolsSheet({ visible, onClose, onUpgrade, onImageLimitReached }: Props) {
  const c = useColors();
  const { isPremium } = usePremium();
  const [tab, setTab] = useState<Tab>("image");

  const tabs: { key: Tab; icon: keyof typeof Feather.glyphMap; label: string }[] = [
    { key: "image", icon: "image", label: "Rasm" },
    { key: "pdf", icon: "file-text", label: "PDF" },
    { key: "voice", icon: "mic", label: "Ovoz" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: c.background, borderColor: c.border },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="zap" size={18} color={c.primary} />
              <Text style={[styles.headerTitle, { color: c.foreground }]}>
                Ilg'or AI vositalari
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color={c.mutedForeground} />
            </Pressable>
          </View>

          <View style={[styles.tabs, { backgroundColor: c.card, borderColor: c.border }]}>
            {tabs.map((t) => {
              const active = t.key === tab;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.tab, active && { backgroundColor: c.primary }]}
                >
                  <Feather name={t.icon} size={14} color={active ? c.primaryForeground : c.foreground} />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: active ? c.primaryForeground : c.foreground },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {tab === "image" ? (
              <ImageTool isPremium={isPremium} onLimitReached={onImageLimitReached} />
            ) : tab === "pdf" ? (
              isPremium ? <PdfTool /> : <LockedTool kind="pdf" onUpgrade={onUpgrade} />
            ) : isPremium ? (
              <VoiceTool />
            ) : (
              <LockedTool kind="voice" onUpgrade={onUpgrade} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const TOOL_INFO: Record<"pdf" | "voice", { title: string; desc: string }> = {
  pdf: {
    title: "PDF Tahlilchi",
    desc: "PDF fayllaringizni yuklang va AI ulardan kerakli ma'lumotni topib, qisqacha taqdim qiladi.",
  },
  voice: {
    title: "Ovozli Suhbat",
    desc: "AI bilan ovoz orqali suhbatlashing — gapiring va eshiting.",
  },
};

function LockedTool({ kind, onUpgrade }: { kind: "pdf" | "voice"; onUpgrade: () => void }) {
  const c = useColors();
  const info = TOOL_INFO[kind];
  return (
    <View style={[styles.lockedBox, { backgroundColor: c.card, borderColor: c.border }]}>
      <View
        style={[
          styles.lockIcon,
          { backgroundColor: "rgba(255,43,214,0.12)", borderColor: c.secondary },
        ]}
      >
        <Feather name="lock" size={20} color={c.secondary} />
      </View>
      <Text style={[styles.lockedTitle, { color: c.foreground }]}>{info.title}</Text>
      <Text style={[styles.lockedDesc, { color: c.mutedForeground }]}>{info.desc}</Text>
      <Text style={[styles.lockedTag, { color: c.secondary }]}>
        FAQAT PREMIUM FOYDALANUVCHILAR UCHUN
      </Text>
      <Pressable
        onPress={onUpgrade}
        style={({ pressed }) => [
          styles.upgradeBtn,
          { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Feather name="zap" size={14} color={c.primaryForeground} />
        <Text style={[styles.upgradeText, { color: c.primaryForeground }]}>
          Premiumga o'tish — $2/oy
        </Text>
      </Pressable>
    </View>
  );
}

function PdfTool() {
  const c = useColors();
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.dashBox, { borderColor: c.border, backgroundColor: c.card }]}>
        <Feather name="upload" size={28} color={c.mutedForeground} />
        <Text style={[styles.dashLabel, { color: c.foreground }]}>
          PDF faylni yuklash uchun bosing
        </Text>
        <Text style={[styles.dashSub, { color: c.mutedForeground }]}>Maksimal 25 MB</Text>
      </View>
      <Pressable style={[styles.actionBtn, { backgroundColor: c.primary }]}>
        <Text style={[styles.actionText, { color: c.primaryForeground }]}>AI bilan tahlil qilish</Text>
      </Pressable>
    </View>
  );
}

function ImageTool({
  isPremium,
  onLimitReached,
}: {
  isPremium: boolean;
  onLimitReached: () => void;
}) {
  const c = useColors();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { remaining, limit, count, limitReached, increment } = useImageLimit();

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    if (!isPremium && limitReached) {
      onLimitReached();
      return;
    }
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch(`${BASE_URL}/api/openai/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        dataUrl?: string;
        error?: string;
      };
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
    <View style={{ gap: 12 }}>
      <View style={styles.creditsRow}>
        {isPremium ? (
          <View style={[styles.creditPill, { backgroundColor: "rgba(0,240,255,0.10)", borderColor: c.primary }]}>
            <Feather name="zap" size={11} color={c.primary} />
            <Text style={[styles.creditPillText, { color: c.primary }]}>HD AI · CHEKSIZ</Text>
          </View>
        ) : (
          <Text style={[styles.creditText, { color: c.mutedForeground }]}>
            Bugungi rasmlar:{" "}
            <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold" }}>
              {count}/{limit}
            </Text>
          </Text>
        )}
        {!isPremium && limitReached && (
          <View style={[styles.creditPill, { backgroundColor: "rgba(255,43,214,0.12)", borderColor: c.secondary }]}>
            <Feather name="alert-circle" size={10} color={c.secondary} />
            <Text style={[styles.creditPillText, { color: c.secondary }]}>LIMIT TUGADI</Text>
          </View>
        )}
      </View>

      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Masalan: Samarqanddagi quyosh botishi"
        placeholderTextColor={c.mutedForeground}
        style={[
          styles.textInput,
          { backgroundColor: c.card, borderColor: c.border, color: c.foreground },
        ]}
      />
      <Pressable
        onPress={handleGenerate}
        disabled={!prompt.trim() || loading}
        style={[
          styles.actionBtn,
          { backgroundColor: prompt.trim() && !loading ? c.primary : c.muted },
        ]}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color={c.primaryForeground} />
            <Text style={[styles.actionText, { color: c.primaryForeground }]}>AI yaratmoqda...</Text>
          </>
        ) : (
          <>
            <Feather
              name="image"
              size={16}
              color={prompt.trim() ? c.primaryForeground : c.mutedForeground}
            />
            <Text
              style={[
                styles.actionText,
                { color: prompt.trim() ? c.primaryForeground : c.mutedForeground },
              ]}
            >
              Rasm yaratish
            </Text>
          </>
        )}
      </Pressable>
      <View style={[styles.previewBox, { backgroundColor: c.card, borderColor: c.border }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.previewImg} resizeMode="cover" />
        ) : (
          <Text style={[styles.previewText, { color: c.mutedForeground }]}>
            {loading ? "AI sehri ishga tushdi..." : "Yaratilgan rasm bu yerda paydo bo'ladi"}
          </Text>
        )}
      </View>
      {error && (
        <Text style={[styles.errorTxt, { color: c.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

function VoiceTool() {
  const c = useColors();
  const [recording, setRecording] = useState(false);
  return (
    <View style={{ gap: 16, alignItems: "center", paddingVertical: 12 }}>
      <Pressable
        onPress={() => setRecording((r) => !r)}
        style={({ pressed }) => [
          styles.micBtn,
          {
            backgroundColor: recording ? c.destructive : c.primary,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="mic" size={36} color={recording ? "#fff" : c.primaryForeground} />
      </Pressable>
      <Text style={[styles.voiceState, { color: c.foreground }]}>
        {recording ? "Eshityapman..." : "Gapirishni boshlash uchun bosing"}
      </Text>
      <Text style={[styles.voiceHint, { color: c.mutedForeground }]}>
        AI sizning ovozingizni eshitadi va ovozli javob qaytaradi.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  lockedBox: { padding: 22, borderRadius: 18, borderWidth: 1, alignItems: "center", gap: 10 },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  lockedDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  lockedTag: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginTop: 4 },
  upgradeBtn: {
    marginTop: 8,
    width: "100%",
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  upgradeText: { fontSize: 14, fontFamily: "Inter_700Bold" },

  dashBox: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 8,
  },
  dashLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dashSub: { fontSize: 11.5, fontFamily: "Inter_400Regular" },

  actionBtn: {
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  previewBox: {
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  previewText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  creditsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 22,
  },
  creditText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  creditPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  creditPillText: { fontSize: 9.5, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  errorTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },

  micBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceState: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  voiceHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
