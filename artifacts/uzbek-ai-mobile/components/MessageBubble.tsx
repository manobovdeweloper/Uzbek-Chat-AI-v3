import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export function MessageBubble({ role, content }: Props) {
  const colors = useColors();
  const isUser = role === "user";

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: colors.border,
            borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
            borderTopRightRadius: isUser ? 4 : 18,
            borderTopLeftRadius: isUser ? 18 : 4,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  text: {
    fontSize: 15.5,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
});
