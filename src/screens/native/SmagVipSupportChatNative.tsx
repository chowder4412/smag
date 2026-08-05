import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Pressable, StyleSheet, Text, TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addDoc, collection, doc, onSnapshot,
  orderBy, query, serverTimestamp, setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { useAppRouter } from "@/lib/useAppRouter";

type Message = { id: string; from: "user" | "agent"; text: string; createdAt: string };

const quickReplies = ["Call rider", "Update address", "Cancel order", "Rate concierge"];

export function SmagVipSupportChatNative() {
  const router = useAppRouter();
  const user = getCurrentUser();
  const sessionId = user?.uid ?? "anonymous";
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ensure session doc exists
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void setDoc(doc(db, "vip_chat_sessions", sessionId), {
      userId: user.uid,
      updatedAt: serverTimestamp(),
      unread: 0
    }, { merge: true });
  }, [user, sessionId]);

  // Subscribe to messages
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "vip_chat_sessions", sessionId, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({
          id: d.id,
          from: d.data().from as "user" | "agent",
          text: String(d.data().text ?? ""),
          createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? ""
        })));
        setError("");
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
      () => {
        setError("Support chat is unavailable for this account right now.");
        setLoading(false);
      }
    );
  }, [sessionId, user]);

  async function sendMessage(messageText: string) {
    const trimmed = messageText.trim();
    if (!trimmed || !user) return;
    setSending(true);
    setText("");
    try {
      await addDoc(collection(db, "vip_chat_sessions", sessionId, "messages"), {
        from: "user",
        text: trimmed,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      // Update session last message + unread count for concierge
      await setDoc(doc(db, "vip_chat_sessions", sessionId), {
        lastMessage: trimmed,
        updatedAt: serverTimestamp(),
        unread: messages.filter(m => m.from === "user").length + 1
      }, { merge: true });
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#a33800" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>VIP Support Chat</Text>
          <Text style={styles.subtitle}>Online now</Text>
        </View>
        <View style={styles.iconBtn}>
          <MaterialIcons name="support-agent" size={20} color="#a33800" />
        </View>
      </View>

      <View style={styles.notice}>
        <MaterialIcons name="verified-user" size={16} color="#805032" />
        <Text style={styles.noticeText}>Priority support for active orders</Text>
      </View>

      {!user ? (
        <View style={styles.center}>
          <MaterialIcons name="lock-outline" size={40} color="#ffdbc9" />
          <Text style={styles.emptyText}>Sign in to chat with support</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.push("/smag_login")}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator color="#a33800" /></View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color="#ffdbc9" />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="chat-bubble-outline" size={48} color="#ffdbc9" />
              <Text style={styles.emptyText}>Send a message to start the conversation</Text>
              <Text style={styles.emptySub}>Our concierge team typically responds within 2 minutes</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.message, item.from === "user" ? styles.messageUser : styles.messageAgent]}>
              <Text style={[styles.messageText, item.from === "user" && styles.messageTextUser]}>
                {item.text}
              </Text>
            </View>
          )}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.footer}>
          <View style={styles.quickRow}>
            {quickReplies.map((item) => (
              <Pressable
                key={item}
                style={styles.quickChip}
                onPress={() => {
                  if (item === "Rate concierge") { router.push("/smag_rate_concierge"); return; }
                  void sendMessage(item);
                }}
              >
                <Text style={styles.quickChipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.composeRow}>
            <TextInput
              style={styles.composeInput}
              value={text}
              onChangeText={setText}
              placeholder="Type your message..."
              placeholderTextColor="#80503299"
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
              onPress={() => sendMessage(text)}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#ffefeb" />
                : <MaterialIcons name="send" size={14} color="#ffefeb" />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  title: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  subtitle: { color: "#805032", fontSize: 11, fontWeight: "700" },
  notice: { alignSelf: "center", borderRadius: 999, backgroundColor: "#ffede5", paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  noticeText: { color: "#805032", fontSize: 11, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  emptyText: { color: "#4b240a", fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center" },
  loginBtn: { marginTop: 14, borderRadius: 18, backgroundColor: "#a33800", paddingHorizontal: 18, paddingVertical: 10 },
  loginBtnText: { color: "#ffefeb", fontSize: 13, fontWeight: "900" },
  message: { maxWidth: "84%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  messageAgent: { backgroundColor: "#ffffff", alignSelf: "flex-start" },
  messageUser: { backgroundColor: "#a33800", alignSelf: "flex-end" },
  messageText: { color: "#4b240a", fontSize: 14, lineHeight: 20 },
  messageTextUser: { color: "#ffefeb" },
  footer: { borderTopWidth: 1, borderTopColor: "#a3380018", backgroundColor: "#fff7f3", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 10 },
  quickRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickChip: { borderRadius: 999, backgroundColor: "#ffede5", paddingHorizontal: 10, paddingVertical: 8 },
  quickChipText: { color: "#805032", fontSize: 12, fontWeight: "700" },
  composeRow: { borderRadius: 16, backgroundColor: "#ffffff", minHeight: 48, flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  composeInput: { flex: 1, color: "#4b240a", fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#a33800", alignItems: "center", justifyContent: "center" }
});
