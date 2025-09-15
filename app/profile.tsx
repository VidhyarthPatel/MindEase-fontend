import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    appPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const api = axios.create({
    baseURL: "https://mindeasebackendv2.onrender.com",
    headers: { "Content-Type": "application/json" },
  });

  const withAuth = async () => {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadProfile = async () => {
    try {
      setInitializing(true);
      const headers = await withAuth();
      const res = await api.get("/api/User", { headers });
      setForm((f) => ({
        ...f,
        userName: res.data?.userName || "",
        email: res.data?.email || "",
      }));
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data || "Failed to load profile");
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateProfile = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }
    try {
      setLoading(true);
      const headers = await withAuth();
      const payload: any = {
        userName: form.userName,
        email: form.email,
      };
      if (form.password) payload.password = form.password;
      if (form.confirmPassword) payload.confirmPassword = form.confirmPassword;
      if (form.appPassword) payload.appPassword = form.appPassword;

      await api.put("/api/User", payload, { headers });
      Alert.alert("Success", "Profile updated");
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    Alert.alert("Confirm", "Delete your account? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const headers = await withAuth();
            const res = await api.delete("/api/User", { headers });
            if (res.status === 204 || res.status === 200) {
              await AsyncStorage.removeItem("token");
              router.replace("/login");
            } else {
              Alert.alert("Error", `Unexpected status: ${res.status}`);
            }
          } catch (e: any) {
            console.error("Delete account error:", e?.response?.status, e?.response?.data || e?.message);
            Alert.alert("Error", e?.response?.data || e?.message || "Delete failed");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4b63c3" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageWrapper}>
        <ScrollView contentContainerStyle={[styles.scrollContentWithBar, { paddingBottom: 110 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color="#4b63c3" />
            </View>
            <View>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Manage your account details</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={form.userName}
              onChangeText={(t) => setForm({ ...form, userName: t })}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Security</Text>
            <Text style={styles.label}>New Password (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
            />

            <Text style={styles.label}>App Password</Text>
            <TextInput
              style={styles.input}
              placeholder="App Password"
              secureTextEntry
              value={form.appPassword}
              onChangeText={(t) => setForm({ ...form, appPassword: t })}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={updateProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Danger zone</Text>
            <Text style={styles.helper}>Deleting your account is permanent.</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={deleteAccount} disabled={loading}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.dangerText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNav active="profile" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  pageWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  scrollContentWithBar: {
    padding: 16,
    paddingBottom: 110,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E6ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  primaryBtn: {
    backgroundColor: "#4b63c3",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dangerBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  dangerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  helper: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 12,
  },
});
