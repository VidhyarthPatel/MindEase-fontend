import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabKey = "home" | "chat" | "music" | "profile";

type Props = {
  active: TabKey;
};

export default function BottomNav({ active }: Props) {
  const router = useRouter();

  const go = (path: string) => {
    router.replace(path);
  };

  const getIcon = (key: TabKey) => {
    const isActive = active === key;
    const color = isActive ? "#374151" : "#6B7280"; // active darker gray

    switch (key) {
      case "home":
        return <Ionicons name={isActive ? "home" : "home-outline"} size={24} color={color} />;
      case "chat":
        return (
          <Ionicons
            name={isActive ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
            size={24}
            color={color}
          />
        );
      case "music":
        return (
          <Ionicons name={isActive ? "musical-notes" : "musical-notes-outline"} size={24} color={color} />
        );
      case "profile":
        return <Ionicons name={isActive ? "person" : "person-outline"} size={24} color={color} />;
    }
  };

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => go("/")} style={styles.item}>
          {getIcon("home")}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => go("/chat")} style={styles.item}>
          {getIcon("chat")}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => go("/music")} style={styles.item}>
          {getIcon("music")}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => go("/profile")} style={styles.item}>
          {getIcon("profile")}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => go("/locks")} style={styles.item}>
          <Ionicons name="lock-closed-outline" size={24} color={active === "profile" ? "#374151" : "#6B7280"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});


