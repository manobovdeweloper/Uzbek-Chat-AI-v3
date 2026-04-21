import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);

  const { messages, setMessages, streaming, isSending, send, reset } =
    useChatStream(conversationId);

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
      qc.invalidateQueries({
        queryKey: getListOpenaiConversationsQueryKey(),
      });
    }
    await send(content, id);
    qc.invalidateQueries({
      queryKey: getListOpenaiConversationsQueryKey(),
    });
  }, [input, isSending, conversationId, send, qc]);

  // Build inverted list data: streaming bubble first (newest), then reversed messages
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
        <Pressable
          onPress={() => setSheetOpen(true)}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Feather name="menu" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            O'zbek AI
          </Text>
        </View>
        <Pressable onPress={startNew} hitSlop={10} style={styles.iconBtn}>
          <Feather name="edit" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={styles.flex}
      >
        {showWelcome ? (
          <Welcome />
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
            renderItem={({ item }) => (
              <MessageBubble role={item.role} content={item.content} />
            )}
          />
        )}

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom:
                Platform.OS === "web" ? 16 : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Xabar yozing..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[
                styles.input,
                { color: colors.foreground },
              ]}
              editable={!isSending}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || isSending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor:
                    !input.trim() || isSending
                      ? colors.muted
                      : colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {isSending ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryForeground}
                />
              ) : (
                <Feather
                  name="arrow-up"
                  size={18}
                  color={
                    !input.trim()
                      ? colors.mutedForeground
                      : colors.primaryForeground
                  }
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
    </View>
  );
}

function Welcome() {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 28,
            fontFamily: "Inter_700Bold",
          }}
        >
          O'z
        </Text>
      </View>
      <Text
        style={[
          styles.welcomeTitle,
          { color: colors.foreground },
        ]}
      >
        Xush kelibsiz!
      </Text>
      <Text
        style={[
          styles.welcomeSub,
          { color: colors.mutedForeground },
        ]}
      >
        Men sizning shaxsiy sun'iy intellekt yordamchingizman.{"\n"}Qanday yordam
        bera olaman?
      </Text>
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
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
});
