import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";
import { subscribeOrder, type Order } from "@/lib/firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

export function SmagRateYourExperienceNative() {
  const router = useAppRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [foodRating, setFoodRating] = useState(4);
  const [driverRating, setDriverRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    return subscribeOrder(orderId, (data) => setOrder(data));
  }, [orderId]);

  const firstItem = order?.items[0];
  const restaurantName = order?.restaurantName ?? "";
  const driverName = order?.driverName ?? "Your Driver";
  const driverAvatarUrl = order?.driverAvatarUrl ?? "";

  const openAddPhoto = () => {
    Alert.alert("Add photos", "Photo attachments for order reviews will be available in the next update.");
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const functions = getFunctions(getApp(), "us-central1");
      const fn = httpsCallable<{
        orderId: string;
        restaurantId?: string;
        foodRating: number;
        driverRating: number;
        review: string;
      }, { ok: boolean }>(functions, "onReviewCreated");
      await fn({
        orderId: orderId ?? "",
        restaurantId: order?.restaurantId,
        foodRating,
        driverRating,
        review: review.trim()
      });
      Alert.alert(
        "Review submitted",
        "Thanks for sharing your experience. Your feedback helps the Smag community.",
        [{ text: "Go to Orders", onPress: () => router.push("/smag_order_history") }, { text: "Close" }]
      );
    } catch {
      Alert.alert("Error", "Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
        </Pressable>
        <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headline}>Rate Your Experience</Text>
        <Text style={styles.sub}>How was your meal from {restaurantName || "the restaurant"}?</Text>

        {firstItem && (
          <View style={styles.orderCard}>
            <AppImage source={{ uri: firstItem.imageUrl }} style={styles.orderImage} />
            <View>
              <Text style={styles.orderTag}>RECENT ORDER</Text>
              <Text style={styles.orderTitle}>{firstItem.name}</Text>
              <View style={styles.orderRestRow}>
                <MaterialIcons name="restaurant" size={14} color="#805032" />
                <Text style={styles.orderRest}>{restaurantName}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.ratingLabel}>TASTE &amp; QUALITY</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setFoodRating(i)} accessibilityRole="button" accessibilityLabel={`Rate food ${i} star${i !== 1 ? "s" : ""}`}>
              <MaterialIcons
                name={i <= foodRating ? "star" : "star-border"}
                size={48}
                color={i <= foodRating ? "#a33800" : "#ffdbc9"}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverLeft}>
            <AppImage source={{ uri: driverAvatarUrl }} style={styles.driverAvatar} />
            <View>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.driverRole}>Delivery Driver</Text>
            </View>
          </View>
          <View style={styles.driverStars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setDriverRating(i)} accessibilityRole="button" accessibilityLabel={`Rate driver ${i} star${i !== 1 ? "s" : ""}`}>
                <MaterialIcons
                  name={i <= driverRating ? "star" : "star-border"}
                  size={24}
                  color={i <= driverRating ? "#7e5200" : "#ffdbc9"}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.textareaWrap}>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={5}
            placeholder="Tell us more about your experience..."
            placeholderTextColor="#80503260"
            value={review}
            onChangeText={setReview}
            accessibilityLabel="Review text input"
          />
          <Text style={styles.optional}>Optional</Text>
        </View>

        <Pressable style={styles.photoBtn} onPress={openAddPhoto} accessibilityRole="button" accessibilityLabel="Add photos to review">
          <View style={styles.photoIcon}>
            <MaterialIcons name="add-a-photo" size={24} color="#a33800" />
          </View>
          <Text style={styles.photoBtnTitle}>Add Photos</Text>
          <Text style={styles.photoBtnSub}>Show others what they're missing!</Text>
        </Pressable>

        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submitReview}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit review"
          accessibilityState={{ busy: submitting }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Review</Text>}
        </Pressable>
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
  brand: { width: 80, height: 36 },
  content: { padding: 20, paddingBottom: 40 },
  headline: { color: "#4b240a", fontSize: 32, fontWeight: "900", textAlign: "center" },
  sub: { color: "#805032", fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 20 },
  orderCard: {
    flexDirection: "row", gap: 16, backgroundColor: "#ffffff",
    borderRadius: 16, padding: 12, marginBottom: 24, alignItems: "center"
  },
  orderImage: { width: 80, height: 80, borderRadius: 12 },
  orderTag: { color: "#a33800", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  orderTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900", marginTop: 2 },
  orderRestRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  orderRest: { color: "#805032", fontSize: 13, fontWeight: "600" },
  ratingLabel: { color: "#805032", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textAlign: "center", marginBottom: 10 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20 },
  driverCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#ffede5", borderRadius: 16, padding: 14, marginBottom: 20
  },
  driverLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#fff" },
  driverName: { color: "#4b240a", fontWeight: "800", fontSize: 15 },
  driverRole: { color: "#805032", fontSize: 11, fontWeight: "600" },
  driverStars: { flexDirection: "row", gap: 2 },
  textareaWrap: { position: "relative", marginBottom: 16 },
  textarea: {
    backgroundColor: "#ffede5", borderRadius: 14, padding: 16,
    color: "#4b240a", fontSize: 14, minHeight: 130, textAlignVertical: "top"
  },
  optional: { position: "absolute", bottom: 10, right: 14, color: "#80503260", fontSize: 11, fontWeight: "700" },
  photoBtn: {
    borderWidth: 2, borderStyle: "dashed", borderColor: "#dd9f7c50",
    borderRadius: 14, paddingVertical: 24, alignItems: "center", gap: 6, marginBottom: 20
  },
  photoIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "#ffede5",
    alignItems: "center", justifyContent: "center"
  },
  photoBtnTitle: { color: "#4b240a", fontWeight: "800", fontSize: 15 },
  photoBtnSub: { color: "#805032", fontSize: 12 },
  submitBtn: {
    backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 18, alignItems: "center"
  },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 17 }
});
