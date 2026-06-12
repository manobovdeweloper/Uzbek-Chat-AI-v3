import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useListOpenaiConversations,
  deleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  onNew: () => void;
  activeId: number | null;
};

export function ConversationsSheet({
  visible,
  onClose,
  onSelect,
  onNew,
  activeId,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading } = useListOpenaiConversations({
    query: { enabled: visible },
  });

  const handleDelete = async (id: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deleteOpenaiConversation(id);
    qc.invalidateQueries({
      queryKey: getListOpenaiConversationsQueryKey(),
    });
    if (activeId === id) onNew();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === "web" ? 16 : 8,
            },
          ]}
        >
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Tarix
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onNew();
            }}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Feather name="edit" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 24,
              paddingTop: 8,
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Feather
                  name="message-circle"
                  size={36}
                  color={colors.mutedForeground}
                />
                <Text
                  style={{
                    color: colors.mutedForeground,
                    marginTop: 10,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  Hozircha suhbatlar yo'q
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isActive = item.id === activeId;
              return (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: isActive
                        ? colors.muted
                        : pressed
                          ? colors.muted
                          : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name="message-square"
                    size={18}
                    color={isActive ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.rowText,
                      { color: colors.foreground },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    hitSlop={10}
                    style={styles.deleteBtn}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, minWidth: 32, alignItems: "center" },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: { padding: 6 },
});
