import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    { id: "1", from: "ai", text: "Hey there! How can I support your mental wellness today?" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;

    const newMsg = { id: Date.now().toString(), from: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-ai",
          from: "ai",
          text: "That's interesting! Can you tell me more?",
        },
      ]);
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Chat with AI</Text>
        </View>

      {/* Messages */}
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.from === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={{
                color: item.from === "user" ? "#fff" : "#333",
                fontSize: 15,
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }}
        inverted
      />

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            placeholder="Type your message..."
            placeholderTextColor="#aaa"
            style={styles.input}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <BottomNav active="chat" />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: "#4b63c3",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  messageBubble: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  userBubble: {
    backgroundColor: "#4b63c3",
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#EAEAEA",
    alignSelf: "flex-start",
  },
  inputArea: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    color: "#000",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  sendButton: {
    backgroundColor: "#4b63c3",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
});
