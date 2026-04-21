import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
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

const CARD_NUMBER = "5614 6818 5899 7095";
const TG_HANDLE = "@manobov_deweloper";
const TG_URL = "https://t.me/manobov_deweloper";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function UpgradeModal({ visible, onClose }: Props) {
  const c = useColors();
  const { isPremium, activate } = usePremium();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(CARD_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleActivate = async () => {
    setError(null);
    const ok = await activate(code);
    if (ok) {
      setSuccess(true);
      setCode("");
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } else {
      setError("Faollashtirish kodi noto'g'ri.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: c.background, borderColor: c.border }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Glowing header */}
            <View style={[styles.header, { backgroundColor: c.card, borderColor: c.primary }]}>
              <View style={styles.headerTopRow}>
                <View style={[styles.crownPill, { backgroundColor: "rgba(0,240,255,0.12)", borderColor: c.primary }]}>
                  <Feather name="zap" size={12} color={c.primary} />
                  <Text style={[styles.crownPillText, { color: c.primary }]}>O'ZBEK AI PREMIUM</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Feather name="x" size={20} color={c.mutedForeground} />
                </Pressable>
              </View>
              <Text style={[styles.headerTitle, { color: c.foreground }]}>
                Cheksiz imkoniyatlarni oching
              </Text>
              <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
                Atigi $2/oy — eng zamonaviy AI asboblari qo'lingizda.
              </Text>

              <View style={styles.featureGrid}>
                {[
                  { icon: "infinity" as const, label: "Cheksiz xabarlar" },
                  { icon: "zap" as const, label: "Tezroq javoblar" },
                  { icon: "file-text" as const, label: "PDF tahlili" },
                  { icon: "image" as const, label: "Rasm yaratish" },
                  { icon: "mic" as const, label: "Ovozli suhbat" },
                  { icon: "star" as const, label: "Premium AI" },
                ].map((f) => (
                  <View key={f.label} style={styles.featureItem}>
                    <Feather name={f.icon} size={14} color={c.secondary} />
                    <Text style={[styles.featureText, { color: c.foreground }]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {isPremium ? (
              <View style={styles.body}>
                <View style={[styles.successBox, { backgroundColor: c.card, borderColor: c.primary }]}>
                  <Feather name="check-circle" size={32} color={c.primary} />
                  <Text style={[styles.bigTitle, { color: c.foreground }]}>Premium faol</Text>
                  <Text style={[styles.bodyText, { color: c.mutedForeground }]}>
                    Barcha ilg'or vositalardan foydalanishingiz mumkin.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.body}>
                {/* Step 1: Card */}
                <Text style={[styles.stepLabel, { color: c.foreground }]}>1. To'lov qiling — $2 (~25 000 so'm)</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[styles.cardLabel, { color: c.mutedForeground }]}>Karta raqami</Text>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardNumber, { color: c.foreground }]}>{CARD_NUMBER}</Text>
                    <Pressable onPress={copy} hitSlop={10} style={[styles.copyBtn, { borderColor: c.border }]}>
                      <Feather
                        name={copied ? "check" : "copy"}
                        size={16}
                        color={copied ? c.primary : c.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Step 2: Telegram */}
                <Text style={[styles.stepLabel, { color: c.foreground }]}>2. Skrinshotni adminga yuboring</Text>
                <Pressable
                  onPress={() => Linking.openURL(TG_URL)}
                  style={[styles.tgRow, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  <View style={[styles.tgIcon, { backgroundColor: "#26A5E4" }]}>
                    <Feather name="send" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tgHandle, { color: c.foreground }]}>{TG_HANDLE}</Text>
                    <Text style={[styles.tgSub, { color: c.mutedForeground }]}>Telegram'da ochish</Text>
                  </View>
                  <Feather name="arrow-up-right" size={16} color={c.primary} />
                </Pressable>

                {/* Step 3: Code */}
                <Text style={[styles.stepLabel, { color: c.foreground }]}>3. Admin yuborgan kodni kiriting</Text>
                <View style={styles.codeRow}>
                  <TextInput
                    value={code}
                    onChangeText={(v) => {
                      setCode(v);
                      setError(null);
                    }}
                    placeholder="MANOPOV..."
                    placeholderTextColor={c.mutedForeground}
                    autoCapitalize="characters"
                    style={[
                      styles.codeInput,
                      { backgroundColor: c.card, borderColor: c.border, color: c.foreground },
                    ]}
                  />
                  <Pressable
                    onPress={handleActivate}
                    disabled={!code.trim()}
                    style={[
                      styles.activateBtn,
                      {
                        backgroundColor: code.trim() ? c.primary : c.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activateText,
                        { color: code.trim() ? c.primaryForeground : c.mutedForeground },
                      ]}
                    >
                      Faollashtirish
                    </Text>
                  </Pressable>
                </View>
                {error && <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>}
                {success && (
                  <Text style={[styles.successText, { color: c.primary }]}>✓ Premium faollashtirildi!</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  header: {
    margin: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  crownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  crownPillText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 6 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 10,
  },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%" },
  featureText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  body: { paddingHorizontal: 16, gap: 10 },
  stepLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 14, marginBottom: 6 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1 },
  cardLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 6 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardNumber: { fontSize: 18, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  copyBtn: { padding: 8, borderRadius: 10, borderWidth: 1 },

  tgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  tgIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tgHandle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tgSub: { fontSize: 11, fontFamily: "Inter_400Regular" },

  codeRow: { flexDirection: "row", gap: 8 },
  codeInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  activateBtn: { paddingHorizontal: 16, justifyContent: "center", borderRadius: 12 },
  activateText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 6 },
  successText: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 6 },

  successBox: {
    alignItems: "center",
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  bigTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  bodyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
});
