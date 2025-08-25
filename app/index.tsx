import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";

const meditations = [
  {
    id: "1",
    title: "Deep Meditation to relax",
    duration: "12:25 Min.",
    color: "#FBE7E7",
  },
  {
    id: "2",
    title: "Complete focus of mind",
    duration: "12:25 Min.",
    color: "#D7ECFB",
  },
  {
    id: "3",
    title: "Relaxing meditation to soul",
    duration: "12:25 Min.",
    color: "#E5DDFB",
  },
  {
    id: "4",
    title: "Deep sleep of mind",
    duration: "12:25 Min.",
    color: "#CFF8F9",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);

  const goToChat = () => {
    router.push("/chat");
  };

  const goToLogin = () => {
    router.push("/login");
  };

  const goToProfile = () => {
    router.push("/profile")
  }

  const goToMusic = () => {
    router.push("/music")
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.topRowLeft}>
            <Image source={{ uri: "https://i.pravatar.cc/100?img=12" }} style={styles.avatar} />
            <View>
              <Text style={styles.greetingLabel}>Morning!</Text>
              <Text style={styles.greetingName}>Cinzel</Text>
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

        <Text style={styles.heading}>For a better <Text style={styles.youText}>YOU</Text></Text>

        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>Discover</Text>
          <Ionicons name="arrow-forward" size={16} color="#555" />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.modalText}>• New session "Stress Relief" added</Text>
            <Text style={styles.modalText}>• Don’t forget to hydrate 💧</Text>
            <Pressable
              onPress={() => setShowNotification(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <FlatList
        data={meditations}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: item.color }]}> 
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.duration}>{item.duration}</Text>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.chatButton} onPress={goToChat}>
        <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
        <Text style={styles.chatButtonText}>Chat with AI</Text>
      </TouchableOpacity>

      <BottomNav active="home" />
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  topRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationRow: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  avatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  greetingLabel: { fontSize: 12, color: "#6B7280" },
  greetingName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  loginCta: { flexDirection: "row", backgroundColor: "#7289DA", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: "center" },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 14, marginLeft: 6 },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    marginVertical: 12,
    color: "#111827",
  },
  youText: {
    color: "#4b63c3",
    fontWeight: "800",
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  moreText: {
    marginRight: 4,
    color: "#6B7280",
  },
  iconButton: { backgroundColor: "#E7ECFF", padding: 8, borderRadius: 10 },
  card: {
    width: cardWidth,
    height: 140,
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 15,
    color: "#333",
  },
  duration: {
    fontSize: 12,
    color: "#666",
  },
  playButton: {
    backgroundColor: "#7289DA",
    alignSelf: "flex-end",
    borderRadius: 20,
    padding: 10,
  },
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
  chatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  
  gridContent: { padding: 20, paddingBottom: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  modalText: {
    fontSize: 15,
    marginBottom: 8,
    color: "#555",
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: "#7289DA",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
});
