import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { createLock, listLocks, overrideLock, AppLockDto } from "../lib/api";
import { useRouter } from "expo-router";

export default function LocksScreen() {
  const router = useRouter();
  const [locks, setLocks] = useState<AppLockDto[]>([]);
  const [appName, setAppName] = useState("");
  const [duration, setDuration] = useState("00:30:00");
  const [overridePassword, setOverridePassword] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listLocks();
      setLocks(data);
    } catch (e: any) {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!appName.trim()) {
      alert("Enter app name");
      return;
    }
    try {
      setLoading(true);
      await createLock(appName.trim(), duration);
      setAppName("");
      await load();
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Failed to create lock";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (name: string) => {
    if (!overridePassword) {
      alert("Enter app password to override");
      return;
    }
    try {
      setLoading(true);
      await overrideLock(name, overridePassword);
      setOverridePassword("");
      await load();
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Failed to override";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}> 
        <Text style={styles.headerText}>App Locks</Text>
      </View>

      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="App name (e.g., Instagram)"
          placeholderTextColor="#888"
          value={appName}
          onChangeText={setAppName}
        />
        <TextInput
          style={styles.input}
          placeholder="HH:MM:SS (30 mins = 00:30:00)"
          placeholderTextColor="#888"
          value={duration}
          onChangeText={setDuration}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreate} disabled={loading}>
          <Ionicons name="lock-closed" size={16} color="#fff" />
          <Text style={styles.primaryText}>{loading ? "Please wait..." : "Create Lock"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overrideRow}>
        <TextInput
          style={styles.input}
          placeholder="App Password to override"
          placeholderTextColor="#888"
          secureTextEntry
          value={overridePassword}
          onChangeText={setOverridePassword}
        />
        <Text style={styles.helper}>Enter once, then tap Override on a lock</Text>
      </View>

      <FlatList
        data={locks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.appName}</Text>
              <Text style={styles.cardMeta}>Duration: {item.lockDuration}</Text>
              <Text style={styles.cardMeta}>Started: {new Date(item.startTime).toLocaleString()}</Text>
              <Text style={styles.status}>Status: {item.isLocked ? "Locked" : "Unlocked"}</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, { opacity: overridePassword ? 1 : 0.8 }]}
              onPress={() => handleOverride(item.appName)}
            >
              <Ionicons name="key" size={16} color="#4b63c3" />
              <Text style={styles.secondaryText}>Override</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 20 }}>
            {loading ? "Loading..." : "No locks yet. Create one above."}
          </Text>
        )}
      />

      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerText: { fontSize: 20, fontWeight: "800", color: "#111827" },
  formRow: { paddingHorizontal: 20, gap: 10 },
  overrideRow: { paddingHorizontal: 20, marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    color: "#333",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: "#4b63c3",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  helper: { color: "#6B7280", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardMeta: { color: "#6B7280", marginTop: 2 },
  status: { marginTop: 4, color: "#374151", fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#4b63c3",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryText: { color: "#4b63c3", fontWeight: "700" },
});


