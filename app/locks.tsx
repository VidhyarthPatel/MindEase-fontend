import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { AppBlockingService } from "../nativeModules/AppBlockingService";

interface AppLock {
  id: number;
  appName: string;
  lockDuration: string;
  startTime: string;
  isLocked: boolean;
}

interface SocialMediaApp {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SOCIAL_MEDIA_APPS: SocialMediaApp[] = [
  { name: "Instagram", icon: "logo-instagram", color: "#E4405F" },
  { name: "YouTube", icon: "logo-youtube", color: "#FF0000" },
  { name: "Twitter", icon: "logo-twitter", color: "#1DA1F2" },
  { name: "Facebook", icon: "logo-facebook", color: "#1877F2" },
  { name: "Snapchat", icon: "logo-snapchat", color: "#FFFC00" },
  { name: "TikTok", icon: "musical-notes", color: "#000000" },
  { name: "WhatsApp", icon: "logo-whatsapp", color: "#25D366" },
  { name: "Discord", icon: "logo-discord", color: "#5865F2" },
];

const DURATION_OPTIONS = [
  { label: "15 min", value: "00:15:00" },
  { label: "30 min", value: "00:30:00" },
  { label: "1 hour", value: "01:00:00" },
  { label: "2 hours", value: "02:00:00" },
  { label: "4 hours", value: "04:00:00" },
  { label: "8 hours", value: "08:00:00" },
];

export default function LocksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [locks, setLocks] = useState<AppLock[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("00:30:00");
  const [overridePassword, setOverridePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLocks, setLoadingLocks] = useState(true);
  const [hasAccessibilityPermission, setHasAccessibilityPermission] =
    useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);

  const api = axios.create({
    baseURL: "https://mindeasebackendv2.onrender.com",
    headers: { "Content-Type": "application/json" },
  });

  const withAuth = async () => {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadLocks = async () => {
    try {
      setLoadingLocks(true);
      const headers = await withAuth();
      const response = await api.get("/api/AppAutoLock", { headers });
      setLocks(response.data || []);
    } catch (error: any) {
      console.error("Load locks error:", error);
      Alert.alert("Error", "Failed to load locks");
    } finally {
      setLoadingLocks(false);
    }
  };

  const createLock = async () => {
    if (!selectedApp) {
      return Alert.alert("Error", "Please select an app");
    }
    try {
      setLoading(true);

      // Check accessibility permission first
      if (Platform.OS === "android") {
        const hasPermission =
          (await AppBlockingService.requestAccessibilityPermission()) ?? false;
        if (!hasPermission) {
          setLoading(false);
          return;
        }
      }

      const headers = await withAuth();
      await api.post(
        "/api/AppAutoLock",
        {
          appName: selectedApp,
          lockDuration: selectedDuration,
        },
        { headers }
      );

      // Block the app on device level
      if (Platform.OS === "android") {
        await AppBlockingService.blockApp(selectedApp);
        await loadBlockedApps();
      }

      Alert.alert(
        "Success",
        `${selectedApp} locked for ${
          DURATION_OPTIONS.find((d) => d.value === selectedDuration)?.label
        }`
      );
      setSelectedApp("");
      loadLocks();
    } catch (error: any) {
      console.error("Create lock error:", error);
      Alert.alert("Error", error.response?.data || "Failed to create lock");
    } finally {
      setLoading(false);
    }
  };

  const overrideLock = async (appName: string) => {
    if (!overridePassword) {
      return Alert.alert("Error", "Please enter your app password first");
    }
    try {
      setLoading(true);
      const headers = await withAuth();
      await api.post(
        "/api/AppAutoLock/override",
        {
          appName,
          appPassword: overridePassword,
        },
        { headers }
      );

      // Unblock the app on device level
      if (Platform.OS === "android") {
        await AppBlockingService.unblockApp(appName);
        await loadBlockedApps();
      }

      Alert.alert("Success", `${appName} unlocked successfully`);
      loadLocks();
    } catch (error: any) {
      console.error("Override lock error:", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to unlock");
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedApps = async () => {
    if (Platform.OS === "android") {
      try {
        const apps = await AppBlockingService.getBlockedApps();
        setBlockedApps(apps);
      } catch (error) {
        console.error("Error loading blocked apps:", error);
      }
    }
  };

  const checkAccessibilityPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const hasPermission =
          (await AppBlockingService.hasAccessibilityPermission()) ?? false;
        setHasAccessibilityPermission(hasPermission);
      } catch (error) {
        console.error("Error checking accessibility permission:", error);
      }
    }
  };

  useEffect(() => {
    loadLocks();
    checkAccessibilityPermission();
    loadBlockedApps();
  }, []);

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getTimeRemaining = (startTime: string, duration: string) => {
    const start = new Date(startTime);
    const durationMs = new Date(`1970-01-01T${duration}Z`).getTime();
    const endTime = new Date(start.getTime() + durationMs);
    const now = new Date();
    if (now >= endTime) return "Expired";

    const remaining = endTime.getTime() - now.getTime();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor(
      (remaining % (1000 * 60 * 60)) / (1000 * 60)
    );
    return `${hours}h ${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageWrapper}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="lock-closed" size={24} color="#4b63c3" />
            </View>
            <View>
              <Text style={styles.title}>App Locks</Text>
              <Text style={styles.subtitle}>
                Control your social media usage
              </Text>
            </View>
          </View>

          {/* Permission Status */}
          {Platform.OS === "android" && (
            <View style={styles.card}>
              <View style={styles.permissionHeader}>
                <Ionicons
                  name={
                    hasAccessibilityPermission
                      ? "shield-checkmark"
                      : "shield-outline"
                  }
                  size={24}
                  color={hasAccessibilityPermission ? "#10b981" : "#ef4444"}
                />
                <Text style={styles.sectionTitle}>
                  {hasAccessibilityPermission
                    ? "App Blocking Active"
                    : "Permission Required"}
                </Text>
              </View>
              <Text style={styles.helper}>
                {hasAccessibilityPermission
                  ? "Apps will be blocked when you try to open them"
                  : "Enable accessibility permission to block apps on your device"}
              </Text>
              {!hasAccessibilityPermission && (
                <TouchableOpacity
                  style={styles.permissionBtn}
                  onPress={() =>
                    AppBlockingService.requestAccessibilityPermission()
                  }
                >
                  <Text style={styles.permissionBtnText}>Enable Permission</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Create Lock Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lock an App</Text>
            <Text style={styles.label}>Select App</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.appsScroll}
            >
              {SOCIAL_MEDIA_APPS.map((app) => (
                <TouchableOpacity
                  key={app.name}
                  style={[
                    styles.appButton,
                    {
                      backgroundColor:
                        selectedApp === app.name ? app.color : "#f3f4f6",
                    },
                  ]}
                  onPress={() => setSelectedApp(app.name)}
                >
                  <Ionicons
                    name={app.icon}
                    size={24}
                    color={selectedApp === app.name ? "#fff" : app.color}
                  />
                  <Text
                    style={[
                      styles.appText,
                      {
                        color: selectedApp === app.name ? "#fff" : "#374151",
                      },
                    ]}
                  >
                    {app.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Duration</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.durationScroll}
            >
              {DURATION_OPTIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.durationButton,
                    {
                      backgroundColor:
                        selectedDuration === duration.value
                          ? "#4b63c3"
                          : "#f3f4f6",
                    },
                  ]}
                  onPress={() => setSelectedDuration(duration.value)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color:
                          selectedDuration === duration.value
                            ? "#fff"
                            : "#374151",
                      },
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { opacity: selectedApp ? 1 : 0.5 },
              ]}
              onPress={createLock}
              disabled={loading || !selectedApp}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#fff" />
                  <Text style={styles.primaryText}>Lock App</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Override Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Override Settings</Text>
            <Text style={styles.helper}>
              Enter your app password to unlock apps when needed
            </Text>
            <TextInput
              style={styles.input}
              placeholder="App Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={overridePassword}
              onChangeText={setOverridePassword}
            />
          </View>

          {/* Active Locks */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Active Locks</Text>
            {loadingLocks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#4b63c3" />
                <Text style={styles.loadingText}>Loading locks...</Text>
              </View>
            ) : locks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="lock-open" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No active locks</Text>
                <Text style={styles.emptySubtext}>
                  Create your first lock above
                </Text>
              </View>
            ) : (
              locks.map((lock) => (
                <View key={lock.id} style={styles.lockItem}>
                  <View style={styles.lockInfo}>
                    <View style={styles.lockHeader}>
                      <Ionicons
                        name={
                          SOCIAL_MEDIA_APPS.find(
                            (app) => app.name === lock.appName
                          )?.icon || "phone-portrait"
                        }
                        size={20}
                        color={
                          SOCIAL_MEDIA_APPS.find(
                            (app) => app.name === lock.appName
                          )?.color || "#4b63c3"
                        }
                      />
                      <Text style={styles.lockAppName}>{lock.appName}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: lock.isLocked
                              ? "#ef4444"
                              : "#10b981",
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {lock.isLocked ? "Locked" : "Unlocked"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.lockMeta}>
                      Started: {formatTime(lock.startTime)} • Duration:{" "}
                      {
                        DURATION_OPTIONS.find(
                          (d) => d.value === lock.lockDuration
                        )?.label
                      }
                    </Text>
                    {lock.isLocked && (
                      <Text style={styles.timeRemaining}>
                        Time remaining:{" "}
                        {getTimeRemaining(lock.startTime, lock.lockDuration)}
                      </Text>
                    )}
                  </View>
                  {lock.isLocked && (
                    <TouchableOpacity
                      style={[
                        styles.overrideBtn,
                        { opacity: overridePassword ? 1 : 0.5 },
                      ]}
                      onPress={() => overrideLock(lock.appName)}
                      disabled={!overridePassword || loading}
                    >
                      <Ionicons name="key" size={16} color="#4b63c3" />
                      <Text style={styles.overrideText}>Override</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <BottomNav active="profile" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  pageWrapper: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5EDFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: "#6B7280", fontWeight: "400" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    marginTop: 10,
    fontWeight: "500",
  },
  appsScroll: { marginBottom: 20 },
  appButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    marginRight: 14,
    alignItems: "center",
    minWidth: 80,
    backgroundColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  appText: { fontSize: 13, fontWeight: "500", marginTop: 6 },
  durationScroll: { marginBottom: 20 },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  durationText: { fontSize: 15, fontWeight: "500" },
  primaryBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  helper: { color: "#6B7280", fontSize: 13, marginBottom: 14, lineHeight: 18 },
  input: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    fontSize: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginBottom: 14,
  },
  loadingContainer: { alignItems: "center", padding: 24 },
  loadingText: { color: "#6B7280", marginTop: 10, fontSize: 14 },
  emptyContainer: { alignItems: "center", padding: 36 },
  emptyText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  emptySubtext: { fontSize: 15, color: "#9ca3af", marginTop: 6 },
  lockItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 10,
  },
  lockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  lockAppName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  lockMeta: { fontSize: 13, color: "#6B7280", marginBottom: 3 },
  timeRemaining: { fontSize: 13, color: "#DC2626", fontWeight: "600" },
  overrideBtn: {
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overrideText: { color: "#3740C3", fontSize: 13, fontWeight: "600" },
  permissionBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  permissionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  permissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  lockInfo: { flex: 1, marginRight: 10 },
});
