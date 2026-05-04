import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const conciergeImg =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC36was0AbUnBDdWfTwlnO8bwpkF3_bx6TZG1nGyQqWvkCoA2NSgmlpkFELw_L9uYpOeaGDDQTogN0-u7rp2PHZaKOnqiBGKFiQbzHBoZarn1LG0BpkoJF33MZeX030Q7rcm_FVrW45sS7_km9V2Cl1vzDu6I3bGUI9lrJJTZClEy3mT4Ux8MsXmoVJxmSLXPnxzRmev86yRj-ZCtI9QxltXPoFbJkwinAB062idouhsU6dfQ28LdRGk6TRKZlKXG3rmIuuIW-EhUCk";

const tags = ["Friendly", "Fast Response", "Very Helpful", "Professional", "Proactive"];

export function SmagRateConciergeNative() {
  const router = useAppRouter();
  const [rating, setRating] = useState(4);
  const [selected, setSelected] = useState<string[]>(["Friendly"]);
  const [feedback, setFeedback] = useState("");
  const submitFeedback = () => {
    Alert.alert(
      "Feedback submitted",
      "Thank you for rating your concierge experience.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  };

  const toggleTag = (tag: string) =>
    setSelected((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
        </Pressable>
        <Text style={styles.topTitle}>Rate Concierge</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <AppImage source={{ uri: conciergeImg }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color="#fff" />
            </View>
          </View>
          <Text style={styles.name}>Elena Rostova</Text>
          <Text style={styles.role}>VIP Lifestyle Concierge</Text>
        </View>

        <View style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>RATE HER SERVICE</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)}>
                <MaterialIcons
                  name={i <= rating ? "star" : "star-border"}
                  size={40}
                  color={i <= rating ? "#FF5C00" : "#ffdbc9"}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>What stood out?</Text>
        <View style={styles.tagsWrap}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.tag, selected.includes(tag) && styles.tagActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selected.includes(tag) && styles.tagTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Share more details</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={4}
          placeholder="Elena was amazing at handling my last minute dinner reservation..."
          placeholderTextColor="#80503280"
          value={feedback}
          onChangeText={setFeedback}
        />

        <Pressable style={styles.submitBtn} onPress={submitFeedback}>
          <Text style={styles.submitText}>Submit Feedback</Text>
          <MaterialIcons name="send" size={18} color="#ffefeb" />
        </Pressable>
        <Text style={styles.disclaimer}>
          Your feedback helps us maintain our 5-star VIP service standards.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10
  },
  iconBtn: { padding: 8, borderRadius: 999 },
  topTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  content: { padding: 20, paddingBottom: 40 },
  heroSection: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 120, height: 120, borderRadius: 16, borderWidth: 4, borderColor: "#fff" },
  verifiedBadge: {
    position: "absolute", bottom: -4, right: -4,
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#a33800",
    alignItems: "center", justifyContent: "center"
  },
  name: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  role: { color: "#805032", fontSize: 14, fontWeight: "600", marginTop: 2 },
  ratingCard: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 24,
    alignItems: "center", marginBottom: 20
  },
  ratingLabel: { color: "#805032", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 12 },
  stars: { flexDirection: "row", gap: 4 },
  sectionTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900", marginBottom: 12 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  tag: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: "#ffdbc9"
  },
  tagActive: { backgroundColor: "#a33800" },
  tagText: { color: "#4b240a", fontWeight: "700", fontSize: 13 },
  tagTextActive: { color: "#fff" },
  textarea: {
    backgroundColor: "#ffede5", borderRadius: 14, padding: 16,
    color: "#4b240a", fontSize: 14, minHeight: 110, textAlignVertical: "top", marginBottom: 20
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 18, marginBottom: 12
  },
  submitText: { color: "#ffefeb", fontWeight: "900", fontSize: 16 },
  disclaimer: { color: "#80503280", fontSize: 11, textAlign: "center", paddingHorizontal: 20 }
});
