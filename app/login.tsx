import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";
import { AppBlockingService } from "../nativeModules/AppBlockingService";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Signup handler
  const handleSignup = async () => {
    if (!userName || !email || !password || !confirmPassword || !appPassword) {
      return Alert.alert("Error", "Please fill all fields");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      setLoading(true);
      const response = await api.post("/api/auth/register", {
        userName,
        email,
        password,
        confirmPassword,
        appPassword,
      });

      Alert.alert("Success", "Account created successfully!");
      setIsSignUp(false); // Switch to login
    } catch (error: any) {
      console.error("Signup Error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Login handler
  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please enter email and password");
    }

    try {
      setLoading(true);
      const response = await api.post("/api/auth/login", { email, password });

      const token = response.data?.accessToken || response.data?.token;
      const returnedUserName = response.data?.userName || response.data?.username;

      if (!token) throw new Error("Token not received");

      await AsyncStorage.setItem("token", token);
      const nameToPersist = returnedUserName || userName || email.split("@")[0];
      await AsyncStorage.setItem("userName", nameToPersist);

      // 🔸 Initialize Android screen time service
      await initScreenTimeService(token);

      Alert.alert("Success", "Logged in successfully!");
      router.push("/"); // Navigate to home/dashboard
    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Initialize Android foreground service for screen time tracking
  const initScreenTimeService = async (token: string) => {
    try {
      const baseUrl = api.defaults.baseURL || "http://localhost:5281";

      await AppBlockingService.setAuthToken(token);
      await AppBlockingService.setBaseUrl(baseUrl);

      const hasUsage = await AppBlockingService.hasUsageAccessPermission();
      if (!hasUsage) {
        await AppBlockingService.openUsageAccessSettings();
        Alert.alert(
          "Permission Required",
          "Please grant usage access to track screen time."
        );
        return;
      }

      // Start foreground service
      await AppBlockingService.startScreenTimeService();

      // Optional: send initial screen time to backend
      await api.post("/api/MindfulReminder/productivity", { screenTimeMinutes: 0 });
    } catch (e) {
      console.error("Screen Time Service Error:", e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Ionicons name="person-circle-outline" size={64} color="#4b63c3" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>

        {isSignUp && (
          <TextInput
            placeholder="Username"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
          />
        )}

        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {isSignUp && (
          <>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#aaa"
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TextInput
              placeholder="App Password (for overrides)"
              placeholderTextColor="#aaa"
              style={styles.input}
              secureTextEntry
              value={appPassword}
              onChangeText={setAppPassword}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={isSignUp ? handleSignup : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{isSignUp ? "Create account" : "Log in"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA", paddingHorizontal: 24, justifyContent: "center", alignItems: "center" },
  safeArea: { width: "100%", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 16 },
  input: { width: "100%", backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, fontSize: 16, marginBottom: 12, borderColor: "#e5e7eb", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6 },
  submitButton: { backgroundColor: "#4b63c3", paddingVertical: 13, paddingHorizontal: 20, borderRadius: 10, width: "100%", alignItems: "center", marginTop: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchText: { color: "#4b63c3", marginTop: 16, fontSize: 14 },
});
