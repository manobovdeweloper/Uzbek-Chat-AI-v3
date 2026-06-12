import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
const TG_HANDLE = "@Manobov17";
const TG_URL = "https://t.me/Manobov17";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function UpgradeModal({ visible, onClose }: Props) {
  const c = useColors();
  const { isPremium, activate } = usePremium();
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

  const copy = async () => {
    await Clipboard.setStringAsync(CARD_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: c.background, borderColor: c.border }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: c.card, borderColor: c.primary }]}>
              <View style={styles.headerTopRow}>
                <View style={[styles.crownPill, { backgroundColor: "rgba(0,240,255,0.12)", borderColor: c.primary }]}>
                  <Feather name="zap" size={12} color={c.primary} />
                  <Text style={[styles.crownPillText, { color: c.primary }]}>O'ZBEK AI PREMIUM</Text>
                </View>
                <Pressable onPress={handleClose} hitSlop={10}>
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
                  { icon: "infinity" as const, label: "Cheksiz HD rasmlar" },
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
            ) : step === 1 ? (
              /* ── STEP 1: Payment info ── */
              <View style={styles.body}>
                <View style={styles.stepRow}>
                  <Text style={[styles.stepLabel, { color: c.foreground }]}>1. To'lov qiling — $2 (~25 000 so'm)</Text>
                  <View style={[styles.verifiedBadge, { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.5)" }]}>
                    <Feather name="shield" size={10} color="rgb(16,185,129)" />
                    <Text style={styles.verifiedText}>Xavfsiz</Text>
                  </View>
                </View>
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

                <Text style={[styles.stepLabel, { color: c.foreground }]}>2. To'lov chekini Telegramga yuboring</Text>
                <Pressable
                  onPress={() => Linking.openURL(TG_URL)}
                  style={[styles.tgRow, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  <View style={[styles.tgIcon, { backgroundColor: "#26A5E4" }]}>
                    <Feather name="send" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tgHandle, { color: c.foreground }]}>{TG_HANDLE}</Text>
                    <Text style={[styles.tgSub, { color: c.mutedForeground }]}>To'lov skrinshotini yuboring</Text>
                  </View>
                  <Feather name="arrow-up-right" size={16} color={c.primary} />
                </Pressable>

                <Text style={[styles.hint, { color: c.mutedForeground }]}>
                  To'lovni amalga oshirganingizdan so'ng skrinshot (chek) ni {TG_HANDLE} ga yuboring. Admin sizga aktivatsiya kodini yuboradi.
                </Text>

                <Pressable
                  onPress={() => setStep(2)}
                  style={[styles.nextBtn, { backgroundColor: c.primary }]}
                >
                  <Text style={[styles.nextBtnText, { color: c.primaryForeground }]}>
                    To'lov qildim — Kodni kiritish
                  </Text>
                  <Feather name="arrow-right" size={16} color={c.primaryForeground} />
                </Pressable>
              </View>
            ) : (
              /* ── STEP 2: Code input ── */
              <View style={styles.body}>
                <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
                  <Feather name="arrow-left" size={14} color={c.mutedForeground} />
                  <Text style={[styles.backText, { color: c.mutedForeground }]}>Orqaga</Text>
                </Pressable>

                <Text style={[styles.stepLabel, { color: c.foreground }]}>Aktivatsiya kodi</Text>
                <Text style={[styles.hint, { color: c.mutedForeground }]}>
                  Admin tomonidan yuborilgan 6 raqamli kodni kiriting.
                </Text>

                <View style={styles.codeRow}>
                  <TextInput
                    value={code}
                    onChangeText={(v) => {
                      setCode(v.replace(/\D/g, "").slice(0, 6));
                      setError(null);
                    }}
                    placeholder="000000"
                    placeholderTextColor={c.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    style={[
                      styles.codeInput,
                      { backgroundColor: c.card, borderColor: c.border, color: c.foreground },
                    ]}
                  />
                  <Pressable
                    onPress={handleActivate}
                    disabled={code.length !== 6 || submitting}
                    style={[
                      styles.activateBtn,
                      {
                        backgroundColor: code.length === 6 && !submitting ? c.primary : c.muted,
                      },
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={c.primaryForeground} />
                    ) : (
                      <Text
                        style={[
                          styles.activateText,
                          { color: code.length === 6 ? c.primaryForeground : c.mutedForeground },
                        ]}
                      >
                        Tasdiqlash
                      </Text>
                    )}
                  </Pressable>
                </View>
                {error && <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>}
                {success && (
                  <Text style={[styles.successText, { color: c.primary }]}>✓ Premium faollashtirildi!</Text>
                )}

                {/* Reminder card */}
                <View style={[styles.reminderCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <View style={[styles.tgIcon, { backgroundColor: "#26A5E4" }]}>
                    <Feather name="send" size={14} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reminderTitle, { color: c.foreground }]}>Hali to'lov qilmadingizmi?</Text>
                    <Text style={[styles.reminderSub, { color: c.mutedForeground }]}>
                      Karta: {CARD_NUMBER} ga to'lang va skrinshotni {TG_HANDLE} ga yuboring.
                    </Text>
                  </View>
                </View>
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
  header: { margin: 16, padding: 18, borderRadius: 22, borderWidth: 1 },
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
  featureGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 10 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%" },
  featureText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  body: { paddingHorizontal: 16, gap: 10 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 6,
  },
  stepLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 14, marginBottom: 6 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    color: "rgb(16,185,129)",
  },
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

  hint: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 2 },

  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  nextBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 2 },
  backText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  codeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  codeInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 8,
    textAlign: "center",
  },
  activateBtn: { paddingHorizontal: 18, justifyContent: "center", borderRadius: 12, minWidth: 110, alignItems: "center" },
  activateText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 6 },
  successText: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 6 },

  reminderCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  reminderTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  reminderSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

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
