import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { login, registerUser } from "../lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (isSignUp) {
        if (password !== confirmPassword) {
          alert("Passwords do not match!");
          return;
        }
        await registerUser({
          userName: email.split("@")[0] || "user",
          email,
          password,
          confirmPassword,
          appPassword,
        });
        // After registration, log in
        await login(email, password);
        alert("Signed up successfully!");
      } else {
        await login(email, password);
        alert("Logged in successfully!");
      }
      router.replace("/");
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Something went wrong";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <SafeAreaView style={{ width: "100%", alignItems: "center" }} edges={["top", "left", "right"]}>
      <Ionicons name="person-circle-outline" size={64} color="#4b63c3" style={{ marginBottom: 16 }} />
      <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="email-address"
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
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      )}
      {isSignUp && (
        <TextInput
          placeholder="App Password (for overrides)"
          placeholderTextColor="#aaa"
          style={styles.input}
          secureTextEntry
          value={appPassword}
          onChangeText={setAppPassword}
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? "Please wait..." : isSignUp ? "Create account" : "Log in"}</Text>
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
    container: {
      flex: 1,
      backgroundColor: "#F7F8FA",
      paddingHorizontal: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 16,
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
    submitButton: {
      backgroundColor: "#4b63c3",
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: 10,
      width: "100%",
      alignItems: "center",
      marginTop: 10,
    },
    submitText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    switchText: {
      color: "#4b63c3",
      marginTop: 16,
      fontSize: 14,
    },
  });
  