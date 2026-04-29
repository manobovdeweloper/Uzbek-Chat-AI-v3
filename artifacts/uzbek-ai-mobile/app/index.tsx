import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useQueryClient } from "@tanstack/react-query";
import {
  createOpenaiConversation,
  getOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { MessageBubble } from "@/components/MessageBubble";
import { ConversationsSheet } from "@/components/ConversationsSheet";
import { useChatStream, ChatMessage } from "@/hooks/useChatStream";
import { usePremium } from "@/contexts/PremiumContext";
import { useImageLimit } from "@/hooks/useImageLimit";
import { UpgradeModal } from "@/components/UpgradeModal";
import { DailyLimitModal } from "@/components/DailyLimitModal";
import { ToolsSheet } from "@/components/ToolsSheet";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [imageLimitOpen, setImageLimitOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const { isPremium } = usePremium();
  const { remaining: imgRemaining, limit: imgLimit, resetsAt: imgResetsAt } = useImageLimit();

  const { messages, streaming, isSending, send, reset } = useChatStream(
    conversationId,
    isPremium ? "premium" : "free",
  );

  const startNew = useCallback(() => {
    setConversationId(null);
    reset([]);
    setSheetOpen(false);
  }, [reset]);

  const openConversation = useCallback(
    async (id: number) => {
      setSheetOpen(false);
      setLoadingConv(true);
      try {
        const conv = await getOpenaiConversation(id);
        const msgs: ChatMessage[] = conv.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setConversationId(id);
        reset(msgs);
      } finally {
        setLoadingConv(false);
      }
    },
    [reset],
  );

  // TEXT CHAT IS UNLIMITED FOR EVERYONE
  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let id = conversationId;
    if (!id) {
      const title = content.slice(0, 40) || "Yangi suhbat";
      const conv = await createOpenaiConversation({ title });
      id = conv.id;
      setConversationId(id);
      qc.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }
    await send(content, id);
    qc.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
  }, [input, isSending, conversationId, send, qc]);

  const listData = useMemo(() => {
    const arr: ChatMessage[] = [...messages];
    if (streaming) {
      arr.push({ id: "streaming", role: "assistant", content: streaming });
    }
    return arr.reverse();
  }, [messages, streaming]);

  const showWelcome = messages.length === 0 && !streaming && !loadingConv;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Pressable onPress={() => setSheetOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <Feather name="menu" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>O'zbek AI</Text>
          {isPremium ? (
            <View
              style={[
                styles.premiumPill,
                { backgroundColor: "rgba(0,240,255,0.12)", borderColor: colors.primary },
              ]}
            >
              <Feather name="zap" size={9} color={colors.primary} />
              <Text style={[styles.premiumPillText, { color: colors.primary }]}>PREMIUM</Text>
            </View>
          ) : (
            <Pressable onPress={() => setToolsOpen(true)}>
              <View
                style={[
                  styles.premiumPill,
                  { backgroundColor: "rgba(255,43,214,0.10)", borderColor: colors.secondary },
                ]}
              >
                <Feather name="image" size={9} color={colors.secondary} />
                <Text style={[styles.premiumPillText, { color: colors.secondary }]}>
                  RASM {imgRemaining}/{imgLimit}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => setToolsOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <Feather name="zap" size={20} color={colors.secondary} />
        </Pressable>
        <Pressable onPress={startNew} hitSlop={10} style={styles.iconBtn}>
          <Feather name="edit" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0} style={styles.flex}>
        {showWelcome ? (
          <Welcome
            onUpgrade={() => setUpgradeOpen(true)}
            onTools={() => setToolsOpen(true)}
            isPremium={isPremium}
          />
        ) : loadingConv ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={listData}
            inverted
            keyExtractor={(m) => String(m.id)}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 12 }}
            renderItem={({ item }) => <MessageBubble role={item.role} content={item.content} />}
          />
        )}

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: Platform.OS === "web" ? 16 : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Xabar yozing..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, { color: colors.foreground }]}
              editable={!isSending}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || isSending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor:
                    !input.trim() || isSending ? colors.muted : colors.primary,
                  opacity: pressed ? 0.7 : 1,
                  shadowColor: colors.primary,
                },
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Feather
                  name="arrow-up"
                  size={18}
                  color={!input.trim() ? colors.mutedForeground : colors.primaryForeground}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConversationsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={openConversation}
        onNew={startNew}
        activeId={conversationId}
      />

      <UpgradeModal visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <DailyLimitModal
        visible={imageLimitOpen}
        onClose={() => setImageLimitOpen(false)}
        onUpgrade={() => {
          setImageLimitOpen(false);
          setUpgradeOpen(true);
        }}
        resetsAt={imgResetsAt}
        limit={imgLimit}
      />
      <ToolsSheet
        visible={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onUpgrade={() => {
          setToolsOpen(false);
          setUpgradeOpen(true);
        }}
        onImageLimitReached={() => {
          setToolsOpen(false);
          setImageLimitOpen(true);
        }}
      />
    </View>
  );
}

function Welcome({
  onUpgrade,
  onTools,
  isPremium,
}: {
  onUpgrade: () => void;
  onTools: () => void;
  isPremium: boolean;
}) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <View
        style={[
          styles.avatarRing,
          { borderColor: c.primary, shadowColor: c.primary },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: c.card, borderColor: c.primary }]}>
          <Text style={{ color: c.primary, fontSize: 28, fontFamily: "Inter_700Bold" }}>O'z</Text>
        </View>
      </View>
      <Text style={[styles.welcomeTitle, { color: c.foreground }]}>Xush kelibsiz!</Text>
      <Text style={[styles.welcomeSub, { color: c.mutedForeground }]}>
        Men sizning shaxsiy sun'iy intellekt yordamchingizman.{"\n"}
        Cheksiz suhbatlashing — tekin va chegarasiz.
      </Text>

      <View style={styles.welcomeActions}>
        <Pressable
          onPress={onTools}
          style={[styles.welcomeChip, { borderColor: c.secondary, backgroundColor: "rgba(255,43,214,0.08)" }]}
        >
          <Feather name="zap" size={14} color={c.secondary} />
          <Text style={[styles.welcomeChipText, { color: c.secondary }]}>Ilg'or vositalar</Text>
        </Pressable>
        {!isPremium && (
          <Pressable
            onPress={onUpgrade}
            style={[styles.welcomeChip, { borderColor: c.primary, backgroundColor: "rgba(0,240,255,0.08)" }]}
          >
            <Feather name="star" size={14} color={c.primary} />
            <Text style={[styles.welcomeChipText, { color: c.primary }]}>Premiumga o'tish</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 8, minWidth: 38, alignItems: "center" },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 3,
  },
  premiumPillText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 44,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  welcomeTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8 },
  welcomeSub: {
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  welcomeActions: { flexDirection: "row", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "center" },
  welcomeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  welcomeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingTop: Platform.OS === "ios" ? 8 : 4,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
