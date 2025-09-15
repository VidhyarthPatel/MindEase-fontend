import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BottomNavProps {
  active: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ active }) => {
  return (
    <View style={styles.bottomTab}>
      <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
        <Ionicons name="aperture-outline" size={24} color={active === "home" ? "#4b63c3" : "#999"} />
        <Text style={[styles.tabText, active === "home" && styles.activeText]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={active === "chat" ? "#4b63c3" : "#999"} />
        <Text style={[styles.tabText, active === "chat" && styles.activeText]}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
        <Ionicons name="musical-notes" size={24} color={active === "music" ? "#4b63c3" : "#999"} />
        <Text style={[styles.tabText, active === "music" && styles.activeText]}>Music</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
        <Ionicons name="person-outline" size={24} color={active === "profile" ? "#4b63c3" : "#999"} />
        <Text style={[styles.tabText, active === "profile" && styles.activeText]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTab: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  tab: {
    alignItems: "center",
  },
  tabText: {
    fontSize: 12,
    color: "#999",
  },
  activeText: {
    color: "#4b63c3",
    fontWeight: "600",
  },
});

export default BottomNav;