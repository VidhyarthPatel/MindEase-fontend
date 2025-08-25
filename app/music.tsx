import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
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
    title: "Soothing Rain Sounds",
    duration: "10:00 Min",
    color: "#FBE7E7",
  },
  {
    id: "2",
    title: "Morning Clarity Tones",
    duration: "12:30 Min",
    color: "#D7ECFB",
  },
  {
    id: "3",
    title: "Chakra Healing Vibes",
    duration: "15:00 Min",
    color: "#E5DDFB",
  },
  {
    id: "4",
    title: "Deep Sleep Music",
    duration: "20:00 Min",
    color: "#CFF8F9",
  },
  {
    id: "5",
    title: "Peaceful River Flow",
    duration: "8:45 Min",
    color: "#FDF6D9",
  },
  {
    id: "6",
    title: "Relaxing Flute Session",
    duration: "9:30 Min",
    color: "#E0F9E8",
  },
];

const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - 60) / 2;

export default function MeditateMusicScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.header}>Meditation Music</Text>

      <FlatList
        data={meditations}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 20 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => {
              alert(`Play: ${item.title}`);
            }}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.duration}>{item.duration}</Text>
            <View style={styles.playButton}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bottom Tab */}
      {/* <View style={styles.bottomTab}>
        <Ionicons name="aperture-outline" size={24} color="#999" />
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={24}
          color="#999"
          onPress={() => router.push("/chat")}
        />
        <Ionicons
          name="musical-notes"
          size={24}
          color="#7289DA"
          style={{ transform: [{ scale: 1.2 }] }}
        />
        <Ionicons
          name="person-outline"
          size={24}
          color="#999"
          onPress={() => router.push("/profile")}
        />
      </View> */}
      <BottomNav active="music" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
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
    backgroundColor: "#4b63c3",
    alignSelf: "flex-end",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  bottomTab: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
});
