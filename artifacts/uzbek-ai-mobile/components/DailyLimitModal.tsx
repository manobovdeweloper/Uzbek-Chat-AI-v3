import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h} soat ${m} daqiqa`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  resetsAt: number;
  limit: number;
}

export function DailyLimitModal({
  visible,
  onClose,
  onUpgrade,
  resetsAt,
  limit,
}: Props) {
  const c = useColors();
  const remainingMs = resetsAt - Date.now();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.box,
            { backgroundColor: c.background, borderColor: c.secondary },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: "rgba(255,43,214,0.15)", borderColor: c.secondary },
            ]}
          >
            <Feather name="image" size={28} color={c.secondary} />
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>
            Kunlik rasm limiti tugadi
          </Text>
          <Text style={[styles.sub, { color: c.mutedForeground }]}>
            Bepul tarif kuniga {limit} ta rasm bilan cheklangan.{"\n"}
            Premium — cheksiz HD rasmlar.
          </Text>

          <View style={[styles.countdown, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.countdownLabel, { color: c.mutedForeground }]}>
              Yangi rasmlar shu vaqtdan keyin:
            </Text>
            <Text style={[styles.countdownValue, { color: c.foreground }]}>
              {formatCountdown(remainingMs)}
            </Text>
          </View>

          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="zap" size={16} color={c.primaryForeground} />
            <Text style={[styles.primaryText, { color: c.primaryForeground }]}>
              Premiumga o'tish — $2/oy
            </Text>
          </Pressable>

          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[styles.dismissText, { color: c.mutedForeground }]}>Keyinroq</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  countdown: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 6,
  },
  countdownLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4 },
  countdownValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 46,
    borderRadius: 14,
  },
  primaryText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  dismissText: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
});
