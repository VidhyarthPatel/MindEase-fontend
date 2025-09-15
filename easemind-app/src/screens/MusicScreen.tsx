import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { AppBlockingService, type UsageItem } from "../nativeModules/AppBlockingService";
import { totalTimeStr } from "../utils/timeUtils"; // Assuming this utility function exists

const screenWidth = Dimensions.get("window").width;

export default function MusicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [totalScreenTime, setTotalScreenTime] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const granted = await AppBlockingService.hasUsageAccessPermission();
      setHasPermission(granted);
      if (!granted) return;

      const data = await AppBlockingService.getUsageStats(1); // Fetching today's usage
      setUsage(data);
      const total = data.reduce((acc, item) => acc + item.totalTimeForegroundMs, 0);
      setTotalScreenTime(total);
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { paddingBottom: 70 + insets.bottom }]} edges={["top", "left", "right"]}>
        <Text style={styles.header}>Today's Screen Time</Text>

        {!hasPermission ? (
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 16, color: "#374151", marginBottom: 10 }}>
              To show today's screen time, enable Usage Access for Easemind.
            </Text>
            <TouchableOpacity
              onPress={() => AppBlockingService.openUsageAccessSettings()}
              style={{ backgroundColor: "#4b63c3", padding: 12, borderRadius: 8, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Open Usage Access Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 20 }}>
            <Text style={styles.totalTime}>Total Screen Time: {totalTimeStr(totalScreenTime)}</Text>
            <FlatList
              data={usage}
              keyExtractor={(item) => item.packageName}
              contentContainerStyle={{ paddingBottom: 16 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <View style={styles.card}>
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
          </View>
        )}
      </SafeAreaView>
      <BottomNav active="music" />
    </View>
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
  totalTime: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: "#E5DDFB",
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
});