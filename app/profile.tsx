import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { getMe, updateMe, clearToken } from "../lib/api";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("Cinzel Patel");
  const [age, setAge] = useState("22");
  const [avatarUrl, setAvatarUrl] = useState("https://i.pravatar.cc/150?img=12");
  const [stressLevel, setStressLevel] = useState("Low");
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [moodToday, setMoodToday] = useState("Happy");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await getMe();
        setName(me.userName || "");
        setEmail(me.email || "");
      } catch (e: any) {
        // If unauthorized, redirect to login
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateMe({
        userName: name,
        email,
        password: "", // no password change from here
        confirmPassword: "",
        appPassword: "",
      });
      setEditMode(false);
      alert("Profile updated");
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Update failed";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    router.replace("/login");
  };

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={["top", "left", "right"]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Text style={styles.headerText}>{loading ? "Loading..." : "Your Profile"}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (editMode) handleSave();
              else setEditMode(true);
            }}
          >
            <Ionicons name={editMode ? "save" : "create-outline"} size={18} color="#fff" />
            <Text style={styles.editButtonText}>{editMode ? "Save" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        {editMode && (
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            style={styles.input}
            placeholder="Avatar URL"
            placeholderTextColor="#888"
          />
        )}
        {editMode ? (
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.nameInput}
            placeholder="Your Name"
            placeholderTextColor="#888"
          />
        ) : (
          <Text style={styles.name}>{name}</Text>
        )}
        {editMode ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.nameInput}
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
          />
        ) : (
          <Text style={{ color: "#E5E7EB" }}>{email}</Text>
        )}
        <Text style={styles.tagline}>Mindful Warrior</Text>
      </View>
      </SafeAreaView>

      <View style={styles.cardContainer}>
        {editMode ? (
          <>
            <Text style={styles.cardLabel}>Age</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              style={styles.cardInput}
              placeholder="Your Age"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <Text style={styles.cardLabel}>Stress Level</Text>
            <TextInput
              value={stressLevel}
              onChangeText={setStressLevel}
              style={styles.cardInput}
              placeholder="Stress Level"
              placeholderTextColor="#999"
            />

            <Text style={styles.cardLabel}>Sleep Quality</Text>
            <TextInput
              value={sleepQuality}
              onChangeText={setSleepQuality}
              style={styles.cardInput}
              placeholder="Sleep Quality"
              placeholderTextColor="#999"
            />

            <Text style={styles.cardLabel}>Mood Today</Text>
            <TextInput
              value={moodToday}
              onChangeText={setMoodToday}
              style={styles.cardInput}
              placeholder="Mood"
              placeholderTextColor="#999"
            />
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👤 Age</Text>
              <Text style={styles.cardValue}>{age}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🧘 Stress Level</Text>
              <Text style={styles.cardValue}>{stressLevel}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛌 Sleep Quality</Text>
              <Text style={styles.cardValue}>{sleepQuality}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>😊 Mood Today</Text>
              <Text style={styles.cardValue}>{moodToday}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/locks") }>
          <Ionicons name="settings-outline" size={20} color="#4b63c3" />
          <Text style={styles.settingsText}>App Locks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#4b63c3" />
          <Text style={styles.settingsText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <BottomNav active="profile" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  headerContainer: {
    backgroundColor: "#4b63c3",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
  },
  editButton: {
    backgroundColor: "#3f57a8",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
  },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  nameInput: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    width: "90%",
    marginBottom: 6,
    color: "#333",
  },
  tagline: {
    fontSize: 13,
    color: "#E5E7EB",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    width: "90%",
    color: "#333",
    marginBottom: 8,
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },
  cardLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  cardInput: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  settingsText: {
    fontSize: 16,
    color: "#4b63c3",
    fontWeight: "600",
    marginLeft: 8,
  },
});
