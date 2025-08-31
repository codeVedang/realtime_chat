import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import io from 'socket.io-client';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import MessageItem from '../components/MessageItem';
import RoomList from '../components/RoomList';
import OnlineUsers from '../components/OnlineUsers';
import TypingIndicator from '../components/TypingIndicator';
import RoomCreation from '../components/RoomCreation';
import axios from 'axios';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { user } = route.params;

  const backendUrl = "https://realtime-chat-6n47.onrender.com";
  const [socket, setSocket] = useState<any>(null);

  const [room, setRoom] = useState("general");
  const [rooms, setRooms] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | undefined>(undefined);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ username: string; text: string; createdAt?: string }[]>([]);

  // fetch rooms
  useEffect(() => {
    axios.get(`${backendUrl}/rooms`).then(res => setRooms(res.data));
  }, []);

  // connect socket
  useEffect(() => {
    const s = io(backendUrl, { transports: ["websocket"] });
    setSocket(s);

    s.emit("joinRoom", { room, username: user });

    s.on("chatHistory", (history) => setMessages(history));
    s.on("chatMessage", (msg) => setMessages(prev => [...prev, msg]));
    s.on("onlineUsers", (users) => setOnlineUsers(users));
    s.on("typing", ({ username, isTyping }) => {
      if (isTyping && username !== user) setTypingUser(username);
      else setTypingUser(undefined);
    });

    return () => {
      s.disconnect();
    };
  }, [room]);

  const sendMessage = () => {
    if (message.trim() && socket) {
      socket.emit("chatMessage", { room, username: user, text: message });
      setMessage("");
    }
  };

  const handleRoomCreated = (newRoom: string) => {
    setRooms(prev => [...prev, newRoom]);
    setRoom(newRoom);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <RoomList rooms={rooms} currentRoom={room} onSelectRoom={setRoom} />
          <RoomCreation backendUrl={backendUrl} onRoomCreated={handleRoomCreated} />
        </View>

        {/* Chat Section */}
        <View style={styles.chatSection}>
          <OnlineUsers users={onlineUsers} />

          <FlatList
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <MessageItem user={item.username} text={item.text} currentUser={user} />
            )}
          />

          <TypingIndicator typingUser={typingUser} />

          <View style={styles.inputRow}>
            <TextInput
              value={message}
              onChangeText={(txt) => {
                setMessage(txt);
                if (socket) {
                  socket.emit("typing", { room, username: user, isTyping: txt.length > 0 });
                }
              }}
              placeholder="Type message..."
              placeholderTextColor="#888"
              style={styles.input}
            />
            <Button title="Send" onPress={sendMessage} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  chatContainer: { flex: 1, flexDirection: "row" },
  sidebar: { width: 150, borderRightWidth: 1, borderColor: "#333", backgroundColor: "#1e1e1e" },
  chatSection: { flex: 1, padding: 10, backgroundColor: "#121212" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#333",
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 10,
    borderRadius: 20,
    marginRight: 5,
  },
});
