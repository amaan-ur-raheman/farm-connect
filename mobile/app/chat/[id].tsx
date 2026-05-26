import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Camera, Send, MessageSquare } from "lucide-react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "../../src/components/ui/Header";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useUserStore, useSocketStore } from "../../src/stores";
import api, { ChatMessage } from "../../src/config/api";
import { useAuthStore } from "../../src/stores/authStore";
import { haptic } from "../../src/utils/haptics";
import { colors, spacing, radii, typography, theme, getShadow } from "../../src/config/theme";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useUserStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocketStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputTextHeight] = useState(48);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    avatar: string;
  }>({ name: "User", avatar: "" });
  const scrollViewRef = useRef<ScrollView>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  // Keyboard event listeners
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardDidShowListener = Keyboard.addListener(
      showEvent,
      (e) => {
        const kbHeight = e.endCoordinates.height;
        console.log("[Chat] Keyboard SHOW - height:", kbHeight, "platform:", Platform.OS);
        setKeyboardHeight(kbHeight);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      hideEvent,
      () => {
        console.log("[Chat] Keyboard HIDE");
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const convRes = await api.get<{
        participant_one: { id: string; name: string | null; avatar_url: string | null };
        participant_two: { id: string; name: string | null; avatar_url: string | null };
      }>(`/api/chat/conversations/${id}`);
      const conversation = convRes.data.data || convRes.data;

      const currentUserId = authUser?.id;
      const participantOne = conversation.participant_one;
      const participantTwo = conversation.participant_two;

      const otherParticipant = participantOne?.id === currentUserId
        ? participantTwo
        : participantOne;

      if (otherParticipant) {
        setOtherUser({
          name: otherParticipant.name || "User",
          avatar: otherParticipant.avatar_url || `https://i.pravatar.cc/100?u=${otherParticipant.id}`,
        });
      }

      const res = await api.get<{ data: ChatMessage[] }>(`/api/chat/conversations/${id}/messages`);
      const data: ChatMessage[] = res.data.data || [];
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch chat data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, authUser?.id]);

  useEffect(() => {
    fetchMessages();

    if (!socket) return;

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.conversation_id === id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, [id, socket, fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    haptic.light();
    const text = inputText.trim();
    setInputText("");
    setInputTextHeight(48);
    setSending(true);
    try {
      await api.post(`/api/chat/conversations/${id}/messages`, { text });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (msg: ChatMessage) => msg.sender_id === authUser?.id;

  const styles = getStyles(isDark);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <Header
        variant="back-avatar"
        userName={otherUser.name}
        userStatus="Online"
        userAvatar={otherUser.avatar}
        onActionPress={() => {}}
      />

      <View style={styles.flex1}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={t.primary} />
            </View>
          ) : (
            <>
              <ScrollView
                ref={scrollViewRef}
                style={styles.flex1}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
                onContentSizeChange={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: false })
                }
              >
                {messages.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No messages yet"
                    description="Say hello to start the conversation!"
                  />
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = isOwnMessage(msg);
                    const showTimestamp =
                      index === 0 ||
                      new Date(msg.created_at).getTime() -
                        new Date(messages[index - 1].created_at).getTime() >
                        300000;

                    return (
                      <View key={msg.id}>
                        {showTimestamp && (
                          <View style={styles.timestampContainer}>
                            <View style={styles.timestampBadge}>
                              <Text style={styles.timestampText}>
                                {new Date(msg.created_at).toLocaleDateString()}{" "}
                                {formatTime(msg.created_at)}
                              </Text>
                            </View>
                          </View>
                        )}
                        <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
                          {!isOwn && (
                            <View style={styles.avatarContainer}>
                              <Image
                                source={{
                                  uri: otherUser.avatar || "https://i.pravatar.cc/100?u=farmer",
                                }}
                                style={styles.avatarImage}
                              />
                            </View>
                          )}

                          <View style={styles.messageBubbleWrapper}>
                            <View
                              style={[
                                styles.messageBubble,
                                isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                              ]}
                            >
                              {msg.text && (
                                <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : null]}>
                                  {msg.text}
                                </Text>
                              )}
                              {msg.media_url && (
                                <View style={styles.mediaContainer}>
                                  <Image
                                    source={{ uri: msg.media_url }}
                                    style={styles.mediaImage}
                                    resizeMode="cover"
                                  />
                                </View>
                              )}
                            </View>
                          </View>

                          {isOwn && (
                            <View style={styles.avatarContainerOwn}>
                              <Image
                                source={{
                                  uri: profile?.avatar || `https://i.pravatar.cc/100?u=${authUser?.id}`,
                                }}
                                style={styles.avatarImage}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={[styles.inputArea, { paddingBottom: spacing.sm + keyboardHeight }]}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.attachmentButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Attach photo"
                    accessibilityRole="button"
                  >
                    <Camera size={20} color={t.textSecondary} strokeWidth={2.2} />
                  </TouchableOpacity>

                  <View style={styles.textInputContainer}>
                    <TextInput
                      placeholder="Message..."
                      placeholderTextColor={t.inputPlaceholder}
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      onContentSizeChange={(e) => {
                        const newHeight = Math.min(120, Math.max(48, e.nativeEvent.contentSize.height + 10));
                        setInputTextHeight(newHeight);
                        if (newHeight > 48) {
                          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
                        }
                      }}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
                      }}
                      style={[styles.textInput, { height: inputHeight }]}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                    style={[
                      styles.sendButton,
                      inputText.trim()
                        ? { backgroundColor: colors.primary[600], ...getShadow("md", isDark) }
                        : { backgroundColor: isDark ? colors.neutral[700] : colors.neutral[300] },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Send message"
                    accessibilityRole="button"
                  >
                    <Send size={22} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const t = isDark ? theme.dark : theme.light;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.background,
    },
    flex1: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    timestampContainer: {
      alignItems: "center",
      marginVertical: spacing.md,
    },
    timestampBadge: {
      backgroundColor: isDark ? "rgba(42, 56, 42, 0.5)" : "rgba(229, 229, 229, 0.5)",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
    },
    timestampText: {
      ...typography.captionXs,
      fontWeight: "900",
      color: t.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    messageRowOwn: {
      justifyContent: "flex-end",
    },
    messageRowOther: {
      justifyContent: "flex-start",
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
    },
    avatarContainerOwn: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      borderWidth: 2,
      borderColor: t.primary,
      overflow: "hidden",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    messageBubbleWrapper: {
      maxWidth: "80%",
    },
    messageBubble: {
      padding: spacing.md,
      ...getShadow("sm", isDark),
    },
    messageBubbleOwn: {
      backgroundColor: t.primary,
      borderRadius: radii.xl,
      borderBottomRightRadius: 0,
    },
    messageBubbleOther: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radii.xl,
      borderBottomLeftRadius: 0,
    },
    messageText: {
      ...typography.body,
      lineHeight: 24 * 1.1,
      fontWeight: "700",
      color: t.text,
    },
    messageTextOwn: {
      color: t.onPrimary,
    },
    mediaContainer: {
      width: "100%",
      aspectRatio: 4 / 3,
      borderRadius: radii.lg,
      overflow: "hidden",
      marginTop: spacing.md,
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50],
      borderWidth: 1,
      borderColor: t.border,
    },
    mediaImage: {
      width: "100%",
      height: "100%",
    },
    inputArea: {
      backgroundColor: t.surface,
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
    },
    attachmentButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.lg,
      backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
      borderWidth: 1,
      borderColor: t.border,
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: isDark ? colors.neutral[900] : colors.neutral[50],
      borderRadius: radii["2xl"],
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      flexDirection: "row",
      alignItems: "flex-end",
      borderWidth: 1,
      borderColor: t.border,
    },
    textInput: {
      flex: 1,
      ...typography.bodySm,
      fontWeight: "600",
      color: t.inputText,
      paddingVertical: spacing.sm,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
  });
};
