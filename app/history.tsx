import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

type HistoryItem = {
  dayUtc?: string;
  score?: number;
  breakReminders?: number;
  meditationReminders?: number;
  socialComparisonReminders?: number;
  productivityReminders?: number;
};

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get("/api/Productivity/history");
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#6B7280" }}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, idx) => String(idx)}
          contentContainerStyle={{ padding: 20, paddingBottom: 20 + insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Text style={{ color: "#6B7280", textAlign: "center", marginTop: 30 }}>No history</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.dayUtc ? new Date(item.dayUtc).toDateString() : "Unknown Day"}</Text>
                <Text style={styles.rowSub}>Score: {item.score ?? 0}</Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>{item.score ?? 0}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  backBtn: { height: 36, width: 36, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 14, borderRadius: 14 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  rowSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  scorePill: { backgroundColor: "#111827", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
  scorePillText: { color: "#fff", fontWeight: "800" },
});


