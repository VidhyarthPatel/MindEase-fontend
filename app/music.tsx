import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { AppBlockingService, type UsageItem } from "../nativeModules/AppBlockingService";
const screenWidth = Dimensions.get("window").width;
const cardWidth = (screenWidth - 60) / 2;

export default function AppUsageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const granted = await AppBlockingService.hasUsageAccessPermission();
      setHasPermission(granted);
      if (!granted) return;
      const data = await AppBlockingService.getUsageStats(7);
      setUsage(data);
    })();
  }, []);

  const totalTimeStr = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Check overlay permission (native module recommended for real check)
  const checkOverlayPermission = async () => {
    if (Platform.OS === "android") {
      // You need a native module for a real check, but you can open settings like this:
      await Linking.openSettings(); // Or use a native module to open overlay settings directly
    }
  };

  // To open overlay settings:
  const openOverlaySettings = () => {
    if (Platform.OS === "android") {
      Linking.openURL("package:com.yourpackagename"); // Or use a native module for ACTION_MANAGE_OVERLAY_PERMISSION
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.header}>App Usage (last 7 days)</Text>

      {!hasPermission ? (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, color: "#374151", marginBottom: 10 }}>
            To show app usage, enable Usage Access for MindEase.
          </Text>
          <TouchableOpacity
            onPress={() => AppBlockingService.openUsageAccessSettings()}
            style={{ backgroundColor: "#4b63c3", padding: 12, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Open Usage Access Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={usage}
          keyExtractor={(item) => item.packageName}
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingBottom: 100 + insets.bottom 
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => (
            <View style={[styles.card, { backgroundColor: index === 0 ? "#FBE7E7" : index === 1 ? "#D7ECFB" : "#E5DDFB" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardTitle}>{item.appName}</Text>
                <Text style={styles.duration}>{totalTimeStr(item.totalTimeForegroundMs)}</Text>
              </View>
              <View style={styles.playButton}>
                <Ionicons name="time" size={16} color="#fff" />
              </View>
            </View>
          )}
        />
      )}

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
    width: "100%",
    borderRadius: 16,
    padding: 14,
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
