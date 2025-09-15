import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";
import { AppBlockingService } from "../nativeModules/AppBlockingService";
import { Platform } from "react-native";

type TodayStat = {
  score?: number;
  breakReminders?: number;
  meditationReminders?: number;
  socialComparisonReminders?: number;
  productivityReminders?: number;
  recommendation?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showNotification, setShowNotification] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [today, setToday] = useState<TodayStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState<number | null>(null);

  const goToChat = () => router.push("/chat");
  const goToLogin = () => router.push("/login");
  const goToProfile = () => router.push("/profile");
  const goToMusic = () => router.push("/music");
  const goToHistory = () => router.push({ pathname: "/history" } as any);

  // Fetch today's productivity data
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      const name = await AsyncStorage.getItem("userName");
      setIsLoggedIn(!!token);
      setUserName(name);

      if (token) {
        try {
          setLoading(true);
          const res = await api.get("/api/Productivity/today", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setToday(res.data ?? null);
        } catch (e: any) {
          console.log("Error fetching today's productivity:", e);
          Alert.alert("Error", "Failed to fetch today's productivity data.");
          setToday(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch real device screen time (Android)
  useEffect(() => {
    const loadUsage = async () => {
      if (Platform.OS !== "android") return;
      try {
        const items = await AppBlockingService.getUsageStats(1);
        const totalMs = items.reduce((sum: number, it: any) => sum + (it.totalTimeForegroundMs || 0), 0);
        const minutes = Math.max(0, Math.round(totalMs / 60000));
        setScreenTimeMinutes(minutes);
      } catch (e) {
        setScreenTimeMinutes(null);
      }
    };
    loadUsage();
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 60) / 2;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.topRowLeft}>
            <Image source={{ uri: "https://i.pravatar.cc/100?img=12" }} style={styles.avatar} />
            <View>
              <Text style={styles.greetingLabel}>Good day</Text>
              <Text style={styles.greetingName}>{userName ?? "Guest"}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={goToLogin} style={styles.loginCta}>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notificationRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowNotification(true)}>
            <Ionicons name="notifications-outline" size={20} color="#4b63c3" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>
          For a better <Text style={styles.youText}>YOU</Text>
        </Text>

        <TouchableOpacity style={styles.moreButton} onPress={goToHistory}>
          <Text style={styles.moreText}>History</Text>
          <Ionicons name="calendar-outline" size={16} color="#555" />
        </TouchableOpacity>
      </View>

      {/* NOTIFICATION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotification}
        onRequestClose={() => setShowNotification(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔔 Notifications</Text>
            <Text style={styles.modalText}>• Meditation reminder at 8:00 PM</Text>
            <Text style={styles.modalText}>• New session &ldquo;Stress Relief&rdquo; added</Text>
            <Text style={styles.modalText}>• Don&apos;t forget to hydrate 💧</Text>
            <Pressable
              onPress={() => setShowNotification(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MAIN CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4b63c3" />
          <Text style={styles.loadingText}>Loading productivity…</Text>
        </View>
      ) : (
        <FlatList
          data={(today ? [
            screenTimeMinutes !== null ? { id: "phoneTime", title: "Phone Screen Time (24h)", value: `${screenTimeMinutes}m` } : null,
            { id: "score", title: "Today Score", value: `${today.score ?? 0}` },
            { id: "focus", title: "Productivity Reminders", value: `${today.productivityReminders ?? 0}` },
            { id: "breaks", title: "Break Reminders", value: `${today.breakReminders ?? 0}` },
            { id: "meditations", title: "Meditation Reminders", value: `${today.meditationReminders ?? 0}` },
            { id: "social", title: "Social Comparison", value: `${today.socialComparisonReminders ?? 0}` },
          ] : []).filter(Boolean) as { id: string; title: string; value: string; }[]}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.gridContent, { paddingBottom: 150 + insets.bottom }]}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isLoggedIn ? "No data for today" : "Login to view productivity"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { width: cardWidth }]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.duration}>{item.value}</Text>
              <View style={styles.playButton}>
                <Ionicons name="trending-up" size={18} color="#fff" />
              </View>
            </View>
          )}
          ListHeaderComponent={() =>
            today?.recommendation ? (
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationTitle}>Today&apos;s Recommendation:</Text>
                <Text style={styles.recommendationText}>{today.recommendation}</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* CHAT BUTTON */}
      <TouchableOpacity style={styles.chatButton} onPress={goToChat}>
        <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
        <Text style={styles.chatButtonText}>Chat with AI</Text>
      </TouchableOpacity>

      {/* BOTTOM NAV */}
      <BottomNav active="home" />
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - 60) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingTop: 20, paddingHorizontal: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  topRowLeft: { flexDirection: "row", alignItems: "center" },
  notificationRow: { alignItems: "flex-end", marginBottom: 12 },
  avatar: { height: 44, width: 44, borderRadius: 22, marginRight: 12 },
  greetingLabel: { fontSize: 12, color: "#6B7280" },
  greetingName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  loginCta: { flexDirection: "row", backgroundColor: "#7289DA", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: "center" },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 14, marginLeft: 6 },
  heading: { fontSize: 26, fontWeight: "800", marginVertical: 12, color: "#111827" },
  youText: { color: "#4b63c3", fontWeight: "800" },
  moreButton: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  moreText: { marginRight: 4, color: "#6B7280" },
  iconButton: { backgroundColor: "#E7ECFF", padding: 8, borderRadius: 10 },
  card: {
    height: 140,
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  cardTitle: { fontWeight: "600", fontSize: 15, color: "#333" },
  duration: { fontSize: 12, color: "#666" },
  playButton: { backgroundColor: "#7289DA", alignSelf: "flex-end", borderRadius: 20, padding: 10 },
  chatButton: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#4b63c3",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  chatButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  gridContent: { padding: 20 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#6B7280", marginTop: 10 },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#6B7280" },
  recommendationBox: { backgroundColor: "#E7ECFF", padding: 15, borderRadius: 15, marginBottom: 20 },
  recommendationTitle: { fontWeight: "700", fontSize: 16, marginBottom: 6, color: "#333" },
  recommendationText: { fontSize: 14, color: "#555" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 25, borderRadius: 15, width: "85%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" },
  modalText: { fontSize: 15, marginBottom: 8, color: "#555" },
  modalCloseButton: { marginTop: 12, alignSelf: "flex-end", backgroundColor: "#7289DA", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "600" },
});
